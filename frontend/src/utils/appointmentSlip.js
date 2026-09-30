import jsPDF from 'jspdf';
import logoSrc from '../assets/school_logo.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const loadImage = (src) =>
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
    img.src = src;
  });

const makeWatermark = (src, size = 420, alpha = 0.055) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

// ════════════════════════════════════════════════════════════════════════════
//  PREMIUM A4 APPOINTMENT SLIP
//  @param {Object} appt     – populated appointment
//  @param {Array}  branches – all active branches (for footer)
// ════════════════════════════════════════════════════════════════════════════
export const generateAppointmentSlip = async (appt, branches = []) => {
  const [logo64, wm64] = await Promise.all([
    loadImage(logoSrc),
    makeWatermark(logoSrc),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();   // 595
  const H   = doc.internal.pageSize.getHeight();  // 842
  const LM  = 36;
  const RM  = W - 36;

  // ── Palette ───────────────────────────────────────────────────────────────
  const NAVY   = [10,  35,  82];
  const BLUE   = [25,  82, 175];
  const TEAL   = [0,  148, 133];
  const GOLD   = [210, 170,  45];
  const WHITE  = [255, 255, 255];
  const OFFWHT = [247, 249, 255];
  const DARK   = [16,  16,  22];
  const MID    = [82,  84,  98];
  const LTBLUE = [215, 228, 252];
  const RULE   = [192, 204, 228];

  const sf = (sz, style = 'normal', color = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(sz);
    doc.setTextColor(...color);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1.  HEADER
  // ══════════════════════════════════════════════════════════════════════════
  const HDR = 118;

  doc.setFillColor(...NAVY); doc.rect(0, 0, W, HDR, 'F');

  // Gold top stripe
  doc.setFillColor(...GOLD); doc.rect(0, 0, W, 4, 'F');

  // Teal bottom stripe
  doc.setFillColor(...TEAL); doc.rect(0, HDR - 3, W, 3, 'F');

  // Decorative arcs — top right
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.4);
  [[W - 55, 45, 80], [W - 55, 45, 56], [W - 55, 45, 32]].forEach(([cx, cy, r]) =>
    doc.circle(cx, cy, r, 'S'));

  // Logo circle — bigger, properly centered
  if (logo64) {
    doc.setFillColor(...WHITE);
    doc.circle(LM + 46, HDR / 2 + 2, 46, 'F');
    doc.addImage(logo64, 'PNG', LM + 4, HDR / 2 - 40, 84, 84);
  }

  // Clinic / branch name — large
  const clinicName = (appt.branch?.name || 'NEW LIFE CLINIC').toUpperCase();
  sf(22, 'bold', WHITE);
  doc.text(clinicName, LM + 108, 32);

  // Tagline — line 2
  sf(8, 'normal', [185, 210, 250]);
  doc.text('ADVANCED MEDICAL CLINIC   ·   YOUR HEALTH, OUR PRIORITY', LM + 108, 46);

  // Address — line 3 (own line, no overlap)
  const addrLine = appt.branch?.address || '';
  sf(7.5, 'normal', [165, 190, 235]);
  if (addrLine) {
    const addrWrapped = doc.splitTextToSize(addrLine, W - LM - 108 - 100);
    doc.text(addrWrapped[0], LM + 108, 58);
  }

  // Phone — line 4
  const phoneLine = appt.branch?.phone ? `Mo. ${appt.branch.phone}` : '';
  sf(7.5, 'bold', [165, 190, 235]);
  if (phoneLine) doc.text(phoneLine, LM + 108, 70);

  // Doctor name — remove "Dr." prefix if name already starts with it
  const rawDrName = appt.branch?.doctorName || appt.doctorName || '';
  const drName = rawDrName.toLowerCase().startsWith('dr') ? rawDrName : `Dr. ${rawDrName}`;
  const drDeg  = appt.branch?.doctorDegree || appt.doctorDegree || '';
  sf(12, 'bold', WHITE);
  doc.text(drName, LM + 108, 85);
  if (drDeg) { sf(8.5, 'normal', LTBLUE); doc.text(drDeg, LM + 108, 97); }

  // Address / phone — right aligned in header (remove — already shown left)
  // TOKEN badge — right
  const bW = 86, bH = 30, bX = RM - bW, bY = 76;
  doc.setFillColor(...TEAL);
  doc.roundedRect(bX, bY, bW, bH, 7, 7, 'F');
  // Gold border
  doc.setDrawColor(...GOLD); doc.setLineWidth(1);
  doc.roundedRect(bX, bY, bW, bH, 7, 7, 'S');
  sf(7.5, 'bold', GOLD);
  doc.text('TOKEN NO.', bX + bW / 2, bY + 11, { align: 'center' });
  sf(18, 'bold', WHITE);
  doc.text(String(appt.tokenNumber).padStart(3, '0'), bX + bW / 2, bY + 27, { align: 'center' });

  // Blue accent line
  doc.setFillColor(...BLUE); doc.rect(0, HDR, W, 2.5, 'F');

  // ══════════════════════════════════════════════════════════════════════════
  // 2.  PATIENT INFO ROW
  // ══════════════════════════════════════════════════════════════════════════
  const INFO_Y = HDR + 28;

  doc.setFillColor(...OFFWHT); doc.rect(0, HDR + 5, W, 50, 'F');

  const pName   = appt.patient?.name || '';
  const ageSex  = [
    appt.patient?.age   ? `${appt.patient.age} Yrs` : '',
    appt.patient?.gender || ''
  ].filter(Boolean).join(' / ');
  const apptDate = new Date(appt.appointmentDate).toLocaleDateString('en-IN',
    { day: '2-digit', month: 'short', year: 'numeric' });

  const dotField = (label, value, x, maxW, y = INFO_Y) => {
    sf(9, 'bold', BLUE);
    doc.text(label, x, y);
    const lw = doc.getTextWidth(label);
    const vx = x + lw + 5;
    const vw = maxW - lw - 8;
    doc.setDrawColor(...RULE); doc.setLineWidth(0.5);
    doc.setLineDashPattern([1.5, 2.5], 0);
    doc.line(vx, y + 2.5, vx + vw, y + 2.5);
    doc.setLineDashPattern([], 0);
    sf(9, 'normal', DARK);
    doc.text(doc.splitTextToSize(value, vw - 4)[0] || '', vx + 3, y - 0.5);
  };

  dotField('Patient Name :', pName,    LM,        295);
  dotField('Age / Sex :',   ageSex,   LM + 310,  145);
  dotField('Date :',        apptDate, LM + 468,  91);

  let bodyY = INFO_Y + 24;
  if (appt.chiefComplaint) {
    dotField('Complaint :', appt.chiefComplaint, LM, W - LM * 2 - 10, INFO_Y + 22);
    bodyY = INFO_Y + 48;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3.  WATERMARK
  // ══════════════════════════════════════════════════════════════════════════
  if (wm64) {
    const sz = 370;
    doc.addImage(wm64, 'PNG', (W - sz) / 2, HDR + 85, sz, sz);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4.  Rx + PRESCRIPTION LINES
  // ══════════════════════════════════════════════════════════════════════════
  const RX_Y = bodyY + 10;

  sf(36, 'bold', [205, 218, 248]);
  doc.text('℞', LM, RX_Y + 30);

  if (appt.prescription && appt.prescription.trim()) {
    sf(11, 'normal', DARK);
    const lines = doc.splitTextToSize(appt.prescription, W - LM * 2 - 32);
    doc.text(lines, LM + 40, RX_Y + 16);
  } else {
    const lineStart = RX_Y + 40;
    const gap       = 37;
    doc.setDrawColor(...RULE); doc.setLineWidth(0.45);
    for (let i = 0; i < 14; i++) {
      doc.line(LM + 38, lineStart + i * gap, RM, lineStart + i * gap);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5.  DOCTOR SIGNATURE  (just above footer)
  // ══════════════════════════════════════════════════════════════════════════
  const FTR_H  = 72;
  const SIG_Y  = H - FTR_H - 28;

  doc.setDrawColor(...BLUE); doc.setLineWidth(1);
  doc.line(RM - 160, SIG_Y, RM, SIG_Y);
  sf(8.5, 'bold', MID);
  doc.text("Doctor's Signature", RM - 80, SIG_Y + 14, { align: 'center' });

  // Printed time — left
  sf(7, 'italic', [150, 155, 175]);
  doc.text(`Printed: ${new Date().toLocaleString('en-IN')}`, LM, SIG_Y + 10);

  // ══════════════════════════════════════════════════════════════════════════
  // 6.  FOOTER — 3 BRANCHES  (navy band)
  // ══════════════════════════════════════════════════════════════════════════
  const FTR_Y = H - FTR_H;

  doc.setFillColor(...NAVY); doc.rect(0, FTR_Y, W, FTR_H, 'F');

  // Gold top line
  doc.setFillColor(...GOLD); doc.rect(0, FTR_Y, W, 3, 'F');

  // Teal bottom bar
  doc.setFillColor(...TEAL); doc.rect(0, H - 5, W, 5, 'F');

  // Show up to 3 active branches equally spaced
  const activeBranches = (branches || []).filter(b => b.isActive !== false).slice(0, 3);
  const showBranches   = activeBranches.length > 0
    ? activeBranches
    : [appt.branch].filter(Boolean);   // fallback: current branch only

  const colW   = (W - LM - (W - RM)) / showBranches.length;
  const colPad = 12;

  showBranches.forEach((br, idx) => {
    const cx  = LM + idx * colW;           // column start x
    const midX = cx + colW / 2;

    // Vertical divider (except first)
    if (idx > 0) {
      doc.setDrawColor(60, 90, 150); doc.setLineWidth(0.5);
      doc.line(cx, FTR_Y + 10, cx, H - 12);
    }

    // Branch name — gold, bold, centered
    sf(8.5, 'bold', GOLD);
    const bNameShort = (br.name || '').toUpperCase();
    const bNameLines = doc.splitTextToSize(bNameShort, colW - colPad * 2);
    doc.text(bNameLines[0], midX, FTR_Y + 17, { align: 'center' });

    // Address — 2 lines max, light blue
    sf(6.5, 'normal', LTBLUE);
    if (br.address) {
      const addrLines = doc.splitTextToSize(br.address, colW - colPad);
      doc.text(addrLines[0], midX, FTR_Y + 30, { align: 'center' });
      if (addrLines[1]) doc.text(addrLines[1], midX, FTR_Y + 40, { align: 'center' });
    }

    // Phone — white, bold
    if (br.phone) {
      sf(7, 'bold', WHITE);
      doc.text(`Mo. ${br.phone}`, midX, FTR_Y + 52, { align: 'center' });
    }

    // Doctor — fix double Dr.
    if (br.doctorName) {
      const rawDr = br.doctorName || '';
      const drLabel = rawDr.toLowerCase().startsWith('dr') ? rawDr : `Dr. ${rawDr}`;
      sf(6.5, 'italic', [185, 210, 250]);
      doc.text(drLabel, midX, FTR_Y + 64, { align: 'center' });
    }
  });

  // ── Print (open browser print dialog directly) ────────────────────────────
  const safeName = (appt.patient?.name || 'Patient').replace(/\s+/g, '_');
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWin = window.open(blobUrl, '_blank');
  if (printWin) printWin.focus();
};
