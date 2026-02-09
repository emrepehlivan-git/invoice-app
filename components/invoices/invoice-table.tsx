"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { exportInvoicesToCSV, downloadCSV } from "@/lib/export/invoice-export";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/navigation";
import { deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoice";
import { InvoiceStatus, type InvoiceWithCustomer } from "@/types";
import { formatCurrency } from "@/lib/currency";
import { ErrorCode } from "@/lib/errors/types";

type InvoiceTableProps = {
  invoices: InvoiceWithCustomer[];
  orgSlug: string;
  locale: string;
};

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  [InvoiceStatus.SENT]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  [InvoiceStatus.PAID]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  [InvoiceStatus.OVERDUE]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  [InvoiceStatus.CANCELLED]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export function InvoiceTable({ invoices, orgSlug, locale }: InvoiceTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] =
    useState<InvoiceWithCustomer | null>(null);
  const [invoiceToUpdate, setInvoiceToUpdate] = useState<{
    invoice: InvoiceWithCustomer;
    status: InvoiceStatus;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = locale === "tr" ? tr : enUS;

  function handleDeleteClick(invoice: InvoiceWithCustomer) {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  }

  function handleStatusChange(
    invoice: InvoiceWithCustomer,
    status: InvoiceStatus
  ) {
    setInvoiceToUpdate({ invoice, status });
    setStatusDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!invoiceToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteInvoice(invoiceToDelete.id);

      if (result?.error) {
        if (result.error === ErrorCode.CANNOT_DELETE) {
          toast.error(t("invoices.errors.cannotDelete"));
        } else {
          toast.error(t("invoices.messages.deleteError"));
        }
        return;
      }

      toast.success(t("invoices.messages.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  }

  async function handleStatusConfirm() {
    if (!invoiceToUpdate) return;

    setIsLoading(true);
    try {
      const result = await updateInvoiceStatus(
        invoiceToUpdate.invoice.id,
        invoiceToUpdate.status
      );

      if (result?.error) {
        toast.error(t("invoices.messages.statusUpdateError"));
        return;
      }

      toast.success(t("invoices.messages.statusUpdateSuccess"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
      setStatusDialogOpen(false);
      setInvoiceToUpdate(null);
    }
  }

  function handleExportCSV() {
    try {
      const csvContent = exportInvoicesToCSV(invoices, locale);
      const filename = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(t("invoices.export.success"));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("invoices.export.error"));
    }
  }

  if (invoices.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        {t("invoices.list.empty")}
      </p>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 size-4" />
          {t("invoices.export.csv")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("invoices.table.invoiceNumber")}</TableHead>
            <TableHead>{t("invoices.table.customer")}</TableHead>
            <TableHead>{t("invoices.table.issueDate")}</TableHead>
            <TableHead>{t("invoices.table.dueDate")}</TableHead>
            <TableHead className="text-right">
              {t("invoices.table.total")}
            </TableHead>
            <TableHead>{t("invoices.table.status")}</TableHead>
            <TableHead className="w-[70px]">
              {t("invoices.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>{invoice.customer.name}</TableCell>
              <TableCell>
                {format(new Date(invoice.issueDate), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </TableCell>
              <TableCell>
                {format(new Date(invoice.dueDate), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(Number(invoice.total), invoice.currency)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[invoice.status]} variant="secondary">
                  {t(`invoices.status.${invoice.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">
                        {t("invoices.table.actions")}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/${orgSlug}/invoices/${invoice.id}`}>
                        <Eye className="mr-2 size-4" />
                        {t("invoices.view")}
                      </Link>
                    </DropdownMenuItem>
                    {invoice.status === InvoiceStatus.DRAFT && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${orgSlug}/invoices/${invoice.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          {t("invoices.edit")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {invoice.status === InvoiceStatus.DRAFT && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(invoice, InvoiceStatus.SENT)
                        }
                      >
                        <Send className="mr-2 size-4" />
                        {t("invoices.actions.markAsSent")}
                      </DropdownMenuItem>
                    )}
                    {(invoice.status === InvoiceStatus.SENT ||
                      invoice.status === InvoiceStatus.OVERDUE) && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(invoice, InvoiceStatus.PAID)
                        }
                      >
                        <CheckCircle className="mr-2 size-4" />
                        {t("invoices.actions.markAsPaid")}
                      </DropdownMenuItem>
                    )}
                    {invoice.status === InvoiceStatus.SENT && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(invoice, InvoiceStatus.OVERDUE)
                        }
                      >
                        <AlertCircle className="mr-2 size-4" />
                        {t("invoices.actions.markAsOverdue")}
                      </DropdownMenuItem>
                    )}
                    {invoice.status !== InvoiceStatus.CANCELLED &&
                      invoice.status !== InvoiceStatus.PAID && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(invoice, InvoiceStatus.CANCELLED)
                          }
                        >
                          <XCircle className="mr-2 size-4" />
                          {t("invoices.actions.cancel")}
                        </DropdownMenuItem>
                      )}
                    {(invoice.status === InvoiceStatus.DRAFT ||
                      invoice.status === InvoiceStatus.CANCELLED) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(invoice)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          {t("invoices.delete")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("invoices.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteDialog.description", {
                invoiceNumber: invoiceToDelete?.invoiceNumber ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t("invoices.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("invoices.statusDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.statusDialog.description", {
                status: invoiceToUpdate
                  ? t(`invoices.status.${invoiceToUpdate.status}`)
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t("invoices.statusDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusConfirm} disabled={isLoading}>
              {t("invoices.statusDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
