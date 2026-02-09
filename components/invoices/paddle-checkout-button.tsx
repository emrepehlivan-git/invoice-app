"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPaddleCheckoutData } from "@/app/actions/paddle";
import { useRouter } from "@/i18n/navigation";

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

  // Initialize Paddle.js
  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!clientToken) {
      console.error("Paddle client token not configured");
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
          // Refresh the page to show updated payment status
          router.refresh();
        } else if (event.name === "checkout.closed") {
          // User closed checkout without completing
          setIsLoading(false);
        }
      },
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, [t, router]);

  const handleCheckout = async () => {
    if (!paddle) {
      toast.error(t("errors.paddleNotReady"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await getPaddleCheckoutData(invoiceId);

      if (!result.success) {
        toast.error(result.message || t("messages.createError"));
        setIsLoading(false);
        return;
      }

      const checkoutData = result.data;
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

      if (!priceId) {
        toast.error(t("errors.paddleNotConfigured"));
        setIsLoading(false);
        return;
      }

      // Open Paddle checkout overlay
      paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en", // Could be dynamic based on user locale
        },
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        customer: {
          email: checkoutData.customerEmail,
        },
        customData: {
          invoiceId: checkoutData.invoiceId,
          organizationId: checkoutData.organizationId,
          invoiceNumber: checkoutData.invoiceNumber,
          type: "invoice_payment",
        },
      });
    } catch {
      toast.error(t("messages.createError"));
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || !paddle}
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
}
