import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { INVOICE_STATUS_COLORS } from "./constants";
import type { InvoiceStatus } from "@/types";

interface InvoiceInfoCardProps {
  invoiceNumber: string;
  status: InvoiceStatus;
  statusLabel: string;
  issueDate: Date;
  dueDate: Date;
  dateLocale: Locale;
  labels: {
    title: string;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
  };
}

export function InvoiceInfoCard({
  invoiceNumber,
  status,
  statusLabel,
  issueDate,
  dueDate,
  dateLocale,
  labels,
}: InvoiceInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {labels.invoiceNumber}
            </p>
            <p className="text-sm">{invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {labels.status}
            </p>
            <Badge
              className={INVOICE_STATUS_COLORS[status]}
              variant="secondary"
            >
              {statusLabel}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {labels.issueDate}
            </p>
            <p className="text-sm">
              {format(issueDate, "PPP", { locale: dateLocale })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {labels.dueDate}
            </p>
            <p className="text-sm">
              {format(dueDate, "PPP", { locale: dateLocale })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
