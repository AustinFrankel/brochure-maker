import type {
  CoverProps, DirectoryBoxProps, FormFieldsProps, SidebarBoxProps, Theme,
} from '@/lib/types';
import { fillToStyle, FONTS, inch, pt, resolveColor } from '@/lib/theme';
import { SocialRow } from './media';

/** Page 1: cyan band → full-bleed photo → cyan band with registration info. */
export function Cover({ p, theme }: { p: CoverProps; theme: Theme }) {
  const band = fillToStyle(p.bandFill, theme);
  return (
    <div className="rb-cover">
      <div className="rb-cover-band rb-cover-top" style={band}>
        <div className="rb-cover-kicker">{p.kicker}</div>
        <div className="rb-cover-title">{p.title}</div>
        <div className="rb-cover-sub">{p.subtitle}</div>
      </div>
      <div className="rb-cover-photo" style={{ height: `${p.photoShare * 100}%` }}>
        {p.photo.url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.photo.url} alt="" style={{ objectPosition: p.photo.focal || 'center' }} />
          : <div className="rb-photo-empty" style={{ height: '100%' }}>Drop the cover photo here</div>}
      </div>
      <div className="rb-cover-band rb-cover-bottom" style={band}>
        {p.footer.map((line, i) =>
          line.text
            ? <div key={i} className="rb-cover-footline"
                   style={line.scale && line.scale !== 1 ? { fontSize: `${line.scale}em` } : undefined}>
                {line.text}
              </div>
            : <div key={i} className="rb-cover-gap" />)}
        {p.socials.length > 0 && (
          <SocialRow p={{ prefix: p.socialPrefix, items: p.socials, iconSize: 26, gap: 16 }} />
        )}
      </div>
    </div>
  );
}

/** Page 2: the cyan staff-directory panel beside the superintendent's letter. */
export function SidebarBox({ p }: { p: SidebarBoxProps }) {
  return (
    <div className="rb-sidebar" style={{ padding: pt(p.padding) }}>
      {p.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="rb-sidebar-logo" src={p.logo} alt="" />
      )}
      {p.title && <div className="rb-sidebar-title">{p.title}</div>}
      {p.groups.map((g, i) => (
        <div className="rb-sidebar-group" key={i}>
          {g.label && <div className="rb-sidebar-label">{g.label}</div>}
          {g.items.map((it, j) => <div className="rb-sidebar-item" key={j}>{it}</div>)}
        </div>
      ))}
    </div>
  );
}

/** Page 4: the cyan contents box with dotted leaders. */
export function DirectoryBox({ p, theme }: { p: DirectoryBoxProps; theme: Theme }) {
  return (
    <div
      className="rb-directory"
      style={{
        padding: pt(p.padding),
        border: p.borderWidth ? `${p.borderWidth}px solid ${resolveColor(p.borderColor, theme) ?? '#000'}` : undefined,
      }}
    >
      {p.title && (
        <div className="rb-directory-title" style={{ fontFamily: FONTS[p.titleFont]?.stack }}>
          {p.title}
        </div>
      )}
      <div className="rb-directory-list">
        {p.entries.map((e, i) => (
          <div className="rb-directory-row" key={i}>
            <span className="rb-directory-label">{e.label}</span>
            <span className="rb-directory-dots" aria-hidden />
            <span className="rb-directory-page">{e.page}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page 14: the mail-in registration form with ruled fill-in lines. */
export function FormFields({ p, theme }: { p: FormFieldsProps; theme: Theme }) {
  const line = resolveColor(p.lineColor, theme) ?? '#000';
  return (
    <div className="rb-form">
      {p.rows.map((row, i) => (
        <div className="rb-form-row" key={i}>
          {row.cells.map((c, j) => (
            <span className="rb-form-cell" key={j} style={{ flex: c.flex }}>
              {c.label && <span className="rb-form-label">{c.label}</span>}
              <span className="rb-form-line" style={{ borderBottomColor: line }} />
            </span>
          ))}
        </div>
      ))}
      {p.signatureLabel && (
        <div className="rb-form-sig">
          <span className="rb-form-line" style={{ borderBottomColor: line, width: inch(2.9) }} />
          <span className="rb-form-sig-label">{p.signatureLabel}</span>
        </div>
      )}
    </div>
  );
}
