"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "./payment-form";
import { PaymentList } from "./payment-list";
import { PaddleCheckoutButton } from "./paddle-checkout-button";
import type { Payment } from "@/types";
import { InvoiceStatus } from "@/types";

interface PaymentSectionProps {
  invoiceId: string;
  organizationId: string;
  invoiceTotal: number;
  invoiceStatus: InvoiceStatus;
  currency: string;
  locale: string;
  payments: Payment[];
  customerEmail: string | null;
}

export function PaymentSection({
  invoiceId,
  organizationId,
  invoiceTotal,
  invoiceStatus,
  currency,
  locale,
  payments,
  customerEmail,
}: PaymentSectionProps) {
  const t = useTranslations("invoices.payments");

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingAmount = Math.max(0, invoiceTotal - totalPaid);
  const isFullyPaid = remainingAmount < 0.01;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const canAddPayment =
    invoiceStatus !== InvoiceStatus.DRAFT &&
    invoiceStatus !== InvoiceStatus.CANCELLED &&
    !isFullyPaid;

  const canPayOnline = canAddPayment && !!customerEmail;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription className="mt-1">
              {t("totalPaid")}: {formatCurrency(totalPaid)} / {formatCurrency(invoiceTotal)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {isFullyPaid ? (
              <Badge variant="default" className="bg-green-600">
                {t("fullyPaid")}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("remaining")}: {formatCurrency(remainingAmount)}
              </span>
            )}
            <PaddleCheckoutButton
              invoiceId={invoiceId}
              disabled={!canPayOnline}
            />
            <PaymentForm
              invoiceId={invoiceId}
              organizationId={organizationId}
              remainingAmount={remainingAmount}
              currency={currency}
              disabled={!canAddPayment}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PaymentList
          payments={payments}
          currency={currency}
          locale={locale}
          canDelete={invoiceStatus !== InvoiceStatus.CANCELLED}
        />
      </CardContent>
    </Card>
  );
}
