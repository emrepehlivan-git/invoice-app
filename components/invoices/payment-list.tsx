"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deletePayment } from "@/app/actions/payment";
import type { Payment } from "@/types";

interface PaymentListProps {
  payments: Payment[];
  currency: string;
  locale: string;
  canDelete?: boolean;
}

export function PaymentList({
  payments,
  currency,
  locale,
  canDelete = true,
}: PaymentListProps) {
  const t = useTranslations("invoices.payments");
  const dateLocale = locale === "tr" ? tr : enUS;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const handleDelete = async (paymentId: string) => {
    setDeletingId(paymentId);
    try {
      const result = await deletePayment(paymentId);
      if (result.success) {
        toast.success(t("messages.deleteSuccess"));
      } else {
        toast.error(result.message || t("messages.deleteError"));
      }
    } catch {
      toast.error(t("messages.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t("noPayments")}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("fields.paymentDate")}</TableHead>
          <TableHead>{t("fields.method")}</TableHead>
          <TableHead>{t("fields.reference")}</TableHead>
          <TableHead className="text-right">{t("fields.amount")}</TableHead>
          {canDelete && <TableHead className="w-[50px]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {format(new Date(payment.paymentDate), "PPP", {
                locale: dateLocale,
              })}
            </TableCell>
            <TableCell>{t(`method.${payment.method}`)}</TableCell>
            <TableCell className="text-muted-foreground">
              {payment.reference || "-"}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(Number(payment.amount))}
            </TableCell>
            {canDelete && (
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={deletingId === payment.id}
                    >
                      {deletingId === payment.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("deleteDialog.title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteDialog.description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("deleteDialog.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(payment.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("deleteDialog.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
