import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getSiteUrl } from "./site-url";

/** Third page (index 2) — « Scan your Table » */
const TABLE_PAGE_INDEX = 2;

/** Reference artboard from print spec (mm). */
const PAGE_REF_MM = { width: 210, height: 279.6 };

/** Inner white card on page 3 (from layout diagram). */
const WHITE_CARD_MM = {
  top: 127,
  bottom: 79,
  side: 63.6,
};

const LAYOUT = {
  cardPaddingTopMm: 2,
  qrOffsetUpPt: 20,
  qrNameGapPt: 14,
  nameSize: 22,
  /** Hauteur QR fixe (mm) — ne pas réduire selon le nom */
  qrSizeMm: 58,
  /** Marge minimale sous le QR pour le bloc nom (mm) */
  nameAreaMm: 16,
  textColor: rgb(0.15, 0.12, 0.1),
};

const templatePath = path.join(process.cwd(), "public/docs/invitation.pdf");
const nameFontPath = path.join(process.cwd(), "assets/fonts/GildaDisplay-Regular.ttf");

let templateBytes: Uint8Array | null = null;
let nameFontBytes: Uint8Array | null = null;

function loadTemplate(): Uint8Array {
  if (!templateBytes) {
    templateBytes = fs.readFileSync(templatePath);
  }
  return templateBytes;
}

function loadNameFont(): Uint8Array {
  if (!nameFontBytes) {
    nameFontBytes = fs.readFileSync(nameFontPath);
  }
  return nameFontBytes;
}

function mmToPt(mm: number, pageSize: number, refSize: number): number {
  return (mm / refSize) * pageSize;
}

function mmX(mm: number, pageWidth: number): number {
  return mmToPt(mm, pageWidth, PAGE_REF_MM.width);
}

function mmYFromBottom(mm: number, pageHeight: number): number {
  return mmToPt(mm, pageHeight, PAGE_REF_MM.height);
}

function mmYFromTop(mm: number, pageHeight: number): number {
  return pageHeight - mmToPt(mm, pageHeight, PAGE_REF_MM.height);
}

function qrPayload(token: string): string {
  return `${getSiteUrl()}/i/${token}`;
}

export function getInvitationPdfUrl(token: string): string {
  return `${getSiteUrl()}/api/invitations/${encodeURIComponent(token)}.pdf`;
}

export type InvitationPdfData = {
  guestName: string;
  token: string;
};

function nameInitial(part: string): string {
  const letter = part.match(/\p{L}/u);
  return letter ? letter[0].toUpperCase() : part.charAt(0).toUpperCase();
}

/** Découpe le nom pour tenir dans l'espace PDF (espaces = parties). */
export function formatGuestNameLines(fullName: string): string[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [""];
  if (parts.length <= 2) return [parts.join(" ")];
  if (parts.length === 3) {
    return [`${parts[0]} ${parts[1]}`, parts[2]];
  }

  const line1 = `${parts[0]} ${parts[1]}`;
  const middle = parts.slice(2, parts.length - 1).join(" ");
  const lastInitial = `${nameInitial(parts[parts.length - 1])}.`;
  const line2 = middle ? `${middle} ${lastInitial}` : lastInitial;
  return [line1, line2];
}

function fitNameFontSize(
  lines: string[],
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  baseSize: number,
  maxWidthPt: number
): number {
  let size = baseSize;
  while (size > 10) {
    const tooWide = lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidthPt);
    if (!tooWide) break;
    size -= 0.5;
  }
  return size;
}

export async function generateInvitationPdf(data: InvitationPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.load(loadTemplate());
  doc.registerFontkit(fontkit);
  const page = doc.getPage(TABLE_PAGE_INDEX);
  const { width, height } = page.getSize();
  const nameFont = await doc.embedFont(loadNameFont());
  const color = LAYOUT.textColor;

  const name = data.guestName.trim();
  const nameLines = formatGuestNameLines(name);
  const nameSize = LAYOUT.nameSize;

  const cardWidthMm = PAGE_REF_MM.width - WHITE_CARD_MM.side * 2;
  const cardHeightMm = PAGE_REF_MM.height - WHITE_CARD_MM.top - WHITE_CARD_MM.bottom;
  const cardCenterXMm = PAGE_REF_MM.width / 2;
  const maxNameWidthPt = mmX(cardWidthMm * 0.92, width);

  const lineGapPt = nameSize * 0.28;
  const maxQrWidthMm = cardWidthMm * 0.96;
  const maxQrByHeightMm = cardHeightMm - LAYOUT.cardPaddingTopMm - LAYOUT.nameAreaMm;
  const qrSizeMm = Math.min(maxQrWidthMm, LAYOUT.qrSizeMm, maxQrByHeightMm);

  const qrSize = mmYFromBottom(qrSizeMm, height);
  const qrCenterX = mmX(cardCenterXMm, width);
  const qrX = qrCenterX - qrSize / 2;
  const qrTopMm = WHITE_CARD_MM.top + LAYOUT.cardPaddingTopMm;
  const qrTopY = mmYFromTop(qrTopMm, height) + LAYOUT.qrOffsetUpPt;
  const qrY = qrTopY - qrSize;

  const qrPng = await QRCode.toBuffer(qrPayload(data.token), {
    type: "png",
    width: 640,
    margin: 0,
    errorCorrectionLevel: "M",
  });
  const qrImage = await doc.embedPng(qrPng);
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const effectiveNameSize = fitNameFontSize(nameLines, nameFont, nameSize, maxNameWidthPt);
  const nameAscent = nameFont.heightAtSize(effectiveNameSize) * 0.78;
  const lineStep = nameFont.heightAtSize(effectiveNameSize) * 0.88 + lineGapPt;
  const firstLineY = qrY - LAYOUT.qrNameGapPt - nameAscent;

  nameLines.forEach((line, index) => {
    const lineWidth = nameFont.widthOfTextAtSize(line, effectiveNameSize);
    const lineY = firstLineY - index * lineStep;

    page.drawText(line, {
      x: qrCenterX - lineWidth / 2,
      y: lineY,
      size: effectiveNameSize,
      font: nameFont,
      color,
    });
  });

  return doc.save();
}
