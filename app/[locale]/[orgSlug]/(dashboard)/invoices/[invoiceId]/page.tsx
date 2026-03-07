import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getCachedOrganizationBySlug } from "@/lib/cached-queries";
import { getInvoice, getInvoiceStatusHistory } from "@/app/actions/invoice";
import { redirect } from "@/i18n/navigation";
import { InvoiceStatus } from "@/types";
import { tr, enUS } from "date-fns/locale";
import {
  InvoiceDetailHeader,
  InvoiceBillToCard,
  InvoiceInfoCard,
  InvoiceItemsCard,
  InvoiceNotesCard,
} from "@/components/invoices/invoice-detail";
import { InvoiceStatusHistory } from "@/components/invoices/invoice-status-history";
import { PaymentSection } from "@/components/invoices/payment-section";
import {
  InvoicePrintView,
  type InvoicePrintLabels,
} from "@/components/invoices/invoice-print-view";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; invoiceId: string }>;
};

export default async function InvoiceDetailPage({ params }: Props) {
  const { locale, orgSlug, invoiceId } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const organization = await getCachedOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const [invoice, statusHistory] = await Promise.all([
    getInvoice(invoiceId, organization.id),
    getInvoiceStatusHistory(invoiceId, organization.id).catch(() => []),
  ]);

  if (!invoice) {
    notFound();
  }

  const t = await getTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  const printLabels: InvoicePrintLabels = {
    billTo: t("invoices.detail.billTo"),
    invoiceInfo: t("invoices.detail.invoiceInfo"),
    itemsTitle: t("invoices.detail.itemsTitle"),
    invoiceNumber: t("invoices.fields.invoiceNumber"),
    status: t("invoices.fields.status"),
    issueDate: t("invoices.fields.issueDate"),
    dueDate: t("invoices.fields.dueDate"),
    description: t("invoices.items.description"),
    quantity: t("invoices.items.quantity"),
    unitPrice: t("invoices.items.unitPrice"),
    total: t("invoices.fields.total"),
    subtotal: t("invoices.fields.subtotal"),
    discount: t("invoices.fields.discount"),
    taxAmount: t("invoices.fields.taxAmount"),
    notes: t("invoices.fields.notes"),
    taxNumber: t("customers.fields.taxNumber"),
  };

  return (
    <>
      <div className="print-only hidden">
        <InvoicePrintView
          invoice={invoice}
          locale={locale}
          labels={printLabels}
          statusLabel={t(`invoices.status.${invoice.status}`)}
        />
      </div>
      <div className="no-print space-y-6">
        <InvoiceDetailHeader
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          statusLabel={t(`invoices.status.${invoice.status}`)}
          subtitle={t("invoices.detail.title")}
          orgSlug={orgSlug}
          invoiceId={invoiceId}
          locale={locale}
          customerEmail={invoice.customer.email ?? ""}
          isCancelled={invoice.status === InvoiceStatus.CANCELLED}
          downloadLabel={t("invoices.actions.download")}
          editLabel={t("invoices.edit")}
          showEditButton={invoice.status === InvoiceStatus.DRAFT}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <InvoiceBillToCard
            customer={invoice.customer}
            title={t("invoices.detail.billTo")}
            taxNumberLabel={t("customers.fields.taxNumber")}
          />
          <InvoiceInfoCard
            invoiceNumber={invoice.invoiceNumber}
            status={invoice.status}
            statusLabel={t(`invoices.status.${invoice.status}`)}
            issueDate={new Date(invoice.issueDate)}
            dueDate={new Date(invoice.dueDate)}
            dateLocale={dateLocale}
            labels={{
              title: t("invoices.detail.invoiceInfo"),
              invoiceNumber: t("invoices.fields.invoiceNumber"),
              status: t("invoices.fields.status"),
              issueDate: t("invoices.fields.issueDate"),
              dueDate: t("invoices.fields.dueDate"),
            }}
          />
        </div>

        <InvoiceItemsCard
          items={invoice.items}
          subtotal={Number(invoice.subtotal)}
          discountAmount={invoice.discountAmount ? Number(invoice.discountAmount) : null}
          discountType={invoice.discountType}
          discountValue={invoice.discountValue ? Number(invoice.discountValue) : null}
          taxRate={Number(invoice.taxRate)}
          taxAmount={Number(invoice.taxAmount)}
          total={Number(invoice.total)}
          currency={invoice.currency ?? (locale === "tr" ? "TRY" : "USD")}
          labels={{
            title: t("invoices.detail.itemsTitle"),
            description: t("invoices.items.description"),
            quantity: t("invoices.items.quantity"),
            unitPrice: t("invoices.items.unitPrice"),
            total: t("invoices.fields.total"),
            subtotal: t("invoices.fields.subtotal"),
            discount: t("invoices.fields.discount"),
            taxAmount: t("invoices.fields.taxAmount"),
            totalLabel: t("invoices.fields.total"),
          }}
        />

        <PaymentSection
          invoiceId={invoiceId}
          organizationId={organization.id}
          invoiceTotal={Number(invoice.total)}
          invoiceStatus={invoice.status}
          currency={invoice.currency}
          locale={locale}
          payments={invoice.payments || []}
          customerEmail={invoice.customer.email ?? ""}
        />

        <InvoiceStatusHistory
          entries={statusHistory}
          dateLocale={dateLocale}
        />

        {invoice.notes && (
          <InvoiceNotesCard
            notes={invoice.notes}
            title={t("invoices.fields.notes")}
          />
        )}
      </div>
    </>
  );
}
