import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { DiscountType } from "@/types";
import type { InvoiceItem } from "@/types";

interface InvoiceItemsCardProps {
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number | null;
  discountType: string | null;
  discountValue: number | null;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  labels: {
    title: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    subtotal: string;
    discount: string;
    taxAmount: string;
    totalLabel: string;
  };
}

export function InvoiceItemsCard({
  items,
  subtotal,
  discountAmount,
  discountType,
  discountValue,
  taxRate,
  taxAmount,
  total,
  currency,
  labels,
}: InvoiceItemsCardProps) {
  const hasDiscount = discountAmount != null && discountAmount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">{labels.description}</TableHead>
              <TableHead className="text-right">{labels.quantity}</TableHead>
              <TableHead className="text-right">{labels.unitPrice}</TableHead>
              <TableHead className="text-right">{labels.total}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">
                  {Number(item.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(item.unitPrice), currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(item.total), currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                {labels.subtotal}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(subtotal, currency)}
              </TableCell>
            </TableRow>
            {hasDiscount && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-right font-medium text-green-600 dark:text-green-400"
                >
                  {labels.discount}
                  {discountType === DiscountType.PERCENTAGE &&
                    discountValue != null &&
                    ` (${discountValue}%)`}
                </TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400">
                  -{formatCurrency(discountAmount, currency)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                {labels.taxAmount} ({taxRate}%)
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(taxAmount, currency)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">
                {labels.totalLabel}
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {formatCurrency(total, currency)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
