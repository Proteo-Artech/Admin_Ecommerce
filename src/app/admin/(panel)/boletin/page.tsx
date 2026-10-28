import { NewsletterBoard } from "@/components/admin/newsletter-board";
import { newsletterDesk } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const { subscribers, bulletins, coupons } = await newsletterDesk();
  return (
    <>
      <h1 className="panel-title">Boletín</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Elige a quién llega el mensaje y revisa la vista previa antes de enviarlo. El cupón se toma de los que ya existen en la tienda.
      </p>
      <NewsletterBoard
        subscribers={subscribers.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
        bulletins={bulletins.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
        coupons={coupons}
      />
    </>
  );
}
