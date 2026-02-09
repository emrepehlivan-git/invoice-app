"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { sendInvoiceEmail } from "@/app/actions/invoice";
import { toast } from "sonner";

interface SendEmailButtonProps {
  invoiceId: string;
  locale: string;
  customerEmail: string | null;
  disabled?: boolean;
}

export function SendEmailButton({
  invoiceId,
  locale,
  customerEmail,
  disabled = false,
}: SendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations("invoices");

  const handleSendEmail = async () => {
    if (!customerEmail) {
      toast.error(t("errors.customerNoEmail"));
      return;
    }

    setIsSending(true);
    try {
      const result = await sendInvoiceEmail(invoiceId, locale);
      if (result.success) {
        toast.success(t("messages.emailSentSuccess"));
      } else {
        toast.error(result.message || t("messages.emailSentError"));
      }
    } catch {
      toast.error(t("messages.emailSentError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSendEmail}
      disabled={disabled || isSending || !customerEmail}
      title={!customerEmail ? t("errors.customerNoEmail") : undefined}
    >
      {isSending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Mail className="mr-2 size-4" />
      )}
      {isSending ? t("actions.sendingEmail") : t("actions.sendEmail")}
    </Button>
  );
}
