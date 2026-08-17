/**
 * Small RFC-4180-ish CSV parser — handles quoted fields, escaped quotes ("")
 * and commas/newlines inside quotes. No external dependency needed for the
 * "import a spreadsheet" flow, which only ever deals with small files.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim().length > 0));
  const [headers, ...dataRows] = nonEmpty;
  return { headers: (headers ?? []).map((h) => h.trim()), rows: dataRows };
}

export const CUSTOMER_IMPORT_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "companyName", label: "Company", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "address", label: "Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

export type CustomerImportField = (typeof CUSTOMER_IMPORT_FIELDS)[number]["key"];

const HEADER_ALIASES: Record<CustomerImportField, string[]> = {
  name: ["name", "customer", "customer name", "full name", "contact"],
  companyName: ["company", "company name", "business", "organisation", "organization"],
  email: ["email", "email address"],
  phone: ["phone", "phone number", "mobile", "contact number"],
  address: ["address", "street", "street address"],
  city: ["city", "town", "suburb"],
  notes: ["notes", "note", "comments"],
};

export function guessColumnMapping(headers: string[]): Partial<Record<CustomerImportField, number>> {
  const mapping: Partial<Record<CustomerImportField, number>> = {};
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  for (const field of CUSTOMER_IMPORT_FIELDS) {
    const aliases = HEADER_ALIASES[field.key];
    const idx = normalizedHeaders.findIndex((h) => aliases.includes(h));
    if (idx !== -1) mapping[field.key] = idx;
  }

  return mapping;
}
