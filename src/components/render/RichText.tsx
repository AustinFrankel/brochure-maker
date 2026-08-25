import { clean } from '@/lib/sanitize';

/** Renders stored rich-text HTML. `inline` strips the paragraph block spacing. */
export function RichText({ html, className, style, inline }: {
  html: string; className?: string; style?: React.CSSProperties; inline?: boolean;
}) {
  return (
    <div
      className={`rb-rt${inline ? ' rb-rt-inline' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean(html) }}
    />
  );
}
