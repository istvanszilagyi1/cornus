import fs from "node:fs";
import path from "node:path";
import nodemailer, { type SendMailOptions } from "nodemailer";
import PDFDocument from "pdfkit";

import { SITE } from "./site.ts";

export type BookingEmailAction = "booking_received" | "booking_approved" | "booking_rejected";

export type BookingEmailPayload = {
  action: BookingEmailAction;
  guest_name: string;
  email: string;
  phone?: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
  guests?: number;
  dogs?: number;
  message?: string | null;
  total?: number;
  deposit?: number;
  payment_note?: string | null;
  nights?: number;
  adult_guests?: number;
  child_guests?: number;
  toddler_guests?: number;
  room_subtotal?: number;
  ifa_subtotal?: number;
  dog_subtotal?: number;
  single_night_surcharge?: number;
  nightly_adult_rate?: number;
  nightly_child_rate?: number;
};

export function normalizeBookingEmailPayload(input: Partial<BookingEmailPayload>): BookingEmailPayload {
  return {
    action: (input.action ?? "booking_received") as BookingEmailAction,
    guest_name: String(input.guest_name ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: input.phone ?? null,
    check_in: String(input.check_in ?? ""),
    check_out: String(input.check_out ?? ""),
    adults: Number(input.adults ?? 1),
    children: Number(input.children ?? 0),
    guests: Number(input.guests ?? input.adults ?? 1),
    dogs: Number(input.dogs ?? 0),
    message: input.message ?? null,
    total: Number(input.total ?? 0),
    deposit: Number(input.deposit ?? 0),
    payment_note: input.payment_note ?? null,
    nights: Number(input.nights ?? 0),
    adult_guests: Number(input.adult_guests ?? input.adults ?? 0),
    child_guests: Number(input.child_guests ?? input.children ?? 0),
    toddler_guests: Number(input.toddler_guests ?? 0),
    room_subtotal: Number(input.room_subtotal ?? 0),
    ifa_subtotal: Number(input.ifa_subtotal ?? 0),
    dog_subtotal: Number(input.dog_subtotal ?? 0),
    single_night_surcharge: Number(input.single_night_surcharge ?? 0),
    nightly_adult_rate: Number(input.nightly_adult_rate ?? 0),
    nightly_child_rate: Number(input.nightly_child_rate ?? 0),
  };
}

const BRAND_CARD_PATH = path.join(process.cwd(), "public", "nevjegy.png");
const HOUSE_RULES_PATH = path.join(process.cwd(), "public", "hazirend.pdf");

function getSmtpConfig() {
  const port = Number(process.env["SMTP_PORT"] ?? "465");
  return {
    host: process.env["SMTP_HOST"] ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env["SMTP_USER"] ?? "cornustokaj@gmail.com",
      pass: process.env["SMTP_PASS"] ?? "",
    },
  };
}

function normalizeEmailList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "-";
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(date);
}

function formatMoney(value: number | undefined) {
  const safeValue = Number(value ?? 0);
  return `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(safeValue)} Ft`;
}

function getNotificationRecipients() {
  const primary = process.env["SMTP_USER"] ?? "cornustokaj@gmail.com";
  return normalizeEmailList(primary).filter(Boolean);
}

function getBankingDetails() {
  return {
    bankName: process.env["BANK_NAME"] ?? "OTP Bank",
    accountHolder: process.env["BANK_ACCOUNT_HOLDER"] ?? "Katona Fruzsina",
    accountNumber: process.env["BANK_ACCOUNT_NUMBER"] ?? "11773384-01987919",
    iban: process.env["BANK_IBAN"] ?? "HU62117733840198791900000000",
    swift: process.env["BANK_SWIFT"] ?? "OTPVHUHB",
  };
}

function getSummaryValues(payload: BookingEmailPayload) {
  const nights = Math.max(Number(payload.nights ?? 0), 1);
  const adultGuests = Math.max(Number(payload.adult_guests ?? payload.adults ?? 0), 0);
  const childGuests = Math.max(Number(payload.child_guests ?? payload.children ?? 0), 0);
  const toddlerGuests = Math.max(Number(payload.toddler_guests ?? 0), 0);
  const roomSubtotal = Math.max(Number(payload.room_subtotal ?? 0), 0);
  const ifaSubtotal = Math.max(Number(payload.ifa_subtotal ?? 0), 0);
  const dogSubtotal = Math.max(Number(payload.dog_subtotal ?? 0), 0);
  const singleNightSurcharge = Math.max(Number(payload.single_night_surcharge ?? 0), 0);
  const total = Math.max(Number(payload.total ?? roomSubtotal + ifaSubtotal + dogSubtotal + singleNightSurcharge), 0);
  const deposit = Math.max(Number(payload.deposit ?? total * 0.5), 0);

  return {
    nights,
    adultGuests,
    childGuests,
    toddlerGuests,
    roomSubtotal,
    ifaSubtotal,
    dogSubtotal,
    singleNightSurcharge,
    total,
    deposit,
  };
}

function getContactLineHtml() {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2a2d; line-height: 1.6;">
      <p style="margin: 0 0 4px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #7a897b;"><strong>CORNUS Vendégház</strong></p>
      <p style="margin: 0; font-size: 13px;">${SITE.address}</p>
      <p style="margin: 0; font-size: 13px;">${SITE.phone}</p>
      <p style="margin: 0; font-size: 13px;">${SITE.email}</p>
    </div>
  `;
}

export function buildGuestEmailHtml(payload: BookingEmailPayload) {
  const summary = getSummaryValues(payload);
  const guests = payload.guests ?? Math.max(1, Number(payload.adults ?? 1) + Number(payload.children ?? 0));
  const bankingDetails = getBankingDetails();
  const remainingAmount = Math.max(summary.total - summary.deposit, 0);

  const bodyText = {
    booking_received: "Köszönjük a foglalási kérelmedet! A foglalásod jóváhagyásához és véglegesítéséhez kérjük, utald át az előleget (a végösszeg 50%-át) a lent megadott bankszámlára 48 órán belül. Az alábbiakban találod a pontos árkalkulációt és a banki adatokat. Az érkezés 15:00-16:00 között a távozás pedig 10:00. Ettől eltérő távozás külön egyeztetést igényel.",
    booking_approved: `Örömmel értesítünk, hogy a foglalásod jóváhagyásra került! Szeretettel várunk a Cornus Vendégházban. A gördülékeny tartózkodás érdekében csatolva küldjük a szálláshely házirendjét. Az érkezés 15:00-16:00 között a távozás pedig 10:00. Ettől eltérő távozás külön egyeztetést igényel. A fennmaradó összeget (${formatMoney(remainingAmount)}) kérjük, legkésőbb az érkezésed előtti estig utald el az alábbi bankszámlára.`,
    booking_rejected: "Sajnáljuk, de a megadott időpontokra a foglalásod elutasításra került. Kérjük, válassz másik időpontot a weboldalon, vagy vedd fel velünk a kapcsolatot, hogy közösen találjunk egy megfelelő dátumot.",
  }[payload.action];

  const adultRate = Number(payload.nightly_adult_rate ?? 0);
  const childRate = Number(payload.nightly_child_rate ?? 0);
  const fallbackPaymentNote = "A foglalás teljes költségének 50%-át kell átutalni a megadott bankszámlára. Az előleget 48 órán belül el kell utalni, a foglalási névvel megjelölve.";
  const paymentNote = payload.action === "booking_approved"
    ? ""
    : ((payload.payment_note ?? fallbackPaymentNote).trim() || fallbackPaymentNote).includes("48")
      ? (payload.payment_note ?? fallbackPaymentNote).trim() || fallbackPaymentNote
      : `${(payload.payment_note ?? fallbackPaymentNote).trim() || fallbackPaymentNote} Az előleget 48 órán belül el kell utalni, a foglalási névvel megjelölve.`;

  const mathRows = payload.action === "booking_rejected"
    ? ""
    : [
      summary.adultGuests > 0 && adultRate > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Felnőttek (${summary.adultGuests} fő × ${summary.nights} éj)</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.adultGuests * summary.nights * adultRate)}</td></tr>` : "",
      summary.childGuests > 0 && childRate > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Gyermekek (${summary.childGuests} fő × ${summary.nights} éj)</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.childGuests * summary.nights * childRate)}</td></tr>` : "",
      summary.toddlerGuests > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Kisgyermekek (${summary.toddlerGuests} fő)</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(0)}</td></tr>` : "",
      summary.roomSubtotal > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Szállásdíj (${summary.nights} éj, ${guests} fő)</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.roomSubtotal)}</td></tr>` : "",
      summary.singleNightSurcharge > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Egyéjszakás felár</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.singleNightSurcharge)}</td></tr>` : "",
      summary.ifaSubtotal > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">IFA (Idegenforgalmi adó)</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.ifaSubtotal)}</td></tr>` : "",
      summary.dogSubtotal > 0 ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; color: #3a3a3a;">Kutya felár</td><td style="padding: 10px 12px; border-bottom: 1px solid #e7e2d8; text-align: right; color: #1d1d1d;">${formatMoney(summary.dogSubtotal)}</td></tr>` : ""
    ].join("");

  const pricingSummaryMarkup = payload.action === "booking_rejected"
    ? ""
    : `
          <h3 style="margin: 0 0 12px; font-size: 22px; color: #1f2a2d;">Árkalkuláció</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0 0 18px; background: #fff; border: 1px solid #ece3d8;">
            ${mathRows}
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0 0 22px; background: #f5f0e8; border: 1px solid #d9d0c1;">
            <tr>
              <td style="padding: 12px 14px; font-weight: 700; color: #1f2a2d;">Összesen</td>
              <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #1f2a2d;">${formatMoney(summary.total)}</td>
            </tr>
            ${payload.action === "booking_approved" ? `
              <tr>
                <td style="padding: 12px 14px; font-weight: 700; color: #1f2a2d;">Befizetett összeg</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #1f2a2d;">${formatMoney(summary.deposit)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; font-weight: 800; color: #1f2a2d;">Fennmaradó összeg (érkezés előtti estig fizetendő)</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #1f2a2d;">${formatMoney(remainingAmount)}</td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 12px 14px; font-weight: 700; color: #1f2a2d;">Előleg (50%)</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #1f2a2d;">${formatMoney(summary.deposit)}</td>
              </tr>
            `}
          </table>

          ${payload.action !== "booking_rejected" && paymentNote ? `<p style="margin: 0 0 20px; padding: 12px 14px; background: #f7f1e6; border: 1px solid #e2d7c2; border-radius: 8px; color: #374151;">${paymentNote}</p>` : ""}`;

  return `
    <div style="font-family: Arial, sans-serif; color: #151515; line-height: 1.6; background: #f7f3ee; padding: 24px;">
      <div style="max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e7e2d8; border-radius: 14px; overflow: hidden;">
        <div style="padding: 22px 22px 0; background: #f5f0e8; border-bottom: 1px solid #e7e2d8;">
          <img src="cid:cornus-brand-card" alt="Cornus Vendégház" style="display: block; width: 100%; max-width: 640px; height: auto; margin: 0 auto 18px; border-radius: 12px;" />
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Kedves ${payload.guest_name}!</p>
          <p style="margin: 0 0 22px; font-size: 15px; color: #3f3f46;">${bodyText}</p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0 0 20px; background: #faf7f2; border: 1px solid #ece3d8; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 12px; width: 180px; color: #555;">Érkezés:</td>
              <td style="padding: 10px 12px; font-weight: 700; color: #1d1d1d;">${formatDate(payload.check_in)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; width: 180px; color: #555;">Távozás:</td>
              <td style="padding: 10px 12px; font-weight: 700; color: #1d1d1d;">${formatDate(payload.check_out)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; width: 180px; color: #555;">Vendégszám:</td>
              <td style="padding: 10px 12px; font-weight: 700; color: #1d1d1d;">${guests} fő (${payload.adults ?? 0} felnőtt, ${payload.children ?? 0} gyermek)</td>
            </tr>
            ${payload.dogs && Number(payload.dogs) > 0 ? `
              <tr>
                <td style="padding: 10px 12px; width: 180px; color: #555;">Kutya:</td>
                <td style="padding: 10px 12px; font-weight: 700; color: #1d1d1d;">${payload.dogs ?? 0} db</td>
              </tr>
            ` : ""}
          </table>

          ${pricingSummaryMarkup}

          ${payload.action === "booking_received" || payload.action === "booking_approved" ? `
            <div style="margin: 0 0 20px; padding: 18px; border: 1px solid #d8d7d1; background: #f9fafb; border-radius: 10px;">
              <h3 style="margin: 0 0 8px; font-size: 20px; color: #1f2a2d;">Fizetési adatok – banki átutalás</h3>
              <p style="margin: 0 0 6px;"><strong>Bank:</strong> ${bankingDetails.bankName}</p>
              <p style="margin: 0 0 6px;"><strong>Kedvezményezett:</strong> ${bankingDetails.accountHolder}</p>
              <p style="margin: 0 0 6px;"><strong>Számlaszám:</strong> ${bankingDetails.accountNumber}</p>
              <p style="margin: 0 0 6px;"><strong>IBAN:</strong> ${bankingDetails.iban}</p>
              <p style="margin: 0 0 6px;"><strong>SWIFT/BIC:</strong> ${bankingDetails.swift}</p>
              <p style="margin: 12px 0 0; color: #1f2a2d;"><strong>Közlemény:</strong> Kérjük, a közleménybe írd be a foglaló nevét (${payload.guest_name}) és a dátumot (${formatDate(payload.check_in)}).</p>
              ${payload.action === "booking_received" ? `<p style="margin: 10px 0 0; color: #1f2a2d;"><strong>Fontos:</strong> Az előleget (${formatMoney(summary.deposit)}) 48 órán belül el kell utalni, különben a foglalási kérelem érvénytelenné válik.</p>` : `<p style="margin: 10px 0 0; color: #1f2a2d;"><strong>Fontos:</strong> A fennmaradó összeget (${formatMoney(remainingAmount)}) legkésőbb az érkezésed előtti estig kérjük átutalni.</p>`}
            </div>
          ` : ""}

          ${payload.message ? `<p style="margin: 0 0 18px; color: #3d3d40;"><strong>Üzeneted:</strong><br />${payload.message}</p>` : ""}
          ${payload.action === "booking_received" ? `<p style="margin: 0 0 10px; color: #4b5563;">Amint beérkezik az előleg, egy újabb e-mailben véglegesítjük és visszaigazoljuk a foglalásodat.</p>` : ""}

          <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #ece3d8;">
            ${getContactLineHtml()}
          </div>

          <p style="margin: 18px 0 0; font-size: 14px; color: #4b5563;">Üdvözlettel,<br />Cornus Vendégház</p>
        </div>
      </div>
    </div>
  `;
}

export function buildAdminNotificationHtml(payload: BookingEmailPayload) {
  const summary = getSummaryValues(payload);
  return `
    <div style="font-family: Arial, sans-serif; color: #191919; line-height: 1.6; background: #f7f3ee; padding: 24px;">
      <div style="max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e7e2d8; border-radius: 12px; overflow: hidden;">
        <div style="padding: 18px 22px; background: #f5f0e8; border-bottom: 1px solid #e7e2d8;">
          <img src="cid:cornus-brand-card" alt="Cornus Vendégház" style="display: block; width: 100%; max-width: 520px; height: auto; margin: 0 auto; border-radius: 10px;" />
        </div>
        <div style="padding: 28px;">
          <h2 style="margin: 0 0 16px; font-size: 26px; color: #1f2a2d;">Új foglalási értesítés</h2>
          <p style="margin: 0 0 14px;"><strong>Vendég:</strong> ${payload.guest_name}</p>
          <p style="margin: 0 0 14px;"><strong>Email:</strong> ${payload.email}</p>
          <p style="margin: 0 0 14px;"><strong>Telefon:</strong> ${payload.phone ?? "-"}</p>
          <p style="margin: 0 0 14px;"><strong>Időpont:</strong> ${formatDate(payload.check_in)} – ${formatDate(payload.check_out)} (${summary.nights} éj)</p>
          <p style="margin: 0 0 14px;"><strong>Vendégek:</strong> ${payload.adults ?? 0} felnőtt, ${payload.children ?? 0} gyermek, ${payload.dogs ?? 0} kutya</p>
          <p style="margin: 0 0 14px;"><strong>Foglalás összege:</strong> ${formatMoney(summary.total)}</p>
          <p style="margin: 0 0 14px;"><strong>Előleg:</strong> ${formatMoney(summary.deposit)}</p>
          ${payload.message ? `<p style="margin: 0 0 14px;"><strong>Üzenet:</strong> ${payload.message}</p>` : ""}
          <p style="margin: 0; color: #4b5563;">A vendég számára elküldött ajánlat külön tartalmazza az árkalkulációt, ez itt a kezelői összefoglaló.</p>
        </div>
      </div>
    </div>
  `;
}

async function createHouseRulesPdfBuffer() {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (error) => reject(error));

    doc.fontSize(22).text("CORNUS Vendégház – Házirend", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text("A vendégház használata során kérjük, a vendégek tartózkodjanak a szálláshely rendjéhez és a környezet tiszteletben tartásához.");
    doc.moveDown();
    doc.list([
      "Az érkezés és a távozás időpontjának betartása kötelező.",
      "A helyiségekben kérjük a csend és a tisztaság fenntartását.",
      "A dohányzást csak a kijelölt helyen engedélyezzük.",
      "A berendezések és eszközök rendeltetésszerű, óvatos használata kötelező.",
      "Az itt tartózkodó állatokat a házirend szerint kell kezelni.",
      "A vendégek minden környezeti és közösségi szabályt betartanak.",
    ]);
    doc.moveDown();
    doc.text("Köszönjük a megértést és a tisztességes együttműködést.");
    doc.end();
  });
}

export async function sendBookingEmail(payload: BookingEmailPayload) {
  const normalizedPayload = normalizeBookingEmailPayload(payload);
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });

  const notificationRecipients = getNotificationRecipients();
  const subjectByAction: Record<BookingEmailAction, string> = {
    booking_received: "Foglalási kérelem elküldve – Cornus Vendégház",
    booking_approved: "Foglalás jóváhagyva – Cornus Vendégház",
    booking_rejected: "Foglalási kérelem elutasítva – Cornus Vendégház",
  };

  const approvedHouseRulesAttachment = payload.action === "booking_approved"
    ? [
      { filename: "cornus-hazirend.pdf", content: fs.existsSync(HOUSE_RULES_PATH) ? fs.readFileSync(HOUSE_RULES_PATH) : await createHouseRulesPdfBuffer(), contentType: "application/pdf" },
    ]
    : [];

  const guestMailOptions: SendMailOptions = {
    from: `${process.env["SMTP_FROM_NAME"] ?? "Cornus Vendégház"} <${process.env["SMTP_USER"] ?? "cornustokaj@gmail.com"}>`,
    to: normalizedPayload.email,
    replyTo: process.env["SMTP_USER"] ?? "cornustokaj@gmail.com",
    subject: subjectByAction[normalizedPayload.action],
    html: buildGuestEmailHtml(normalizedPayload),
    attachments: [
      { filename: "nevjegy.png", path: BRAND_CARD_PATH, cid: "cornus-brand-card" },
      ...approvedHouseRulesAttachment,
    ],
  };

  await transporter.sendMail(guestMailOptions);

  if (!notificationRecipients.length) {
    return { sent: true };
  }

  const adminMailOptions: SendMailOptions = {
    from: `${process.env["SMTP_FROM_NAME"] ?? "Cornus Vendégház"} <${process.env["SMTP_USER"] ?? "cornustokaj@gmail.com"}>`,
    to: notificationRecipients.join(","),
    replyTo: process.env["SMTP_USER"] ?? "cornustokaj@gmail.com",
    subject: normalizedPayload.action === "booking_approved"
      ? "Foglalás elfogadva – Cornus Vendégház"
      : normalizedPayload.action === "booking_rejected"
        ? "Foglalás elutasítva – Cornus Vendégház"
        : "Új foglalási kérelm érkezett – Cornus Vendégház",
    html: buildAdminNotificationHtml(normalizedPayload),
    attachments: [{ filename: "nevjegy.png", path: BRAND_CARD_PATH, cid: "cornus-brand-card" }],
  };

  await transporter.sendMail(adminMailOptions);
  return { sent: true };
}