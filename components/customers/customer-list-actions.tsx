"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { exportCustomersToCSV } from "@/lib/export/customer-export";
import { downloadCSV } from "@/lib/export/invoice-export";
import { CustomerImportDialog } from "@/components/customers/customer-import-dialog";
import type { Customer } from "@/types";

type CustomerListActionsProps = {
  organizationId: string;
  customers: Customer[];
  locale: string;
};

export function CustomerListActions({
  organizationId,
  customers,
  locale,
}: CustomerListActionsProps) {
  const t = useTranslations();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  function handleExportCSV() {
    try {
      const csvContent = exportCustomersToCSV(customers, locale);
      const filename = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(t("customers.export.success"));
    } catch {
      toast.error(t("customers.export.error"));
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={customers.length === 0}
        >
          <Download className="mr-2 size-4" />
          {t("customers.export.csv")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportDialogOpen(true)}
        >
          <Upload className="mr-2 size-4" />
          {t("customers.import.csv")}
        </Button>
      </div>
      <CustomerImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        organizationId={organizationId}
      />
    </>
  );
}
