import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  bulletinMail,
  contactCopyMail,
  contactStoreMail,
  newsletterWelcomeMail,
  orderCustomerMail,
  orderStoreMail,
  passwordChangedMail,
  resetMail,
  verificationMail,
} from "../src/lib/distinto-mail.ts";

const order = {
  orderNumber: "ORD-2026-014",
  customerName: "Ana Ruiz",
  customerEmail: "ana.ruiz@correo.com",
  phone: "33 1200 4455",
  address: "Av. Juárez 120 int. 4, Americana",
  city: "Guadalajara, Jalisco, C.P. 44100",
  subtotal: 1890,
  discount: 189,
  shipping: 0,
  total: 1701,
  isGift: true,
  giftRecipientName: "Luis Ruiz",
  giftRecipientAddress: "Orizaba 45, Roma Norte, Ciudad de México",
  giftNote: "Feliz cumpleaños.",
  items: [
    { name: "Camisa Slim Fit", quantity: 1, size: "M", color: "Azul", total: 890 },
    { name: "Cinturón Piel", quantity: 1, size: "Única", color: "Negro", total: 1000 },
  ],
};

const pages = [
  verificationMail("510297"),
  resetMail("http://localhost:3000/login/restablecer?token=ejemplo"),
  passwordChangedMail(),
  newsletterWelcomeMail(),
  { subject: "Nueva colección de otoño", ...bulletinMail({ kind: "DESCUENTO", subject: "Nueva colección de otoño", body: "Llegaron piezas nuevas en hombre, mujer y junior.", couponCode: "" }) },
  { subject: "Cupón para tu próxima compra", ...bulletinMail({ kind: "CUPON", subject: "Cupón para tu próxima compra", body: "Úsalo al pagar. El envío es gratis desde $799 MXN.", couponCode: "BIENVENIDA" }) },
  contactCopyMail("¿La camisa slim fit tiene cambio de talla?"),
  contactStoreMail("ana.ruiz@correo.com", "¿La camisa slim fit tiene cambio de talla?", "Distinto"),
  orderCustomerMail(order),
  orderStoreMail(order, "Distinto"),
];

const show = (html: string) => {
  const names = ["mark", "wordmark", "facebook", "instagram", "whatsapp", "mail", "truck"];
  return names.reduce((out, name) => out.replaceAll(`cid:distinto-${name}`, `../email-assets/${name}.png`), html);
};

const body = pages
  .map(
    (page, index) =>
      `<section style="margin:0 0 48px;"><p style="font-family:Arial,sans-serif;font-size:13px;color:#8F8785;margin:0 0 8px;">${index + 1}. ${page.subject}</p>${show(page.html)}</section>`,
  )
  .join("");

const dir = path.join(process.cwd(), "email-preview");
mkdirSync(dir, { recursive: true });
writeFileSync(
  path.join(dir, "index.html"),
  `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Correos Distinto</title></head><body style="margin:0;background:#ddd;">${body}</body></html>`,
);
console.log(path.join(dir, "index.html"));
