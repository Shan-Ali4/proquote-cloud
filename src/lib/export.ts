import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

type DocRow = {
  id: string;
  doc_number: string;
  doc_type: "quotation" | "proforma";
  status: string;
  issue_date: string;
  validity_date: string | null;
  reference: string | null;
  currency: string;
  gst_mode: "exclusive" | "inclusive" | "none";
  gst_kind: "intra" | "inter";
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  shipping_charge: number;
  packaging_charge: number;
  other_charge: number;
  grand_total: number;
  notes: string | null;
  terms: string | null;
  clients: Record<string, unknown> | null;
  companies: Record<string, unknown> | null;
  document_items: Array<{
    position: number;
    name: string;
    description: string | null;
    hsn_code: string | null;
    quantity: number;
    unit: string | null;
    rate: number;
    discount_percent: number;
    tax_percent: number;
    line_total: number;
  }>;
};

export async function fetchDocumentFull(id: string): Promise<DocRow> {
  const { data, error } = await supabase
    .from("documents")
    .select(
      "*, clients(*), companies(*), document_items(*)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  const d = data as unknown as DocRow;
  d.document_items = (d.document_items ?? []).slice().sort((a, b) => a.position - b.position);
  return d;
}

const s = (v: unknown, fallback = "") =>
  v === null || v === undefined || v === "" ? fallback : String(v);
const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function money(amount: number, currency = "INR") {
  const v = Number.isFinite(amount) ? amount : 0;
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${sym}${v.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function amountInWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const inWords = (x: number): string => {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    if (x < 1000) return a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + inWords(x % 100) : "");
    return "";
  };
  const whole = Math.floor(num);
  const paise = Math.round((num - whole) * 100);
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole / 100000) % 100);
  const thousand = Math.floor((whole / 1000) % 100);
  const hundred = whole % 1000;
  let str = "";
  if (crore) str += inWords(crore) + " Crore ";
  if (lakh) str += inWords(lakh) + " Lakh ";
  if (thousand) str += inWords(thousand) + " Thousand ";
  if (hundred) str += inWords(hundred);
  str = str.trim() || "Zero";
  return `Rupees ${str}${paise ? ` and ${inWords(paise)} Paise` : ""} Only`;
}

const BRAND = { r: 37, g: 99, b: 235 }; // #2563EB (kept for excel export)
const INK = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };

function moneyPlain(amount: number, currency = "INR") {
  const v = Number.isFinite(amount) ? amount : 0;
  return v.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Tally-style A4 PDF matching the PMTC Quotation template.
export async function exportDocumentPdf(id: string) {
  const d = await fetchDocumentFull(id);
  const c = (d.companies ?? {}) as Record<string, unknown>;
  const cl = (d.clients ?? {}) as Record<string, unknown>;
  const cur = d.currency || "INR";
  const isQ = d.doc_type === "quotation";
  const intra = d.gst_kind === "intra";
  const title = isQ ? "QUOTATION" : "PROFORMA INVOICE";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 10;
  const innerW = W - M * 2;

  // Outer page border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(M, M, innerW, H - M * 2);

  // ---------- Header ----------
  let y = M + 7;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(s(c.name, "Your Company").toUpperCase(), W / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const addr = [
    s(c.address_line1),
    s(c.address_line2),
    s(c.city),
    s(c.state),
    s(c.postal_code),
  ].filter(Boolean).join(", ");
  const contact = [c.phone && `Phone: ${c.phone}`, c.email && `Email: ${c.email}`]
    .filter(Boolean).join(" | ");
  const headerLine = [addr, contact].filter(Boolean).join(" | ");
  if (headerLine) {
    doc.text(headerLine, W / 2, y, { align: "center", maxWidth: innerW - 4 });
    y += 4.5;
  }
  if (c.gst_number) {
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${c.gst_number}`, W / 2, y, { align: "center" });
    y += 4.5;
  }

  // Horizontal separator
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);

  // Title
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, W / 2, y, { align: "center" });
  y += 3;
  doc.line(M, y, W - M, y);

  // ---------- Meta strip: doc no + date ----------
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const numLabel = isQ ? "Quotation No" : "Proforma No";
  doc.text(`${numLabel}: ${d.doc_number}`, M + 2, y);
  doc.text(`Date: ${formatDate(d.issue_date)}`, W - M - 2, y, { align: "right" });
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);

  // ---------- Buyer block ----------
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Buyer (Bill to):", M + 2, y);
  const pos = [s(cl.state), s(cl.country)].filter(Boolean).join(", ") || s(c.state, "—");
  doc.text(`Place of Supply: ${pos}`, W - M - 2, y, { align: "right" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const buyerName = s(cl.company_name) || s(cl.name, "—");
  doc.setFont("helvetica", "bold");
  doc.text("Name:", M + 2, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerName, M + 18, y);
  y += 5;

  const buyerAddr = [
    s(cl.address_line1),
    s(cl.address_line2),
    [s(cl.city), s(cl.state), s(cl.postal_code)].filter(Boolean).join(", "),
  ].filter(Boolean).join(", ");
  doc.setFont("helvetica", "bold");
  doc.text("Add:", M + 2, y);
  doc.setFont("helvetica", "normal");
  const addrLines = doc.splitTextToSize(buyerAddr || "—", innerW - 24);
  doc.text(addrLines, M + 18, y);
  y += addrLines.length * 4.5;

  if (cl.gst_number) {
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN:", M + 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(s(cl.gst_number), M + 18, y);
    y += 5;
  }

  y += 1;

  // ---------- Items table ----------
  // Columns matching PMTC: Sr.No | Description | Qty | Rate | Per | Taxable | GST% | Amount
  const head = [["Sr. No.", "Description of Goods", "Qty", "Rate", "Per", "Taxable Value", "GST %", "Amount"]];

  const body = d.document_items.map((it, idx) => {
    const q = n(it.quantity);
    const rate = n(it.rate);
    const dp = n(it.discount_percent);
    const tp = n(it.tax_percent);
    const gross = q * rate;
    const disc = gross * (dp / 100);
    let taxable = gross - disc;
    let tax = 0;
    if (d.gst_mode === "inclusive") {
      taxable = (gross - disc) / (1 + tp / 100);
      tax = (gross - disc) - taxable;
    } else if (d.gst_mode === "exclusive") {
      tax = taxable * (tp / 100);
    }
    const total = d.gst_mode === "inclusive" ? gross - disc : taxable + tax;
    const name = it.description ? `${it.name}\n${it.description}` : it.name;
    const hsn = it.hsn_code ? `${name}\nHSN: ${it.hsn_code}` : name;
    return [
      String(idx + 1),
      hsn,
      String(q),
      moneyPlain(rate, cur),
      s(it.unit, "Nos"),
      moneyPlain(taxable, cur),
      `${tp}%`,
      moneyPlain(total, cur),
    ];
  });

  // Footer (totals) rows inside the same grid table — like Tally.
  const totalsBody: Array<Array<{ content: string; styles?: Record<string, unknown>; colSpan?: number }>> = [];

  const pushTotal = (label: string, value: string, opts: { bold?: boolean; fill?: boolean } = {}) => {
    totalsBody.push([
      {
        content: label,
        colSpan: 5,
        styles: {
          halign: "right",
          fontStyle: opts.bold ? "bold" : "normal",
          fillColor: opts.fill ? [240, 240, 240] : [255, 255, 255],
        },
      },
      { content: "", colSpan: 2, styles: { fillColor: opts.fill ? [240, 240, 240] : [255, 255, 255] } },
      {
        content: value,
        styles: {
          halign: "right",
          fontStyle: opts.bold ? "bold" : "normal",
          fillColor: opts.fill ? [240, 240, 240] : [255, 255, 255],
        },
      },
    ]);
  };

  pushTotal("Sub-Total (Total Taxable Value)", moneyPlain(d.taxable_amount, cur), { bold: true });
  if (intra) {
    pushTotal("Central Tax (CGST)", moneyPlain(d.cgst_amount, cur));
    pushTotal("State Tax (SGST)", moneyPlain(d.sgst_amount, cur));
  } else if (n(d.igst_amount) > 0) {
    pushTotal("Integrated Tax (IGST)", moneyPlain(d.igst_amount, cur));
  }
  if (n(d.shipping_charge)) pushTotal("Shipping", moneyPlain(d.shipping_charge, cur));
  if (n(d.packaging_charge)) pushTotal("Packaging", moneyPlain(d.packaging_charge, cur));
  if (n(d.other_charge)) pushTotal("Other Charges", moneyPlain(d.other_charge, cur));
  const roundOff = Math.round(n(d.grand_total)) - n(d.grand_total);
  if (Math.abs(roundOff) >= 0.005) {
    pushTotal("Round Off", moneyPlain(roundOff, cur));
  }
  pushTotal(`Total Amount (${cur})`, moneyPlain(Math.round(n(d.grand_total)), cur), { bold: true, fill: true });

  autoTable(doc, {
    startY: y,
    head,
    body: [...body, ...(totalsBody as unknown as string[][])],
    theme: "grid",
    margin: { left: M, right: M },
    tableWidth: innerW,
    styles: {
      fontSize: 9,
      cellPadding: 1.6,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      valign: "middle",
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 14 },
      1: { cellWidth: 78 },
      2: { halign: "right", cellWidth: 14 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "center", cellWidth: 14 },
      7: { halign: "right", cellWidth: innerW - 14 - 78 - 14 - 24 - 14 - 28 - 14 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterY = (doc as any).lastAutoTable.finalY;

  // ---------- Amount in words ----------
  afterY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Amount in Words:", M + 2, afterY);
  doc.setFont("helvetica", "normal");
  const words = doc.splitTextToSize(amountInWords(Math.round(n(d.grand_total))), innerW - 32);
  doc.text(words, M + 32, afterY);
  afterY += words.length * 4.5 + 3;

  doc.setLineWidth(0.2);
  doc.line(M, afterY, W - M, afterY);

  // ---------- Bank details (left) + signature (right) ----------
  const blockTop = afterY + 5;
  let leftY = blockTop;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bank Details:", M + 2, leftY);
  leftY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const bank = [
    c.bank_name && `Bank Name: ${c.bank_name}`,
    c.bank_account && `A/c No: ${c.bank_account}`,
    c.bank_ifsc && `IFSC Code: ${c.bank_ifsc}`,
    c.bank_branch && `Branch: ${c.bank_branch}`,
    c.upi_id && `UPI: ${c.upi_id}`,
  ].filter(Boolean) as string[];
  if (bank.length === 0) bank.push("—");
  bank.forEach((b, i) => doc.text(b, M + 2, leftY + i * 4.5));
  const bankBottom = leftY + bank.length * 4.5;

  // Signature block on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`For ${s(c.name, "Company").toUpperCase()}`, W - M - 2, blockTop, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Authorised Signatory", W - M - 2, blockTop + 22, { align: "right" });
  // Signature line
  doc.setLineWidth(0.2);
  doc.line(W - M - 60, blockTop + 19, W - M - 2, blockTop + 19);

  let cursorY = Math.max(bankBottom, blockTop + 26) + 4;

  // ---------- Notes / Terms ----------
  if (d.notes) {
    doc.setLineWidth(0.2);
    doc.line(M, cursorY, W - M, cursorY);
    cursorY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes:", M + 2, cursorY);
    cursorY += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(d.notes, innerW - 4);
    doc.text(lines, M + 2, cursorY);
    cursorY += lines.length * 4;
  }
  if (d.terms) {
    cursorY += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Terms & Conditions:", M + 2, cursorY);
    cursorY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(d.terms, innerW - 4);
    doc.text(lines, M + 2, cursorY);
    cursorY += lines.length * 3.8;
  }

  // Footer note inside border
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("This is a computer-generated document.", W / 2, H - M - 3, { align: "center" });
  doc.setTextColor(INK.r, INK.g, INK.b);

  doc.save(`${d.doc_number}.pdf`);
}

export async function exportDocumentExcel(id: string) {
  const d = await fetchDocumentFull(id);
  const c = (d.companies ?? {}) as Record<string, unknown>;
  const cl = (d.clients ?? {}) as Record<string, unknown>;
  const cur = d.currency || "INR";
  const intra = d.gst_kind === "intra";
  const isQ = d.doc_type === "quotation";

  const wb = new ExcelJS.Workbook();
  wb.creator = s(c.name, "ProQuote Pro");
  wb.created = new Date();
  const ws = wb.addWorksheet(d.doc_number, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
      horizontalCentered: true,
    },
    properties: { defaultRowHeight: 16 },
  });

  const cols = intra ? 10 : 9;
  const widths = intra
    ? [5, 28, 10, 8, 12, 8, 14, 12, 12, 14]
    : [5, 32, 12, 8, 14, 8, 16, 16, 16];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const last = String.fromCharCode(64 + cols);
  const brand = "FF2563EB";
  const ink = "FF0F172A";
  const muted = "FF64748B";
  const soft = "FFF8FAFC";
  const border = { style: "thin" as const, color: { argb: "FFE2E8F0" } };
  const allBorders = { top: border, bottom: border, left: border, right: border };

  // Banner
  ws.mergeCells(`A1:${last}1`);
  const banner = ws.getCell("A1");
  banner.value = s(c.name, "Your Company");
  banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } };
  banner.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  banner.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 30;

  ws.mergeCells(`A2:${last}2`);
  const sub = ws.getCell("A2");
  sub.value = [
    [s(c.address_line1), s(c.address_line2), s(c.city), s(c.state), s(c.postal_code), s(c.country)]
      .filter(Boolean).join(", "),
    [c.phone && `Ph: ${c.phone}`, c.email && `Email: ${c.email}`, c.gst_number && `GSTIN: ${c.gst_number}`]
      .filter(Boolean).join("  ·  "),
  ].filter(Boolean).join("\n");
  sub.font = { name: "Calibri", size: 9, color: { argb: "FFFFFFFF" } };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } };
  sub.alignment = { wrapText: true, vertical: "middle", indent: 1 };
  ws.getRow(2).height = 28;

  // Title bar
  ws.mergeCells(`A4:${last}4`);
  const t = ws.getCell("A4");
  t.value = `${isQ ? "QUOTATION" : "PROFORMA INVOICE"}    #${d.doc_number}`;
  t.font = { name: "Calibri", size: 13, bold: true, color: { argb: brand } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  t.border = { bottom: { style: "medium", color: { argb: brand } } };
  ws.getRow(4).height = 22;

  // Meta
  const metaPairs: Array<[string, string]> = [
    ["Date", formatDate(d.issue_date)],
    [isQ ? "Valid Until" : "Due Date", formatDate(d.validity_date)],
    ["Reference", s(d.reference, "—")],
    ["Status", d.status.replace("_", " ").toUpperCase()],
  ];
  metaPairs.forEach(([k, v], i) => {
    const r = 6 + i;
    ws.getCell(`A${r}`).value = k;
    ws.getCell(`A${r}`).font = { bold: true, color: { argb: muted }, size: 9 };
    ws.mergeCells(`B${r}:C${r}`);
    ws.getCell(`B${r}`).value = v;
    ws.getCell(`B${r}`).font = { color: { argb: ink }, size: 10 };
  });

  // Bill from / to
  ws.getCell("E6").value = "BILL FROM";
  ws.getCell(`H6`).value = "BILL TO";
  ["E6", "H6"].forEach((a) => {
    const cell = ws.getCell(a);
    cell.font = { bold: true, size: 9, color: { argb: brand } };
  });

  const fromLines = [
    s(c.name, "—"),
    [s(c.address_line1), s(c.address_line2)].filter(Boolean).join(", "),
    [s(c.city), s(c.state), s(c.postal_code)].filter(Boolean).join(", "),
    c.gst_number && `GSTIN: ${c.gst_number}`,
    c.pan_number && `PAN: ${c.pan_number}`,
  ].filter(Boolean).join("\n");
  const toLines = [
    s(cl.name, "—") + (cl.company_name ? ` · ${cl.company_name}` : ""),
    [s(cl.address_line1), s(cl.address_line2)].filter(Boolean).join(", "),
    [s(cl.city), s(cl.state), s(cl.postal_code)].filter(Boolean).join(", "),
    cl.gst_number && `GSTIN: ${cl.gst_number}`,
    cl.email && `Email: ${cl.email}`,
  ].filter(Boolean).join("\n");

  ws.mergeCells(`E7:G10`);
  ws.mergeCells(`H7:${last}10`);
  const fromCell = ws.getCell("E7");
  const toCell = ws.getCell("H7");
  fromCell.value = fromLines;
  toCell.value = toLines;
  [fromCell, toCell].forEach((cell) => {
    cell.font = { size: 9, color: { argb: ink } };
    cell.alignment = { wrapText: true, vertical: "top" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: soft } };
    cell.border = allBorders;
  });
  for (let r = 7; r <= 10; r++) ws.getRow(r).height = 14;

  // Items table
  const headerRow = 12;
  const head = intra
    ? ["#", "Item / Description", "HSN", "Qty", "Rate", "Disc%", "Taxable", "CGST", "SGST", "Total"]
    : ["#", "Item / Description", "HSN", "Qty", "Rate", "Disc%", "Taxable", "IGST", "Total"];
  head.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = allBorders;
  });
  ws.getRow(headerRow).height = 22;

  const currencyFmt =
    cur === "INR"
      ? '_-₹* #,##,##0.00_-;[Red]-₹* #,##,##0.00_-;_-₹* "-"??_-;_-@_-'
      : `_-[$${cur}] * #,##0.00_-;[Red]-[$${cur}] * #,##0.00_-;_-[$${cur}] * "-"??_-;_-@_-`;

  let r = headerRow + 1;
  d.document_items.forEach((it, idx) => {
    const q = n(it.quantity);
    const rate = n(it.rate);
    const dp = n(it.discount_percent);
    const tp = n(it.tax_percent);
    const gross = q * rate;
    const disc = gross * (dp / 100);
    let taxable = gross - disc;
    let tax = 0;
    if (d.gst_mode === "inclusive") {
      taxable = (gross - disc) / (1 + tp / 100);
      tax = (gross - disc) - taxable;
    } else if (d.gst_mode === "exclusive") {
      tax = taxable * (tp / 100);
    }
    const total = d.gst_mode === "inclusive" ? gross - disc : taxable + tax;
    const name = it.description ? `${it.name}\n${it.description}` : it.name;
    const row = intra
      ? [idx + 1, name, s(it.hsn_code, "—"), `${q} ${it.unit ?? ""}`.trim(), rate, dp / 100, taxable, tax / 2, tax / 2, total]
      : [idx + 1, name, s(it.hsn_code, "—"), `${q} ${it.unit ?? ""}`.trim(), rate, dp / 100, taxable, tax, total];
    row.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = v;
      cell.border = allBorders;
      cell.font = { size: 9.5, color: { argb: ink } };
      cell.alignment = { vertical: "top", wrapText: i === 1 };
      if (idx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: soft } };
      if (i === 5) cell.numFmt = "0.00%";
      if ([4, 6, 7, 8, 9].includes(i)) cell.numFmt = currencyFmt;
      if ([0, 2].includes(i)) cell.alignment = { horizontal: "center", vertical: "top" };
      if ([3].includes(i)) cell.alignment = { horizontal: "right", vertical: "top" };
    });
    r++;
  });

  // Totals
  r += 1;
  const labelCol = cols - 1;
  const valueCol = cols;
  const totalsRows: Array<[string, number, boolean?]> = [
    ["Subtotal", n(d.subtotal)],
    ["Discount", -n(d.discount_amount)],
    ["Taxable", n(d.taxable_amount)],
  ];
  if (intra) {
    totalsRows.push(["CGST", n(d.cgst_amount)]);
    totalsRows.push(["SGST", n(d.sgst_amount)]);
  } else if (n(d.igst_amount) > 0) {
    totalsRows.push(["IGST", n(d.igst_amount)]);
  }
  if (n(d.shipping_charge)) totalsRows.push(["Shipping", n(d.shipping_charge)]);
  if (n(d.packaging_charge)) totalsRows.push(["Packaging", n(d.packaging_charge)]);
  if (n(d.other_charge)) totalsRows.push(["Other", n(d.other_charge)]);
  totalsRows.push(["GRAND TOTAL", n(d.grand_total), true]);

  totalsRows.forEach(([k, v, big]) => {
    const lc = ws.getCell(r, labelCol);
    const vc = ws.getCell(r, valueCol);
    lc.value = k;
    vc.value = v;
    vc.numFmt = currencyFmt;
    if (big) {
      lc.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      vc.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      lc.fill = vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } };
      ws.getRow(r).height = 22;
    } else {
      lc.font = { color: { argb: muted }, size: 10 };
      vc.font = { bold: true, color: { argb: ink }, size: 10 };
    }
    lc.alignment = { horizontal: "right" };
    vc.alignment = { horizontal: "right" };
    lc.border = allBorders;
    vc.border = allBorders;
    r++;
  });

  // Amount in words
  r += 1;
  ws.mergeCells(r, 1, r, cols);
  const wcell = ws.getCell(r, 1);
  wcell.value = `Amount in words: ${amountInWords(n(d.grand_total))}`;
  wcell.font = { italic: true, size: 9.5, color: { argb: ink } };
  wcell.alignment = { wrapText: true };
  r += 2;

  // Bank / UPI
  if (c.bank_name || c.bank_account || c.upi_id) {
    ws.mergeCells(r, 1, r, cols);
    const h = ws.getCell(r, 1);
    h.value = "PAYMENT DETAILS";
    h.font = { bold: true, size: 9, color: { argb: brand } };
    r++;
    const bank = [
      c.bank_name && `Bank: ${c.bank_name}`,
      c.bank_account && `A/C: ${c.bank_account}`,
      c.bank_ifsc && `IFSC: ${c.bank_ifsc}`,
      c.bank_branch && `Branch: ${c.bank_branch}`,
      c.upi_id && `UPI: ${c.upi_id}`,
    ].filter(Boolean).join("    ·    ");
    ws.mergeCells(r, 1, r, cols);
    ws.getCell(r, 1).value = bank;
    ws.getCell(r, 1).font = { size: 9.5, color: { argb: ink } };
    r += 2;
  }

  if (d.notes) {
    ws.mergeCells(r, 1, r, cols);
    ws.getCell(r, 1).value = "NOTES";
    ws.getCell(r, 1).font = { bold: true, size: 9, color: { argb: brand } };
    r++;
    ws.mergeCells(r, 1, r, cols);
    ws.getCell(r, 1).value = d.notes;
    ws.getCell(r, 1).alignment = { wrapText: true };
    ws.getCell(r, 1).font = { size: 9.5, color: { argb: ink } };
    r += 2;
  }
  if (d.terms) {
    ws.mergeCells(r, 1, r, cols);
    ws.getCell(r, 1).value = "TERMS & CONDITIONS";
    ws.getCell(r, 1).font = { bold: true, size: 9, color: { argb: brand } };
    r++;
    ws.mergeCells(r, 1, r, cols);
    ws.getCell(r, 1).value = d.terms;
    ws.getCell(r, 1).alignment = { wrapText: true };
    ws.getCell(r, 1).font = { size: 9, color: { argb: muted } };
    r += 1;
  }

  // Repeat header row on every printed page
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${d.doc_number}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}