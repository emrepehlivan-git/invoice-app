import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileDown, Pencil } from "lucide-react";
import { SendEmailButton } from "@/components/invoices/send-email-button";
import { PrintInvoiceButton } from "@/components/invoices/print-invoice-button";
import { INVOICE_STATUS_COLORS } from "./constants";
import type { InvoiceStatus } from "@/types";

interface InvoiceDetailHeaderProps {
  invoiceNumber: string;
  status: InvoiceStatus;
  statusLabel: string;
  subtitle: string;
  orgSlug: string;
  invoiceId: string;
  locale: string;
  customerEmail: string;
  isCancelled: boolean;
  downloadLabel: string;
  editLabel: string;
  showEditButton: boolean;
}

export function InvoiceDetailHeader({
  invoiceNumber,
  status,
  statusLabel,
  subtitle,
  orgSlug,
  invoiceId,
  locale,
  customerEmail,
  isCancelled,
  downloadLabel,
  editLabel,
  showEditButton,
}: InvoiceDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/invoices`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{invoiceNumber}</h1>
            <Badge
              className={INVOICE_STATUS_COLORS[status]}
              variant="secondary"
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SendEmailButton
          invoiceId={invoiceId}
          locale={locale}
          customerEmail={customerEmail}
          disabled={isCancelled}
        />
        <PrintInvoiceButton />
        <Button variant="outline" asChild>
          <Link
            href={`/api/invoices/${invoiceId}/pdf?locale=${locale}`}
            download={`${invoiceNumber}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileDown className="mr-2 size-4" />
            {downloadLabel}
          </Link>
        </Button>
        {showEditButton && (
          <Button asChild>
            <Link href={`/${orgSlug}/invoices/${invoiceId}/edit`}>
              <Pencil className="mr-2 size-4" />
              {editLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
