"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { updateOrganizationLogo, removeOrganizationLogo } from "@/app/actions/organization";
import { Upload, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const MAX_SIZE_BYTES = 500 * 1024;

type Props = {
  organizationId: string;
  currentLogoUrl: string | null;
};

export function OrganizationLogoUpload({
  organizationId,
  currentLogoUrl,
}: Props) {
  const t = useTranslations("settings.organization.logo");
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      toast.error(t("invalidType"));
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t("tooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await updateOrganizationLogo(organizationId, dataUrl);

      if (result.error) {
        toast.error(t("uploadError"));
        return;
      }

      toast.success(t("uploadSuccess"));
      router.refresh();
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      const result = await removeOrganizationLogo(organizationId);

      if (result.error) {
        toast.error(t("removeError"));
        return;
      }

      toast.success(t("removeSuccess"));
      router.refresh();
    } catch {
      toast.error(t("removeError"));
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      {currentLogoUrl ? (
        <div className="flex items-center gap-4">
          <Image
            src={currentLogoUrl}
            alt=""
            width={200}
            height={64}
            className="h-16 w-auto max-w-[200px] object-contain rounded border bg-muted/30"
            loading="lazy"
            decoding="async"
          />
          <div className="flex flex-col gap-2">
            <Input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="ml-2">{t("change")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">{t("remove")}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">{t("upload")}</span>
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
