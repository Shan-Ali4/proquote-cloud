export type LineInput = {
  quantity: number;
  rate: number;
  discount_percent: number;
  tax_percent: number;
};

export type ComputedLine = {
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
};

export function computeLine(l: LineInput, gstMode: "exclusive" | "inclusive" | "none"): ComputedLine {
  const q = Number(l.quantity) || 0;
  const r = Number(l.rate) || 0;
  const dp = Number(l.discount_percent) || 0;
  const tp = Number(l.tax_percent) || 0;
  const gross = q * r;
  const discount = gross * (dp / 100);
  const afterDiscount = gross - discount;
  if (gstMode === "none") {
    return { gross, discount, taxable: afterDiscount, tax: 0, total: afterDiscount };
  }
  if (gstMode === "inclusive") {
    const taxable = afterDiscount / (1 + tp / 100);
    const tax = afterDiscount - taxable;
    return { gross, discount, taxable, tax, total: afterDiscount };
  }
  const tax = afterDiscount * (tp / 100);
  return { gross, discount, taxable: afterDiscount, tax, total: afterDiscount + tax };
}

export type DocTotals = {
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
};

export function computeDocTotals(
  items: LineInput[],
  opts: {
    gst_mode: "exclusive" | "inclusive" | "none";
    gst_kind: "intra" | "inter";
    extra_discount: number;
    shipping: number;
    packaging: number;
    other: number;
  },
): DocTotals {
  let subtotal = 0;
  let discount_amount = 0;
  let taxable_amount = 0;
  let tax_total = 0;
  for (const it of items) {
    const c = computeLine(it, opts.gst_mode);
    subtotal += c.gross;
    discount_amount += c.discount;
    taxable_amount += c.taxable;
    tax_total += c.tax;
  }
  // header-level extra discount applies to taxable amount proportionally (simple model)
  const extra = Number(opts.extra_discount) || 0;
  discount_amount += extra;
  taxable_amount = Math.max(0, taxable_amount - extra);

  const cgst_amount = opts.gst_kind === "intra" ? tax_total / 2 : 0;
  const sgst_amount = opts.gst_kind === "intra" ? tax_total / 2 : 0;
  const igst_amount = opts.gst_kind === "inter" ? tax_total : 0;

  const charges =
    (Number(opts.shipping) || 0) +
    (Number(opts.packaging) || 0) +
    (Number(opts.other) || 0);

  const grand_total = taxable_amount + tax_total + charges;

  return {
    subtotal: round2(subtotal),
    discount_amount: round2(discount_amount),
    taxable_amount: round2(taxable_amount),
    cgst_amount: round2(cgst_amount),
    sgst_amount: round2(sgst_amount),
    igst_amount: round2(igst_amount),
    grand_total: round2(grand_total),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}