import type { Customer } from "@/types";

const CSV_HEADERS = [
  "name",
  "email",
  "phone",
  "taxNumber",
  "address",
  "city",
  "country",
  "postalCode",
  "notes",
] as const;

export function exportCustomersToCSV(
  customers: Customer[],
  locale: string
): string {
  const headerLabels =
    locale === "tr"
      ? [
          "Ad",
          "E-posta",
          "Telefon",
          "Vergi No",
          "Adres",
          "Şehir",
          "Ülke",
          "Posta Kodu",
          "Notlar",
        ]
      : [
          "Name",
          "Email",
          "Phone",
          "Tax Number",
          "Address",
          "City",
          "Country",
          "Postal Code",
          "Notes",
        ];

  const rows = customers.map((customer) => [
    customer.name,
    customer.email ?? "",
    customer.phone ?? "",
    customer.taxNumber ?? "",
    customer.address ?? "",
    customer.city ?? "",
    customer.country ?? "",
    customer.postalCode ?? "",
    customer.notes ?? "",
  ]);

  const csvContent = [
    headerLabels.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function parseCustomerCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const rows: string[][] = [];
  for (const line of lines) {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  const firstRow = rows[0].map((c) => c.toLowerCase().replace(/\s+/g, ""));
  const isHeader =
    firstRow.length >= 1 &&
    (firstRow[0] === "name" || firstRow[0] === "ad");
  const dataRows = isHeader ? rows.slice(1) : rows;

  return dataRows;
}

export function mapCSVRowToCustomer(row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  CSV_HEADERS.forEach((key, index) => {
    const value = row[index]?.trim() ?? "";
    record[key] = value;
  });
  return record;
}
