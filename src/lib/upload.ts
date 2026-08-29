'use client';

import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';

/**
 * Uploads go from the browser straight to Supabase Storage.
 *
 * Straight to storage, rather than through this app's own API, because a
 * serverless request body caps out at 4.5MB and a phone photo routinely exceeds
 * that, and because importing a 14-page PDF means uploading a dozen page
 * images at once, which is not something to funnel through a function.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const BUCKET = 'media';

export const cloudReady = () => Boolean(URL_ && KEY);

let client: ReturnType<typeof createClient> | null = null;
const sb = () => (client ??= createClient(URL_, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
}));

/** A collision-proof, readable object name. */
function objectName(fileName: string, prefix: string) {
  const clean = fileName.replace(/[^\w.-]+/g, '-').replace(/^-+/, '').slice(-70) || 'image.jpg';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}/${stamp}/${Math.random().toString(36).slice(2, 10)}-${clean}`;
}

/** Stores a blob and returns a public URL. */
export async function uploadBlob(blob: Blob, fileName: string, prefix = 'uploads'): Promise<string> {
  if (!cloudReady()) return inlineFallback(blob);
  const name = objectName(fileName, prefix);
  const { error } = await sb().storage.from(BUCKET).upload(name, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
    cacheControl: '31536000',
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return sb().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

/**
 * With no storage configured, small images are embedded in the document so the
 * app still works end to end on a fresh clone. Large ones are refused rather
 * than silently bloating every save.
 */
function inlineFallback(blob: Blob): Promise<string> {
  if (blob.size > 1_200_000) {
    return Promise.reject(new Error(
      'No image storage is configured, so only images under about 1MB can be added. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to store them properly.',
    ));
  }
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('Could not read that image.'));
    r.readAsDataURL(blob);
  });
}

/**
 * A photo straight off a phone is often 8MB+. Shrink it first, since print
 * never needs more than about 2400px on the long edge, then upload.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');

  let payload: Blob = file;
  if (file.size > 400_000 && file.type !== 'image/gif') {
    try {
      payload = await imageCompression(file, {
        maxWidthOrHeight: 2400,
        maxSizeMB: 3.5,
        useWebWorker: true,
        initialQuality: 0.86,
        fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      });
    } catch {
      payload = file;   // compression is an optimisation, never a hard failure
    }
  }
  return uploadBlob(payload, file.name, 'photos');
}

/** Opens the OS picker (the camera roll on a phone) and returns the stored URL. */
export function pickImage(onPicked: (url: string) => void, onError?: (msg: string) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try { onPicked(await uploadImage(file)); }
    catch (e) { onError?.((e as Error).message); }
  };
  input.click();
}
