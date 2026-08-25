'use client';

import imageCompression from 'browser-image-compression';
import { upload } from '@vercel/blob/client';

/**
 * A photo straight off a phone is often 8MB+. Shrink it in the browser first —
 * print never needs more than about 2400px on the long edge at 300dpi for an
 * 8-inch-wide image — then upload direct to Blob.
 */
export async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');

  let payload: File = file;
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

  const safe = file.name.replace(/[^\w.-]+/g, '-').slice(-80) || 'photo.jpg';

  try {
    const blob = await upload(`photos/${safe}`, payload, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
      onUploadProgress: onProgress ? (p) => onProgress(p.percentage) : undefined,
    });
    return blob.url;
  } catch (err) {
    // No Blob store configured yet (local dev): inline it so the editor still
    // works end to end. Data URLs bloat the document, so keep them small.
    if (payload.size <= 1_200_000) {
      return await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(err);
        r.readAsDataURL(payload);
      });
    }
    throw new Error(
      'Upload failed. Connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN) to store photos.',
    );
  }
}

/** Opens the OS picker (camera roll on phones) and returns the uploaded URL. */
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
