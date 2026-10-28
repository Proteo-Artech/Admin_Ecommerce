export function mediaUrl(value: string) {
  if (!value.startsWith("/uploads/")) return value;
  const origin = (process.env.ASSET_PUBLIC_URL || process.env.ADMIN_PUBLIC_URL || "http://localhost:3001").replace(/\/$/, "");
  return `${origin}${value}`;
}
