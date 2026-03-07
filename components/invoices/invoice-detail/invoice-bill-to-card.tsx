import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Customer } from "@/types";

interface InvoiceBillToCardProps {
  customer: Pick<
    Customer,
    | "name"
    | "email"
    | "phone"
    | "address"
    | "city"
    | "postalCode"
    | "country"
    | "taxNumber"
  >;
  title: string;
  taxNumberLabel: string;
}

export function InvoiceBillToCard({
  customer,
  title,
  taxNumberLabel,
}: InvoiceBillToCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-medium">{customer.name}</p>
        {customer.email && (
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        )}
        {customer.phone && (
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        )}
        {customer.address && (
          <p className="text-sm text-muted-foreground">{customer.address}</p>
        )}
        {(customer.city || customer.postalCode) && (
          <p className="text-sm text-muted-foreground">
            {[customer.city, customer.postalCode].filter(Boolean).join(" ")}
          </p>
        )}
        {customer.country && (
          <p className="text-sm text-muted-foreground">{customer.country}</p>
        )}
        {customer.taxNumber && (
          <p className="text-sm text-muted-foreground">
            {taxNumberLabel}: {customer.taxNumber}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
