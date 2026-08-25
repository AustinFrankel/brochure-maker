'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { PhotoProps, QrProps, SocialKind, SocialRowProps, Theme } from '@/lib/types';
import { inch, pt, resolveColor } from '@/lib/theme';

export function Photo({ p, theme }: { p: PhotoProps; theme: Theme }) {
  if (!p.url) {
    return <div className="rb-photo-empty">Drop a photo here</div>;
  }
  const border = p.borderWidth
    ? `${p.borderWidth}px solid ${resolveColor(p.borderColor, theme) ?? '#000'}`
    : undefined;
  return (
    <figure className="rb-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.url}
        alt={p.alt}
        style={{
          width: '100%',
          height: p.height ? inch(p.height) : 'auto',
          objectFit: p.height ? p.fit : undefined,
          objectPosition: p.focal || 'center',
          border,
          borderRadius: p.radius ? `${p.radius}px` : undefined,
          display: 'block',
        }}
      />
      {p.caption && <figcaption className="rb-caption">{p.caption}</figcaption>}
    </figure>
  );
}

const SOCIAL_ICON: Record<SocialKind, string> = {
  x: '/seed/icon-x.png',
  instagram: '/seed/icon-instagram.png',
  facebook: '/seed/icon-facebook.png',
  web: '/seed/icon-web.png',
};

export function SocialRow({ p }: { p: SocialRowProps }) {
  return (
    <div className="rb-social" style={{ gap: pt(p.gap) }}>
      {p.prefix && <span className="rb-social-prefix">{p.prefix}</span>}
      {p.items.map((it, i) => (
        <span className="rb-social-item" key={i} style={{ gap: pt(p.gap * 0.45) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SOCIAL_ICON[it.icon]} alt="" style={{ height: pt(p.iconSize), width: 'auto' }} />
          <span>{it.handle}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * QR is generated from the URL rather than pasted as an image, so the code is
 * always in sync with wherever the registration page currently lives.
 */
export function Qr({ p }: { p: QrProps }) {
  // A supplied image wins outright; otherwise the code is generated in the
  // background and swapped in when it is ready.
  const [generated, setGenerated] = useState('');
  const src = p.imageUrl || generated;
  useEffect(() => {
    if (p.imageUrl) return;
    let alive = true;
    QRCode.toDataURL(p.data || ' ', { margin: 1, width: 900, errorCorrectionLevel: 'M' })
      .then((d) => { if (alive) setGenerated(d); })
      .catch(() => { if (alive) setGenerated(''); });
    return () => { alive = false; };
  }, [p.data, p.imageUrl]);

  return (
    <div className="rb-qr" style={{ width: inch(p.size) }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="QR code" style={{ width: '100%', display: 'block', border: '6px solid #000', borderRadius: 10 }} />
        : <div className="rb-photo-empty" style={{ aspectRatio: '1' }} />}
      {p.caption && <div className="rb-qr-caption">{p.caption}</div>}
    </div>
  );
}
