import path from "node:path";

const gold = "#C99A6E";
const ink = "#1D1B19";
const carbon = "#2A2926";
const stone = "#8F8785";
const paper = "#FAFAF8";
const white = "#FFFFFF";

const origin = () => (process.env.STORE_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");

const cid = {
  mark: "cid:distinto-mark",
  wordmark: "cid:distinto-wordmark",
  facebook: "cid:distinto-facebook",
  instagram: "cid:distinto-instagram",
  whatsapp: "cid:distinto-whatsapp",
  mail: "cid:distinto-mail",
  truck: "cid:distinto-truck",
};

export function distintoAttachments() {
  const file = (filename: string, contentId: string) => ({
    filename,
    path: path.join(process.cwd(), "email-assets", filename),
    cid: contentId,
  });
  return [
    file("mark.png", "distinto-mark"),
    file("wordmark.png", "distinto-wordmark"),
    file("facebook.png", "distinto-facebook"),
    file("instagram.png", "distinto-instagram"),
    file("whatsapp.png", "distinto-whatsapp"),
    file("mail.png", "distinto-mail"),
    file("truck.png", "distinto-truck"),
  ];
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pesos(value: number) {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

function button(href: string, label: string, dark = false) {
  const background = dark ? ink : gold;
  return `<a href="${esc(href)}" style="display:inline-block;background:${background};color:${white};font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:8px;">${esc(label)}</a>`;
}

function layout(body: string) {
  const home = origin();
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#EFEFEF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEFEF;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${paper};">
      <tr><td align="center" style="background:${white};padding:32px 24px 20px;">
        <a href="${home}"><img src="${cid.mark}" width="64" height="64" alt="Distinto" style="display:block;border:0;"></a>
        <p style="margin:14px 0 0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.22em;color:${gold};text-transform:uppercase;">Tu estilo, tu elección</p>
        <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">
          <a href="${home}/novedades" style="color:${stone};text-decoration:none;">Novedades</a>
          &nbsp;·&nbsp;
          <a href="${home}/products?category=hombres" style="color:${stone};text-decoration:none;">Hombres</a>
          &nbsp;·&nbsp;
          <a href="${home}/products?category=mujeres" style="color:${stone};text-decoration:none;">Mujeres</a>
          &nbsp;·&nbsp;
          <a href="${home}/products?category=juniors" style="color:${stone};text-decoration:none;">Junior</a>
          &nbsp;·&nbsp;
          <a href="${home}/products?category=accesorios" style="color:${stone};text-decoration:none;">Accesorios</a>
        </p>
      </td></tr>
      <tr><td style="padding:8px 24px 28px;">${body}</td></tr>
      <tr><td align="center" style="background:${ink};padding:32px 24px;">
        <img src="${cid.wordmark}" width="220" height="70" alt="Distinto, original brands club" style="display:block;border:0;margin:0 auto 20px;">
        <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:12px;">
          <a href="${home}/contacto" style="color:#E8E4DE;text-decoration:none;">Contáctanos</a>
          &nbsp;|&nbsp;
          <a href="${home}/faq" style="color:#E8E4DE;text-decoration:none;">FAQ</a>
          &nbsp;|&nbsp;
          <a href="${home}/privacidad" style="color:#E8E4DE;text-decoration:none;">Privacidad</a>
          &nbsp;|&nbsp;
          <a href="${home}/terminos" style="color:#E8E4DE;text-decoration:none;">Términos</a>
        </p>
        <p style="margin:0 0 18px;">
          <a href="https://facebook.com" style="text-decoration:none;"><img src="${cid.facebook}" width="32" height="32" alt="Facebook" style="display:inline-block;border:0;margin:0 6px;"></a>
          <a href="https://instagram.com" style="text-decoration:none;"><img src="${cid.instagram}" width="32" height="32" alt="Instagram" style="display:inline-block;border:0;margin:0 6px;"></a>
          <a href="https://wa.me/525587654321" style="text-decoration:none;"><img src="${cid.whatsapp}" width="32" height="32" alt="WhatsApp" style="display:inline-block;border:0;margin:0 6px;vertical-align:middle;"></a>
        </p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:${stone};">
          © 2026 Distinto. Todos los derechos reservados.<br>Hecho por Proteo Artech.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function card(inner: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${white};border:1px solid #E8E4DE;border-radius:16px;"><tr><td style="padding:28px 24px;font-family:Arial,sans-serif;color:${carbon};">${inner}</td></tr></table>`;
}

function icon(src: string, width: number, height: number, alt: string) {
  return `<img src="${src}" width="${width}" height="${height}" alt="${esc(alt)}" style="display:block;margin:0 auto 16px;border:0;">`;
}

function title(text: string) {
  return `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:${carbon};">${esc(text)}</h1>`;
}

function copy(text: string) {
  return `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${stone};">${text}</p>`;
}

export function verificationMail(code: string) {
  const shown = `${code.slice(0, 3)} ${code.slice(3)}`.trim();
  const text = `Tu código es ${code}. Vence en 15 minutos y solo se usa una vez.`;
  const html = layout(
    card(`
      ${icon(cid.mark, 56, 56, "Distinto")}
      <div style="text-align:center;">
        ${title("Te damos la bienvenida")}
        ${copy("Para completar tu registro en Distinto, usa este código de verificación.")}
        <p style="margin:0 0 16px;display:inline-block;background:${paper};border:2px dashed ${gold};border-radius:12px;padding:16px 22px;font-family:Georgia,serif;font-size:32px;letter-spacing:0.18em;color:${carbon};">${esc(shown)}</p>
        <p style="margin:0 0 16px;font-size:13px;color:${gold};">Este código vence en 15 minutos.</p>
        <p style="margin:0;padding-top:16px;border-top:1px solid #E8E4DE;font-size:12px;color:${stone};">Si no solicitaste este registro, puedes ignorar este correo.</p>
      </div>
    `),
  );
  return { subject: "Código de verificación Distinto", text, html };
}

export function resetMail(link: string) {
  const text = `Usa este enlace una sola vez. Vence en 30 minutos.\n${link}`;
  const html = layout(
    card(`
      <div style="text-align:center;">
        ${icon(cid.mark, 56, 56, "Distinto")}
        ${title("Restablece tu contraseña")}
        ${copy("Recibimos una solicitud para recuperar el acceso a tu cuenta Distinto.")}
        <p style="margin:0 0 16px;">${button(link, "Restablecer contraseña")}</p>
        <p style="margin:0 0 16px;font-size:13px;color:${gold};">El enlace se usa una sola vez y vence en 30 minutos.</p>
        <p style="margin:0;padding-top:16px;border-top:1px solid #E8E4DE;font-size:12px;color:${stone};">Si no lo pediste, ignora este correo. Tu contraseña no cambia.</p>
      </div>
    `),
  );
  return { subject: "Restablece tu contraseña", text, html };
}

export function passwordChangedMail() {
  const link = `${origin()}/login`;
  const text = "La contraseña de tu cuenta Distinto se actualizó. Si no fuiste tú, escríbenos.";
  const html = layout(
    card(`
      <div style="text-align:center;">
        ${icon(cid.mark, 56, 56, "Distinto")}
        ${title("Contraseña actualizada")}
        ${copy("Tu contraseña ya quedó cambiada. Puedes entrar a la tienda con la nueva.")}
        <p style="margin:0 0 16px;">${button(link, "Iniciar sesión", true)}</p>
        <p style="margin:0;background:${paper};border-radius:12px;padding:12px;font-size:13px;color:${stone};">Si no fuiste tú, escríbenos a <a href="${origin()}/contacto" style="color:${gold};">contacto</a>.</p>
      </div>
    `),
  );
  return { subject: "Tu contraseña cambió", text, html };
}

export function newsletterWelcomeMail() {
  const text = "Te avisaremos por este correo cuando haya promociones, descuentos o cupones.";
  const html = layout(
    card(`
      <div style="text-align:center;">
        ${icon(cid.mail, 36, 36, "Correo")}
        ${title("Quedaste en el boletín")}
        ${copy("Te escribiremos cuando haya promociones, descuentos o cupones de Distinto.")}
        <p style="margin:0;">${button(`${origin()}/`, "Ver la tienda")}</p>
      </div>
    `),
  );
  return { subject: "Quedaste en el boletín de Distinto", text, html };
}

const bulletinLabel: Record<string, string> = {
  DESCUENTO: "Descuento",
  CUPON: "Cupón",
  NOVEDAD: "Novedad",
};

export function bulletinMail(input: { kind: string; subject: string; body: string; couponCode: string }) {
  const label = bulletinLabel[input.kind] ?? "Novedad";
  const coupon = input.couponCode
    ? `<p style="margin:0 0 8px;font-size:13px;color:${stone};">Usa este cupón al pagar:</p><p style="margin:0 0 20px;display:inline-block;background:${paper};border:2px dashed ${gold};border-radius:12px;padding:12px 24px;font-family:Georgia,serif;font-size:22px;letter-spacing:0.16em;color:${carbon};">${esc(input.couponCode)}</p>`
    : "";
  const text = `${input.body}${input.couponCode ? `\nCupón: ${input.couponCode}` : ""}\n\nDistinto`;
  const html = layout(
    card(`
      <div style="background:${ink};border-radius:12px;padding:28px 20px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 8px;display:inline-block;background:${gold};color:${white};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;padding:4px 10px;border-radius:99px;">${esc(label)}</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:${white};">${esc(input.subject)}</h1>
      </div>
      <div style="text-align:center;">
        ${copy(esc(input.body).replace(/\n/g, "<br>"))}
        ${coupon}
        <p style="margin:0;">${button(`${origin()}/`, "Ver la tienda")}</p>
      </div>
    `),
  );
  return { text, html };
}

const previewFiles: Record<string, string> = {
  "cid:distinto-mark": "mark.png",
  "cid:distinto-wordmark": "wordmark.png",
  "cid:distinto-facebook": "facebook.png",
  "cid:distinto-instagram": "instagram.png",
  "cid:distinto-whatsapp": "whatsapp.png",
  "cid:distinto-mail": "mail.png",
  "cid:distinto-truck": "truck.png",
};

export const emailAssetNames = new Set(Object.values(previewFiles));

export function bulletinPreviewHtml(html: string) {
  return Object.entries(previewFiles).reduce(
    (out, [token, file]) => out.replaceAll(token, `/api/admin/newsletter/assets/${file}`),
    html,
  );
}

export function contactCopyMail(message: string) {
  const text = `Hola.\n\nEsto es lo que nos escribiste:\n${message}\n\nTe responderemos a este correo.`;
  const html = layout(
    card(`
      ${icon(cid.mail, 36, 36, "Correo")}
      <div style="text-align:center;">${title("Recibimos tu mensaje")}</div>
      ${copy("Gracias por escribir a Distinto. Te respondemos a este mismo correo.")}
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${gold};">Tu mensaje</p>
      <p style="margin:0;background:${paper};border-radius:12px;padding:16px;font-size:14px;line-height:1.6;color:${carbon};">${esc(message).replace(/\n/g, "<br>")}</p>
    `),
  );
  return { subject: "Recibimos tu mensaje en Distinto", text, html };
}

export function contactStoreMail(email: string, message: string, storeName: string) {
  const text = `Tienda: ${storeName}\nCorreo: ${email}\n\n${message}`;
  const html = layout(
    card(`
      <p style="margin:0 0 12px;display:inline-block;background:${ink};color:${white};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:99px;">Mensaje de contacto</p>
      ${title("Nuevo mensaje")}
      ${copy(`Llegó desde el formulario de ${esc(storeName)}.`)}
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${stone};">Correo</p>
      <p style="margin:0 0 16px;"><a href="mailto:${esc(email)}" style="color:${gold};">${esc(email)}</a></p>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${stone};">Mensaje</p>
      <p style="margin:0 0 20px;background:${paper};border-radius:12px;padding:16px;font-size:14px;line-height:1.6;color:${carbon};">${esc(message).replace(/\n/g, "<br>")}</p>
      <p style="margin:0;">${button(`mailto:${email}`, "Responder")}</p>
    `),
  );
  return { subject: `Mensaje de ${email}`, text, html };
}

export type MailOrder = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientAddress: string | null;
  giftNote: string | null;
  items: { name: string; quantity: number; size: string; color: string; total: number }[];
};

function orderRows(order: MailOrder) {
  return order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #E8E4DE;font-size:14px;color:${carbon};">
          ${esc(item.name)}<br><span style="font-size:12px;color:${stone};">${esc(item.color)} · ${esc(item.size)} · ${item.quantity}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #E8E4DE;font-size:14px;color:${carbon};">${pesos(item.total)}</td>
      </tr>`,
    )
    .join("");
}

function orderTotals(order: MailOrder) {
  const shipping = order.shipping === 0 ? "Gratis" : pesos(order.shipping);
  const discount = order.discount > 0 ? `<tr><td style="padding:4px 0;color:${stone};">Descuento</td><td align="right" style="color:${stone};">-${pesos(order.discount)}</td></tr>` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};border-radius:12px;margin-top:8px;"><tr><td style="padding:14px;font-size:13px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;color:${stone};">Subtotal</td><td align="right" style="color:${stone};">${pesos(order.subtotal)}</td></tr>
      ${discount}
      <tr><td style="padding:4px 0;color:${stone};">Envío</td><td align="right" style="color:${stone};">${shipping}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:700;color:${carbon};">Total</td><td align="right" style="padding:8px 0 0;font-weight:700;color:${gold};">${pesos(order.total)}</td></tr>
    </table>
  </td></tr></table>`;
}

function giftBlock(order: MailOrder) {
  if (!order.isGift) return "";
  const note = order.giftNote ? `<br><span style="color:${stone};">${esc(order.giftNote)}</span>` : "";
  const place = order.giftRecipientAddress ? `<br>${esc(order.giftRecipientAddress)}` : "";
  return `<p style="margin:16px 0 0;background:${paper};border:1px solid ${gold};border-radius:12px;padding:12px;font-size:13px;color:${carbon};">Regalo para ${esc(order.giftRecipientName || "quien lo recibe")}.${place}${note}</p>`;
}

const statusSteps = [
  ["PENDING", "Pendiente"],
  ["CONFIRMED", "Pagado"],
  ["PROCESSING", "Preparación"],
  ["SHIPPED", "Enviado"],
  ["DELIVERED", "Entregado"],
] as const;

const statusTitle: Record<string, string> = {
  PENDING: "Pedido pendiente de pago",
  CONFIRMED: "Pago registrado",
  PROCESSING: "Estamos preparando tu pedido",
  SHIPPED: "Tu pedido va en camino",
  DELIVERED: "Pedido entregado",
  CANCELLED: "Pedido cancelado",
};

function statusBody(order: MailOrder, status: string, note?: string) {
  if (note) return `Hola ${order.customerName}. ${note}`;
  const hello = `Hola ${order.customerName}.`;
  if (status === "PENDING") return `${hello} Recibimos tu pedido y sigue pendiente de pago. Te avisamos cuando quede registrado.`;
  if (status === "CONFIRMED") return `${hello} Tu pago ya quedó registrado. Ahora preparamos tu pedido.`;
  if (status === "PROCESSING") return `${hello} Ya estamos preparando tu pedido. Te avisamos cuando salga.`;
  if (status === "SHIPPED") {
    const place = order.isGift && order.giftRecipientAddress ? order.giftRecipientAddress : `${order.address}, ${order.city}`;
    return `${hello} Tu pedido va en camino a ${place}.`;
  }
  if (status === "DELIVERED") return `${hello} Tu pedido ya se entregó. Gracias por comprar en Distinto.`;
  if (status === "CANCELLED") return `${hello} Cancelamos tu pedido. Si ya habías pagado, escríbenos y te ayudamos.`;
  return `${hello} Hay un cambio en tu pedido.`;
}

function statusTrack(status: string) {
  if (status === "CANCELLED") return "";
  const current = statusSteps.findIndex(([key]) => key === status);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>${statusSteps
    .map(([, label], index) => {
      const here = index === current;
      const done = index < current;
      const color = here ? gold : done ? carbon : stone;
      const dot = here ? gold : done ? ink : "#E8E4DE";
      return `<td align="center" width="20%" style="font-family:Arial,sans-serif;font-size:11px;line-height:1.3;color:${color};padding:0 2px;"><span style="display:inline-block;width:12px;height:12px;border-radius:12px;background:${dot};"></span><br>${label}</td>`;
    })
    .join("")}</tr></table>`;
}

export function orderStatusMail(order: MailOrder, status: string, note?: string) {
  const titleText = statusTitle[status] ?? "Actualización de tu pedido";
  const subject = `${titleText} ${order.orderNumber}`;
  const message = statusBody(order, status, note);
  const lines = order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ");
  const delivered = status === "DELIVERED";
  const ask = "Comparte tu experiencia para ayudar a otros usuarios a comprar. La revisamos antes de mostrarla en la página.";
  const ordersUrl = `${origin()}/profile/orders`;
  const text = delivered
    ? `${message}\n\n${ask}\n${ordersUrl}\nPedido ${order.orderNumber}.\n${lines}`
    : `${message}\nPedido ${order.orderNumber}.\n${lines}`;
  const html = layout(
    card(`
      <div style="text-align:center;">
        ${icon(cid.truck, 28, 28, "Envío")}
        ${title(titleText)}
        ${copy(esc(message))}
        <p style="margin:0 0 20px;display:inline-block;background:${paper};color:${gold};border:1px solid ${gold};border-radius:99px;padding:6px 12px;font-size:13px;">${esc(order.orderNumber)}</p>
      </div>
      ${statusTrack(status)}
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${stone};text-align:center;">${esc(lines)}</p>
      ${delivered ? copy(ask) : ""}
      <p style="margin:0;text-align:center;">${button(ordersUrl, delivered ? "Compartir mi experiencia" : "Ver mis pedidos", true)}</p>
    `),
  );
  return { subject, text, html };
}

export function orderCustomerMail(order: MailOrder) {
  const text = `Hola ${order.customerName}.\n\nRecibimos tu pago.\nPedido ${order.orderNumber}.\nTotal ${pesos(order.total)}.`;
  const html = layout(
    card(`
      <div style="text-align:center;">
        ${icon(cid.truck, 28, 28, "Envío")}
        ${title("Gracias por tu compra")}
        ${copy(`Hola ${esc(order.customerName)}. Recibimos tu pago.`)}
        <p style="margin:0 0 20px;display:inline-block;background:${paper};color:${gold};border:1px solid ${gold};border-radius:99px;padding:6px 12px;font-size:13px;">${esc(order.orderNumber)}</p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${orderRows(order)}</table>
      ${orderTotals(order)}
      ${giftBlock(order)}
    `),
  );
  return { subject: `Confirmación de compra ${order.orderNumber}`, text, html };
}

export function orderStoreMail(order: MailOrder, storeName: string) {
  const lines = order.items.map((item) => `${item.quantity} × ${item.name} · ${item.color} · ${item.size}`).join("\n");
  const gift = order.isGift ? `\nRegalo para ${order.giftRecipientName || ""}. ${order.giftNote || ""}` : "";
  const text = `Pedido ${order.orderNumber} en ${storeName}.\nTotal ${pesos(order.total)}.\n${lines}${gift}`;
  const html = layout(
    card(`
      <p style="margin:0 0 12px;display:inline-block;background:${ink};color:${white};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:99px;">Nueva compra</p>
      ${title(order.orderNumber)}
      ${copy(`Pedido en ${esc(storeName)}.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};border-radius:12px;margin-bottom:16px;"><tr><td style="padding:14px;font-size:13px;color:${carbon};">
        <strong>${esc(order.customerName)}</strong><br>
        <a href="mailto:${esc(order.customerEmail)}" style="color:${gold};">${esc(order.customerEmail)}</a><br>
        ${esc(order.phone)}<br>
        ${esc(order.address)}<br>${esc(order.city)}
      </td></tr></table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${orderRows(order)}</table>
      ${orderTotals(order)}
      ${giftBlock(order)}
    `),
  );
  return { subject: `Nueva compra ${order.orderNumber}`, text, html };
}
