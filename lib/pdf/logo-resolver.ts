export async function resolveLogoToDataUrl(
  logo: string,
  baseUrl?: string
): Promise<string | null> {
  if (!logo?.trim()) return null;
  const trimmed = logo.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  const url =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : baseUrl
        ? new URL(trimmed, baseUrl).href
        : null;
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export function getImageFormatFromDataUrl(dataUrl: string): "PNG" | "JPEG" {
  const m = dataUrl.match(/^data:image\/(\w+)/i);
  const type = m?.[1]?.toLowerCase();
  return type === "jpeg" || type === "jpg" ? "JPEG" : "PNG";
}
