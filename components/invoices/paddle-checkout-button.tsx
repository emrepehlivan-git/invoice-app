"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPaddleTransaction } from "@/app/actions/paddle";
import { useRouter } from "@/i18n/navigation";
import { isActionError, handleActionErrorToast } from "@/lib/errors/client-public";

interface PaddleCheckoutButtonProps {
  invoiceId: string;
  disabled?: boolean;
}

export function PaddleCheckoutButton({
  invoiceId,
  disabled = false,
}: PaddleCheckoutButtonProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("invoices.payments");
  const router = useRouter();

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
    if (!clientToken) {
      console.error(
        "Paddle: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing. Add it to .env and restart the dev server (bun run dev)."
      );
      return;
    }

    initializePaddle({
      token: clientToken,
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
          ? "production"
          : "sandbox",
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          toast.success(t("messages.paddleSuccess"));
          router.refresh();
        } else if (event.name === "checkout.closed") {
          setIsLoading(false);
        } else if (event.name === "checkout.error") {
          setIsLoading(false);
          const err = (event as { data?: { error?: { code?: string; message?: string; detail?: string } } }).data?.error;
          const detail = err?.detail;
          const message =
            detail === "transaction_default_checkout_url_not_set"
              ? t("errors.paddleDefaultCheckoutUrlNotSet")
              : err?.message ?? err?.code ?? "Checkout error";
          console.error("Paddle checkout.error:", err ?? event);
          toast.error(message);
        }
      },
    })
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      })
      .catch((err) => {
        console.error("Paddle initialization failed:", err);
        toast.error(t("errors.paddleNotConfigured"));
      });
  }, [t, router]);

  const handleCheckout = async () => {
    if (!paddle) {
      toast.error(t("errors.paddleNotReady"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await createPaddleTransaction(invoiceId);

      if (isActionError(result)) {
        handleActionErrorToast(result, t, t("messages.createError"));
        setIsLoading(false);
        return;
      }

      const { transactionId } = result.data;

      paddle.Checkout.open({
        transactionId,
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
        },
      });
    } catch {
      toast.error(t("messages.createError"));
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || !paddle;
  const disabledDueToConfig = !disabled && !paddle;

  const button = (
    <Button
      onClick={handleCheckout}
      disabled={isDisabled}
      variant="default"
    >
      {isLoading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 size-4" />
      )}
      {isLoading ? t("paddleProcessing") : t("payOnline")}
    </Button>
  );

  if (disabledDueToConfig) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{t("errors.paddleNotConfigured")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
