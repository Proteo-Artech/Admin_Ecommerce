import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { currentUser, selectedStore, visibleStores } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const store = await selectedStore();
  return (
    <AdminShell user={user} stores={await visibleStores()} currentSlug={store.slug}>
      {children}
    </AdminShell>
  );
}
