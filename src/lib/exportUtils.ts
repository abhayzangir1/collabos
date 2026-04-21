/**
 * CollabOS Export Utilities
 * Client-side export for PDF, CSV, JSON, and high-fidelity professional reports.
 * Uses jsPDF for PDF generation and html2canvas for chart captures.
 */

// ── CSV Export ───────────────────────────────────────────────────
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    downloadText(`${filename}.csv`, 'No data available\n');
    return;
  }
  const headers = Object.keys(data[0]!);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];
  downloadText(`${filename}.csv`, csvRows.join('\n'));
}

// ── JSON Export ──────────────────────────────────────────────────
export function exportJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadText(`${filename}.json`, json, 'application/json');
}

// ── PDF Export (simple data) ─────────────────────────────────────
export async function exportPDF(title: string, sections: { heading: string; content: string }[], filename: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 20, 25);
  let y = 45;

  for (const section of sections) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.heading, 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(section.content, 170);
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 6;
    }
    y += 6;
  }

  doc.save(`${filename}.pdf`);
}

// ── Professional Report Export ───────────────────────────────────
export async function exportProfessionalReport(config: {
  mononym: string;
  dateRange: string;
  trustScore: number;
  chartElements: { id: string; title: string }[];
  summaryMetrics: { label: string; value: string | number }[];
  filename: string;
}) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  const doc = new jsPDF('p', 'mm', 'a4');

  // Cover section
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(24);
  doc.text('CollabOS Analytics Report', 20, 30);
  doc.setFontSize(12);
  doc.setTextColor(200, 185, 154);
  doc.text(`${config.mononym}  ·  ${config.dateRange}`, 20, 42);
  doc.text(`Trust Score: ${config.trustScore}`, 20, 52);
  doc.setTextColor(0, 0, 0);

  let yPos = 70;

  // Capture each chart
  for (const chart of config.chartElements) {
    const el = document.getElementById(chart.id);
    if (!el) {
      // Skip with note
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`${chart.title}: No data available`, 20, yPos);
      yPos += 10;
      continue;
    }

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0D0B08', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 170;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (yPos + imgHeight + 15 > 280) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(chart.title, 20, yPos);
    yPos += 6;
    doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 10;
  }

  // Summary Metrics
  if (yPos + 40 > 280) { doc.addPage(); yPos = 20; }
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Metrics', 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  for (const metric of config.summaryMetrics) {
    if (yPos > 280) { doc.addPage(); yPos = 20; }
    doc.text(`${metric.label}: ${metric.value}`, 20, yPos);
    yPos += 7;
  }

  doc.save(`${config.filename}.pdf`);
}

// ── Proof Cards PDF Export ───────────────────────────────────────
export async function exportProofsPDF(proofs: { title: string; description: string; value: string; skill_tags: { domain: string; label: string }[]; is_locked: boolean }[], filename: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('ProofChain Export', 20, 25);
  doc.setFontSize(10);
  doc.text(`${proofs.length} proof(s) · Exported ${new Date().toLocaleDateString()}`, 20, 33);
  let y = 45;

  for (const proof of proofs) {
    if (y > 250) { doc.addPage(); y = 20; }

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(proof.title, 20, y);
    y += 7;

    // Status
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(proof.is_locked ? '🔒 Verified' : '◻ Unverified', 20, y);
    y += 6;

    // Description
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(proof.description || 'No description', 170);
    for (const line of descLines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 5;
    }
    y += 2;

    // Value
    if (proof.value) {
      doc.text(`Value: ${proof.value}`, 20, y);
      y += 6;
    }

    // Skill tags
    if (proof.skill_tags.length > 0) {
      const tagStr = proof.skill_tags.map((t) => `${t.domain} · ${t.label}`).join(', ');
      const tagLines = doc.splitTextToSize(`Tags: ${tagStr}`, 170);
      for (const line of tagLines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      }
    }

    y += 8;
    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y - 4, 190, y - 4);
  }

  doc.save(`${filename}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────────
function downloadText(filename: string, content: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
