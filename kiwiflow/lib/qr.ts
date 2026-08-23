import QRCode from "qrcode";

/**
 * Generated locally — no external QR API/vendor dependency (docs/BLUEPRINT.md
 * Section 0.7). Returns a data: URL PNG, cheap enough to inline directly in an <img>.
 */
export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { errorCorrectionLevel: "M", margin: 2, width: 320 });
}
