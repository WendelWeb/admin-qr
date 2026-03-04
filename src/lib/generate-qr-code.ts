import QRCode from "qrcode";

export async function generateQrCode(url: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
  return dataUrl;
}
