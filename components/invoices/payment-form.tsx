"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPayment } from "@/app/actions/payment";
import { PaymentMethod } from "@/types";

const paymentMethods = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.CHECK,
  PaymentMethod.OTHER,
] as const;

interface PaymentFormProps {
  invoiceId: string;
  organizationId: string;
  remainingAmount: number;
  currency: string;
  disabled?: boolean;
}

export function PaymentForm({
  invoiceId,
  organizationId,
  remainingAmount,
  currency,
  disabled = false,
}: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("invoices.payments");

  const formSchema = z.object({
    amount: z.coerce
      .number()
      .min(0.01, t("errors.exceedsBalance"))
      .max(remainingAmount + 0.01, t("errors.exceedsBalance")),
    paymentDate: z.string().min(1),
    method: z.nativeEnum(PaymentMethod),
    reference: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: remainingAmount,
      paymentDate: new Date().toISOString().split("T")[0],
      method: PaymentMethod.BANK_TRANSFER,
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await createPayment(organizationId, {
        invoiceId,
        amount: values.amount,
        paymentDate: new Date(values.paymentDate),
        method: values.method,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      });

      if (result.success) {
        toast.success(t("messages.createSuccess"));
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.message || t("messages.createError"));
      }
    } catch {
      toast.error(t("messages.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled || remainingAmount <= 0}>
          <Plus className="mr-2 size-4" />
          {t("addPayment")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addPayment")}</DialogTitle>
          <DialogDescription>
            {t("remaining")}: {remainingAmount.toFixed(2)} {currency}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={remainingAmount}
                      placeholder={t("fields.amountPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.paymentDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.method")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("fields.selectMethod")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(`method.${method}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.reference")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fields.referencePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("fields.notesPlaceholder")}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("deleteDialog.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t("addPayment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
