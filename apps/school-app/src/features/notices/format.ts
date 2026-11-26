const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

/** "10 Nov 2025". `pad` writes the day with two digits ("01 Nov 2026"). */
export function formatDate(d: Date, pad = false): string {
  const day = pad ? String(d.getDate()).padStart(2, '0') : String(d.getDate());
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
