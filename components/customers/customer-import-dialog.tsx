"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { importCustomersFromCSV } from "@/app/actions/customer";
import { handleActionErrorToast } from "@/lib/errors";

type CustomerImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
};

export function CustomerImportDialog({
  open,
  onOpenChange,
  organizationId,
}: CustomerImportDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [csvValue, setCsvValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const content = csvValue.trim();
    if (!content) {
      toast.error(t("customers.import.error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await importCustomersFromCSV(organizationId, content);

      if (result?.error) {
        handleActionErrorToast(result, t);
        return;
      }

      const data = result?.data;
      if (!data) return;

      if (data.errors.length > 0 && data.created === 0 && data.skipped === 0) {
        toast.error(
          data.errors.slice(0, 3).map((e) => t("customers.import.rowError", { row: e.row, message: e.message })).join("\n")
        );
      } else if (data.created > 0 || data.skipped > 0) {
        const msg =
          data.skipped > 0
            ? t("customers.import.success", {
              created: data.created,
              skipped: data.skipped,
            })
            : t("customers.import.successOnlyCreated", {
              created: data.created,
            });
        toast.success(msg);
      }

      if (data.errors.length > 0 && (data.created > 0 || data.skipped > 0)) {
        data.errors.slice(0, 5).forEach((e) => {
          toast.error(t("customers.import.rowError", { row: e.row, message: e.message }));
        });
      }

      setCsvValue("");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(t("customers.import.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") setCsvValue(text);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("customers.import.title")}</DialogTitle>
          <DialogDescription>{t("customers.import.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("customers.import.uploadOrPaste")}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {t("customers.import.selectFile")}
            </Button>
          </div>
          <Textarea
            placeholder="name,email,phone,taxNumber,address,city,country,postalCode,notes"
            value={csvValue}
            onChange={(e) => setCsvValue(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !csvValue.trim()}>
            {isSubmitting ? t("common.loading") : t("customers.import.csv")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
