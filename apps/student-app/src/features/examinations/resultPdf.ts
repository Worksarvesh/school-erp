import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { MockExamResult } from '@/mock/exams';
import { mockStudent } from '@/mock/student';

const esc = (s: string | number) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/** Printable report card for one exam result. */
export function resultHtml(
  result: MockExamResult,
  totals: { max: number; obtained: number; percent: number },
): string {
  const rows = result.subjects
    .map(
      (s) =>
        `<tr><td>${esc(s.subject)}</td><td>${esc(s.maxMarks)}</td><td><b>${esc(s.obtained)}</b></td><td>${esc(s.grade)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(result.title)} Result</title>
<style>
body{font-family:Helvetica,Arial,sans-serif;color:#111827;margin:32px}
h1{color:#5016A8;margin:0 0 4px;font-size:24px}
.muted{color:#6B7280;font-size:13px}
.info{display:flex;gap:24px;margin:16px 0;font-size:13px}
.box{border:1px solid #E4DAFB;border-radius:10px;padding:14px;margin:16px 0;display:flex;gap:32px}
.box b{display:block;font-size:22px;color:#3B0F8C}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#7C3AED;color:#fff;text-align:left;padding:8px}
td{padding:8px;border-bottom:1px solid #F3F4F6}
tfoot td{background:#F5F3FF;font-weight:bold}
</style></head><body>
<h1>${esc(result.title)}</h1>
<div class="muted">Academic Year: ${esc(result.academicYear)}</div>
<div class="info"><span>Name: <b>${esc(mockStudent.fullName)}</b></span><span>Roll No: <b>${esc(mockStudent.rollNumber)}</b></span></div>
<div class="info"><span>Class: <b>${esc(mockStudent.className)} - ${esc(mockStudent.section)}</b></span></div>
<div class="box">
<div><span class="muted">Total Score</span><b>${esc(totals.percent)}%</b></div>
<div><span class="muted">Status</span><b>${result.passed ? 'Pass' : 'Fail'}</b></div>
<div><span class="muted">Grade</span><b>${esc(result.overallGrade)}</b></div>
</div>
<table><thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td>Total Aggregated</td><td>${esc(totals.max)}</td><td>${esc(totals.obtained)}</td><td>${esc(totals.percent)}%</td></tr></tfoot>
</table></body></html>`;
}

/**
 * Saves the result as a PDF. On phones it creates the file and opens the share sheet (Save to
 * Files, Drive, WhatsApp...). On web it opens the browser print dialog, where "Save as PDF" saves it.
 */
export async function downloadResultPdf(html: string, title: string): Promise<void> {
  if (Platform.OS === 'web') {
    // expo-print on web prints the whole app page, so print the report from a hidden iframe.
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    if (!win) throw new Error('Print frame unavailable');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `${title} Result`,
  });
}
