const fs = require("node:fs");
const path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");

const home = "C:/Users/ProteoArtech/Workspace/ecommerce/Distinto/public/home";
const out = path.join(__dirname, "..", "email-assets");
fs.mkdirSync(out, { recursive: true });

function inner(svg) {
  return svg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
}

function render(name, svg, width) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  fs.writeFileSync(path.join(out, name), png);
}

function onCircle(file, iconW, iconH) {
  const size = 64;
  const scale = 26 / Math.max(iconW, iconH);
  const x = (size - iconW * scale) / 2;
  const y = (size - iconH * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="32" cy="32" r="32" fill="#B8845A"/>
    <g transform="translate(${x} ${y}) scale(${scale})">${inner(fs.readFileSync(path.join(home, file), "utf8"))}</g>
  </svg>`;
}

const wordmark = fs.readFileSync(path.join(home, "m-footer-logo.svg"), "utf8");
render(
  "wordmark.png",
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="153" viewBox="0 0 240 76.5474"><rect width="240" height="76.5474" fill="#1D1B19"/>${inner(wordmark)}</svg>`,
  480,
);
render("mark.png", fs.readFileSync(path.join(home, "m-logo.svg"), "utf8"), 128);
render("whatsapp.png", fs.readFileSync(path.join(home, "m-envelope.svg"), "utf8"), 64);
render("mail.png", fs.readFileSync(path.join(home, "m-envelope-2.svg"), "utf8"), 64);
render("truck.png", fs.readFileSync("C:/Users/ProteoArtech/Workspace/ecommerce/Distinto/public/product/truck.svg", "utf8"), 56);
render("facebook.png", onCircle("m-fb.svg", 9, 16), 64);
render("instagram.png", onCircle("m-ig.svg", 16, 16), 64);
console.log("ok", fs.readdirSync(out).join(", "));
