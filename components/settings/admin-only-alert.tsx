import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { TranslationFunction } from "@/types";

interface AdminOnlyAlertProps {
  t: TranslationFunction;
}

export function AdminOnlyAlert({ t }: AdminOnlyAlertProps) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t("organization.adminOnly")}</AlertTitle>
      <AlertDescription>{t("organization.adminOnlyDescription")}</AlertDescription>
    </Alert>
  );
}
