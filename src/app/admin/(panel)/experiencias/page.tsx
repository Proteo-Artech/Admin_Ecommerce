import { ExperiencesBoard } from "@/components/admin/experiences-board";
import { panelExperiences } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const experiences = await panelExperiences();
  return (
    <>
      <h1 className="panel-title">Experiencias</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Revisa cada experiencia antes de que aparezca en la tienda. Si trae fotos, elige cuáles se muestran.
      </p>
      <ExperiencesBoard experiences={experiences} />
    </>
  );
}
