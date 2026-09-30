import jsPDF from 'jspdf';
import logoSrc from '../assets/school_logo.png';

const loadLogo = () =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = logoSrc;
  });

// ════════════════════════════════════════════════════════════════════════════
//  PREMIUM MEDICINE RECEIPT  —  A4 top-left quarter  (≈ 277 × 395 usable pt)
// ════════════════════════════════════════════════════════════════════════════
export const generateReceipt = async (sale) => {
  const logo64 = await loadLogo();

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();

  // ── Quarter box ───────────────────────────────────────────────────────────
  const QW  = PAGE_W / 2;          // 297.5 pt
  const QH  = PAGE_H / 2;          // 421   pt

  // Safe margins — keep content well inside
  const LM  = 12;                   // left margin
  const RM  = QW - 12;              // right edge
  const CW  = RM - LM;              // content width = 273.5 pt

  // ── Palette ───────────────────────────────────────────────────────────────
  const NAVY   = [10,  36,  84];
  const TEAL   = [0,  148, 133];
  const GOLD   = [210, 170,  45];
  const WHITE  = [255, 255, 255];
  const OFFWHT = [246, 248, 255];
  const DARK   = [16,  16,  22];
  const MID    = [80,  82,  95];
  const LTBLUE = [210, 225, 252];
  const RULE   = [195, 208, 228];
  const GREEN  = [0,  148, 133];

  const sf = (sz, style = 'normal', color = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(sz);
    doc.setTextColor(...color);
  };

  let y = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // 1.  HEADER  — branch name big + full detail
  // ══════════════════════════════════════════════════════════════════════════
  const HDR = 72;

  // Navy fill
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, QW, HDR, 'F');

  // Gold top bar
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, QW, 4, 'F');

  // Teal bottom bar
  doc.setFillColor(...TEAL);
  doc.rect(0, HDR - 3, QW, 3, 'F');

  // Decorative concentric arcs — top-right
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.circle(QW,  0, 50, 'S');
  doc.circle(QW,  0, 34, 'S');
  doc.circle(QW,  0, 18, 'S');

  // Logo circle + image — left, vertically centred
  const LCX = LM + 22, LCY = HDR / 2 + 2;
  if (logo64) {
    doc.setFillColor(...WHITE);
    doc.circle(LCX, LCY, 20, 'F');
    doc.addImage(logo64, 'PNG', LM + 4, LCY - 17, 36, 36);
  }

  // Branch name — prominent white bold, centered
  const bName = (sale.branch?.name || 'NEW LIFE CLINIC').toUpperCase();
  sf(12.5, 'bold', WHITE);
  doc.text(bName, QW / 2, 20, { align: 'center' });

  // Address — centered, 2 lines
  const addr = sale.branch?.address || '';
  sf(6.5, 'normal', LTBLUE);
  if (addr) {
    const addrLines = doc.splitTextToSize(addr, CW - 10);
    doc.text(addrLines[0], QW / 2, 32, { align: 'center' });
    if (addrLines[1]) doc.text(addrLines[1], QW / 2, 42, { align: 'center' });
  }

  // Mo. + Doctor row — centered
  const phone  = sale.branch?.phone      ? `Mo. ${sale.branch.phone}` : '';
  const doctor = sale.branch?.doctorName  ? `Dr. ${sale.branch.doctorName}${sale.branch.doctorDegree ? '  ' + sale.branch.doctorDegree : ''}` : '';
  const detRow = [doctor, phone].filter(Boolean).join('    |    ');
  sf(6.5, 'bold', [190, 215, 255]);
  if (detRow) doc.text(detRow, QW / 2, 57, { align: 'center' });

  // Gold accent dots bottom-right
  doc.setFillColor(...GOLD);
  [0, 8, 16].forEach(dx => doc.circle(RM - 4 - dx, HDR - 12, 2, 'F'));

  y = HDR + 1;

  // ══════════════════════════════════════════════════════════════════════════
  // 2.  RECEIPT TITLE + RECEIPT NUMBER
  // ══════════════════════════════════════════════════════════════════════════
  const TITLE_H = 20;
  doc.setFillColor(...OFFWHT);
  doc.rect(0, y, QW, TITLE_H, 'F');

  sf(8, 'bold', NAVY);
  doc.text('MEDICINE RECEIPT', LM, y + 13);

  // Receipt # badge
  const rBadgeW = Math.min(doc.getTextWidth(`# ${sale.receiptNumber}`) + 14, 110);
  doc.setFillColor(...TEAL);
  doc.roundedRect(RM - rBadgeW, y + 3, rBadgeW, 14, 3, 3, 'F');
  sf(6.5, 'bold', WHITE);
  doc.text(`# ${sale.receiptNumber}`, RM - rBadgeW / 2, y + 12, { align: 'center' });

  y += TITLE_H;

  // ══════════════════════════════════════════════════════════════════════════
  // 3.  PATIENT / DATE / PAYMENT ROW
  // ══════════════════════════════════════════════════════════════════════════
  const META_H = 22;
  doc.setFillColor(236, 241, 253);
  doc.rect(0, y, QW, META_H, 'F');

  const saleDate = new Date(sale.saleDate).toLocaleDateString('en-IN',
    { day: '2-digit', month: 'short', year: 'numeric' });
  const saleTime = new Date(sale.saleDate).toLocaleTimeString('en-IN',
    { hour: '2-digit', minute: '2-digit', hour12: true });

  // Patient
  sf(5.5, 'bold', [50, 70, 130]);
  doc.text('PATIENT', LM, y + 7);
  sf(7.5, 'bold', DARK);
  const pShort = doc.splitTextToSize(sale.patientName || 'Walk-in', 88)[0];
  doc.text(pShort, LM, y + 16);

  // Date centred
  sf(5.5, 'bold', [50, 70, 130]);
  doc.text('DATE', QW / 2, y + 7, { align: 'center' });
  sf(7, 'normal', DARK);
  doc.text(`${saleDate}  ${saleTime}`, QW / 2, y + 16, { align: 'center' });

  // Payment pill — right
  const pm = (sale.paymentMode || 'CASH').toUpperCase();
  const pmW = Math.max(doc.getTextWidth(pm) + 12, 30);
  doc.setFillColor(...NAVY);
  doc.roundedRect(RM - pmW, y + 4, pmW, 13, 3, 3, 'F');
  sf(6.5, 'bold', WHITE);
  doc.text(pm, RM - pmW / 2, y + 13, { align: 'center' });

  y += META_H + 2;

  // ══════════════════════════════════════════════════════════════════════════
  // 4.  TABLE HEADER
  // ══════════════════════════════════════════════════════════════════════════
  // Column x-positions  (all within LM…RM = 12…285)
  const C = {
    sno:  LM,               // S.No   — left
    name: LM + 17,          // Name
    qty:  LM + CW * 0.60,   // Qty
    rate: LM + CW * 0.75,   // Rate
    amt:  RM - 2,           // Amount — right edge
  };

  doc.setFillColor(...NAVY);
  doc.rect(0, y, QW, 14, 'F');

  sf(6.5, 'bold', WHITE);
  doc.text('#',       C.sno + 1,  y + 10);
  doc.text('Medicine',C.name,     y + 10);
  doc.text('Qty',     C.qty,      y + 10, { align: 'center' });
  doc.text('Rate',    C.rate,     y + 10, { align: 'center' });
  doc.text('Amt',     C.amt,      y + 10, { align: 'right'  });

  y += 15;

  // ══════════════════════════════════════════════════════════════════════════
  // 5.  ITEM ROWS
  // ══════════════════════════════════════════════════════════════════════════
  const RH = 13;
  const MAX_NAME_W = C.qty - C.name - 5;

  sale.items.forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 244 : 255,
                     idx % 2 === 0 ? 246 : 255,
                     idx % 2 === 0 ? 254 : 255);
    doc.rect(0, y, QW, RH, 'F');

    sf(7, 'normal', DARK);
    doc.text(String(idx + 1),                          C.sno + 1,  y + 9);
    doc.text(doc.splitTextToSize(item.medicineName, MAX_NAME_W)[0],
                                                       C.name,     y + 9);
    doc.text(String(item.quantity),                    C.qty,      y + 9, { align: 'center' });
    doc.text(`${item.unitPrice.toFixed(0)}`,           C.rate,     y + 9, { align: 'center' });

    sf(7, 'bold', DARK);
    doc.text(`${item.total.toFixed(2)}`,               C.amt,      y + 9, { align: 'right' });

    doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
    doc.line(LM, y + RH - 0.5, RM, y + RH - 0.5);

    y += RH;
  });

  y += 4;

  // ══════════════════════════════════════════════════════════════════════════
  // 6.  TOTALS BLOCK
  // ══════════════════════════════════════════════════════════════════════════
  const TX = LM + CW * 0.50;  // totals left x

  doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
  doc.line(TX, y, RM, y);
  y += 4;

  const tRow = (lbl, val, bold = false, col = MID) => {
    sf(bold ? 7.5 : 7, bold ? 'bold' : 'normal', col);
    doc.text(lbl, TX, y + 9);
    doc.text(val, RM, y + 9, { align: 'right' });
    y += bold ? 12 : 11;
  };

  tRow('Subtotal', `Rs ${sale.subtotal.toFixed(2)}`);
  if (sale.discount > 0)
    tRow('Discount', `- Rs ${sale.discount.toFixed(2)}`, false, [180, 50, 50]);

  y += 2;

  // Grand Total band
  const GTH = 22;
  doc.setFillColor(...NAVY);
  doc.roundedRect(TX - 6, y, RM - TX + 12, GTH, 4, 4, 'F');
  // Gold left accent
  doc.setFillColor(...GOLD);
  doc.roundedRect(TX - 6, y, 4, GTH, 2, 2, 'F');

  sf(7, 'bold', LTBLUE);
  doc.text('GRAND TOTAL', TX + 4, y + 14);
  sf(12, 'bold', WHITE);
  doc.text(`Rs ${sale.grandTotal.toFixed(2)}`, RM - 2, y + 15, { align: 'right' });

  y += GTH + 6;

  // ══════════════════════════════════════════════════════════════════════════
  // 7.  TERMS LINE
  // ══════════════════════════════════════════════════════════════════════════
  sf(5.5, 'italic', MID);
  doc.text('* Medicines once sold are non-returnable.', LM, y + 6);
  sf(5.5, 'italic', [155, 155, 165]);
  doc.text(`Printed: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
    RM, y + 6, { align: 'right' });

  // ══════════════════════════════════════════════════════════════════════════
  // 8.  FOOTER  — "Thank you" — pinned just above dashed cut line
  // ══════════════════════════════════════════════════════════════════════════
  const FTR_H = 22;
  const FTR_Y = QH - FTR_H;   // flush with quarter bottom

  doc.setFillColor(...TEAL);
  doc.rect(0, FTR_Y, QW, FTR_H, 'F');
  // Gold top line on footer
  doc.setFillColor(...GOLD);
  doc.rect(0, FTR_Y, QW, 2.5, 'F');

  sf(8, 'bold', WHITE);
  doc.text('Thank you for visiting!  Get well soon.',
    QW / 2, FTR_Y + 14, { align: 'center' });

  // ══════════════════════════════════════════════════════════════════════════
  // 9.  DASHED CUT LINES + SCISSOR  (drawn outside quarter boundary)
  // ══════════════════════════════════════════════════════════════════════════
  doc.setDrawColor(165, 165, 165);
  doc.setLineWidth(0.55);
  doc.setLineDashPattern([3, 2.5], 0);
  doc.line(QW, 0,  QW, QH + 5);     // right edge (slightly beyond)
  doc.line(0,  QH, QW + 5, QH);     // bottom edge (slightly beyond)
  doc.setLineDashPattern([], 0);

  sf(9, 'normal', [165, 165, 165]);
  doc.text('\u2702', QW + 2, QH + 10);

  // ── Print (open browser print dialog directly) ────────────────────────────
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWin = window.open(blobUrl, '_blank');
  if (printWin) printWin.focus();
};
