import type { TableData, Theme } from '@/lib/types';
import { fillToStyle, pt, resolveColor } from '@/lib/theme';

/**
 * The cyan bordered schedule box that appears under almost every program.
 * Header labels are underlined; every cell is bold, matching the Word original.
 */
export function InfoTable({ t, theme }: { t: TableData; theme: Theme }) {
  const border = `${t.borderWidth}px solid ${resolveColor(t.borderColor, theme) ?? '#000'}`;
  const total = t.cols.reduce((a, b) => a + b, 0) || 1;
  return (
    <table
      className="rb-table"
      style={{
        border: t.borderWidth ? border : undefined,
        fontSize: t.fontSize ? pt(t.fontSize) : undefined,
        ...fillToStyle(t.bodyFill, theme),
      }}
    >
      <colgroup>
        {t.cols.map((c, i) => <col key={i} style={{ width: `${(c / total) * 100}%` }} />)}
      </colgroup>
      {t.head.length > 0 && (
        <thead style={fillToStyle(t.headFill, theme)}>
          <tr>{t.head.map((h, i) => <th key={i}><span>{h}</span></th>)}</tr>
        </thead>
      )}
      <tbody>
        {t.rows.map((row, ri) => (
          <tr key={ri}>
            {t.cols.map((_, ci) => {
              const cell = row[ci] ?? '';
              // Long cells wrap; short schedule values are kept on one line.
              return <td key={ci} className={cell.length > 34 ? 'rb-cell-wrap' : undefined}>{cell}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
