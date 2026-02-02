import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getInvoice } from "@/app/actions/invoice";
import { redirect, Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { InvoiceStatus, DiscountType } from "@/types";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; invoiceId: string }>;
};

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  [InvoiceStatus.SENT]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  [InvoiceStatus.PAID]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  [InvoiceStatus.OVERDUE]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  [InvoiceStatus.CANCELLED]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export default async function InvoiceDetailPage({ params }: Props) {
  const { locale, orgSlug, invoiceId } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const organization = await getOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
  }

  const t = await getTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: locale === "tr" ? "TRY" : "USD",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${orgSlug}/invoices`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <Badge className={statusColors[invoice.status]} variant="secondary">
                {t(`invoices.status.${invoice.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t("invoices.detail.title")}
            </p>
          </div>
        </div>
        {invoice.status === InvoiceStatus.DRAFT && (
          <Button asChild>
            <Link href={`/${orgSlug}/invoices/${invoiceId}/edit`}>
              <Pencil className="mr-2 size-4" />
              {t("invoices.edit")}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.detail.billTo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{invoice.customer.name}</p>
            {invoice.customer.email && (
              <p className="text-sm text-muted-foreground">
                {invoice.customer.email}
              </p>
            )}
            {invoice.customer.phone && (
              <p className="text-sm text-muted-foreground">
                {invoice.customer.phone}
              </p>
            )}
            {invoice.customer.address && (
              <p className="text-sm text-muted-foreground">
                {invoice.customer.address}
              </p>
            )}
            {(invoice.customer.city || invoice.customer.postalCode) && (
              <p className="text-sm text-muted-foreground">
                {[invoice.customer.city, invoice.customer.postalCode]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
            {invoice.customer.country && (
              <p className="text-sm text-muted-foreground">
                {invoice.customer.country}
              </p>
            )}
            {invoice.customer.taxNumber && (
              <p className="text-sm text-muted-foreground">
                {t("customers.fields.taxNumber")}: {invoice.customer.taxNumber}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.detail.invoiceInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("invoices.fields.invoiceNumber")}
                </p>
                <p className="text-sm">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("invoices.fields.status")}
                </p>
                <Badge className={statusColors[invoice.status]} variant="secondary">
                  {t(`invoices.status.${invoice.status}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("invoices.fields.issueDate")}
                </p>
                <p className="text-sm">
                  {format(new Date(invoice.issueDate), "PPP", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("invoices.fields.dueDate")}
                </p>
                <p className="text-sm">
                  {format(new Date(invoice.dueDate), "PPP", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.detail.itemsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">
                  {t("invoices.items.description")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoices.items.quantity")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoices.items.unitPrice")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoices.items.total")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.total))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  {t("invoices.fields.subtotal")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(invoice.subtotal))}
                </TableCell>
              </TableRow>
              {invoice.discountAmount && Number(invoice.discountAmount) > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium text-green-600 dark:text-green-400">
                    {t("invoices.fields.discount")}
                    {invoice.discountType === DiscountType.PERCENTAGE &&
                      ` (${Number(invoice.discountValue)}%)`}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    -{formatCurrency(Number(invoice.discountAmount))}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  {t("invoices.fields.taxAmount")} ({Number(invoice.taxRate)}%)
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(invoice.taxAmount))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  {t("invoices.fields.total")}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(Number(invoice.total))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.fields.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
