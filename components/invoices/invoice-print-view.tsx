import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import type { InvoiceWithRelations } from "@/types";
import { DiscountType } from "@/types";

export type InvoicePrintLabels = {
  billTo: string;
  invoiceInfo: string;
  itemsTitle: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  discount: string;
  taxAmount: string;
  notes: string;
  taxNumber: string;
};

type Props = {
  invoice: InvoiceWithRelations;
  locale: string;
  labels: InvoicePrintLabels;
  statusLabel: string;
};

function formatCurrency(
  amount: number,
  locale: string,
  currency: string
): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function InvoicePrintView({ invoice, locale, labels, statusLabel }: Props) {
  const dateLocale = locale === "tr" ? tr : enUS;
  const currency = invoice.currency || (locale === "tr" ? "TRY" : "USD");

  return (
    <div className="invoice-print-view bg-white text-black p-8 max-w-[210mm] mx-auto">
      <div className="flex justify-between items-start gap-8 mb-8">
        <div>
          {invoice.organization.logo && (
            <img
              src={invoice.organization.logo}
              alt={invoice.organization.name}
              className="h-12 w-auto object-contain mb-4 print-logo"
            />
          )}
          <h1 className="text-xl font-bold text-black">
            {invoice.organization.name}
          </h1>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-black mb-4">
            {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-black/80">
            {labels.status}: {statusLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
            {labels.billTo}
          </h3>
          <p className="font-medium text-black">{invoice.customer.name}</p>
          {invoice.customer.email && (
            <p className="text-sm text-black/80">{invoice.customer.email}</p>
          )}
          {invoice.customer.phone && (
            <p className="text-sm text-black/80">{invoice.customer.phone}</p>
          )}
          {invoice.customer.address && (
            <p className="text-sm text-black/80">{invoice.customer.address}</p>
          )}
          {(invoice.customer.city || invoice.customer.postalCode) && (
            <p className="text-sm text-black/80">
              {[invoice.customer.city, invoice.customer.postalCode]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}
          {invoice.customer.country && (
            <p className="text-sm text-black/80">{invoice.customer.country}</p>
          )}
          {invoice.customer.taxNumber && (
            <p className="text-sm text-black/80">
              {labels.taxNumber}: {invoice.customer.taxNumber}
            </p>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
            {labels.invoiceInfo}
          </h3>
          <p className="text-sm text-black">
            {labels.invoiceNumber}: {invoice.invoiceNumber}
          </p>
          <p className="text-sm text-black mt-1">
            {labels.issueDate}:{" "}
            {format(new Date(invoice.issueDate), "PPP", {
              locale: dateLocale,
            })}
          </p>
          <p className="text-sm text-black mt-1">
            {labels.dueDate}:{" "}
            {format(new Date(invoice.dueDate), "PPP", {
              locale: dateLocale,
            })}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 px-2 text-sm font-semibold text-black">
              {labels.description}
            </th>
            <th className="text-right py-2 px-2 text-sm font-semibold text-black w-24">
              {labels.quantity}
            </th>
            <th className="text-right py-2 px-2 text-sm font-semibold text-black w-28">
              {labels.unitPrice}
            </th>
            <th className="text-right py-2 px-2 text-sm font-semibold text-black w-28">
              {labels.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-black/20">
              <td className="py-2 px-2 text-sm text-black">
                {item.description}
              </td>
              <td className="py-2 px-2 text-sm text-right text-black">
                {Number(item.quantity)}
              </td>
              <td className="py-2 px-2 text-sm text-right text-black">
                {formatCurrency(Number(item.unitPrice), locale, currency)}
              </td>
              <td className="py-2 px-2 text-sm text-right text-black">
                {formatCurrency(Number(item.total), locale, currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-b border-black/20">
            <td colSpan={3} className="py-2 px-2 text-sm text-right font-medium text-black">
              {labels.subtotal}
            </td>
            <td className="py-2 px-2 text-sm text-right text-black">
              {formatCurrency(Number(invoice.subtotal), locale, currency)}
            </td>
          </tr>
          {invoice.discountAmount && Number(invoice.discountAmount) > 0 && (
            <tr className="border-b border-black/20">
              <td colSpan={3} className="py-2 px-2 text-sm text-right font-medium text-green-700">
                {labels.discount}
                {invoice.discountType === DiscountType.PERCENTAGE &&
                  ` (${Number(invoice.discountValue)}%)`}
              </td>
              <td className="py-2 px-2 text-sm text-right text-green-700">
                -{formatCurrency(Number(invoice.discountAmount), locale, currency)}
              </td>
            </tr>
          )}
          <tr className="border-b border-black/20">
            <td colSpan={3} className="py-2 px-2 text-sm text-right font-medium text-black">
              {labels.taxAmount} ({Number(invoice.taxRate)}%)
            </td>
            <td className="py-2 px-2 text-sm text-right text-black">
              {formatCurrency(Number(invoice.taxAmount), locale, currency)}
            </td>
          </tr>
          <tr className="border-t-2 border-black">
            <td colSpan={3} className="py-3 px-2 text-sm text-right font-bold text-black">
              {labels.total}
            </td>
            <td className="py-3 px-2 text-right font-bold text-black text-lg">
              {formatCurrency(Number(invoice.total), locale, currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className="mt-6 pt-4 border-t border-black/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
            {labels.notes}
          </h3>
          <p className="text-sm text-black whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}
