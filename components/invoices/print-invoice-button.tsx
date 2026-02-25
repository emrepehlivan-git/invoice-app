"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  const t = useTranslations("invoices.actions");

  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="mr-2 size-4" />
      {t("print")}
    </Button>
  );
}
