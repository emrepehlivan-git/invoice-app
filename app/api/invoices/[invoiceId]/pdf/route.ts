import { NextResponse } from "next/server";
import { getInvoice } from "@/app/actions/invoice";
import { getSession } from "@/lib/auth/session";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { getInvoicePdfLabels } from "@/lib/pdf/labels";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import logger from "@/lib/logger";

const messages: Record<string, Parameters<typeof getInvoicePdfLabels>[0]> = {
  en: en as Parameters<typeof getInvoicePdfLabels>[0],
  tr: tr as Parameters<typeof getInvoicePdfLabels>[0],
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const url = new URL(_request.url);
    const locale = (url.searchParams.get("locale") ?? "en").toLowerCase();
    const localeKey = locale === "tr" ? "tr" : "en";
    const msg = messages[localeKey] ?? messages.en;
    const labels = getInvoicePdfLabels(msg);

    const pdfBuffer = generateInvoicePdf(invoice, labels, localeKey);
    const body = Buffer.from(
      pdfBuffer.buffer,
      pdfBuffer.byteOffset,
      pdfBuffer.byteLength
    );

    const filename = `${invoice.invoiceNumber}.pdf`;
    return new NextResponse(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(body.length),
      },
    });
  } catch (error) {
    logger.error("PDF export error", { error });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
