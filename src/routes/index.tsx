import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hero } from "@/components/shelter/Hero";
import { MatchForm } from "@/components/shelter/MatchForm";
import { ShelterCard } from "@/components/shelter/ShelterCard";
import { PackingDialog } from "@/components/shelter/PackingDialog";
import { Footer } from "@/components/shelter/Footer";
import { SHELTERS, type Shelter } from "@/components/shelter/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "全台流浪動物物資智能媒合平台" },
      {
        name: "description",
        content: "用科技點亮微光：全台毛孩物資 AI 智能媒合與認養平台，將善意精準送往最需要的收容所。",
      },
      { property: "og:title", content: "全台流浪動物物資智能媒合平台" },
      {
        property: "og:description",
        content: "全台毛孩物資 AI 智能媒合與認養平台，將善意精準送往最需要的收容所。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Shelter[]>([]);
  const [selected, setSelected] = useState<Shelter | null>(null);
  const [open, setOpen] = useState(false);

  const handleMatch = () => {
    setLoading(true);
    setTimeout(() => {
      const filtered = city
        ? SHELTERS.filter((s) => s.city === city)
        : [];
      setResults(filtered.length > 0 ? filtered : SHELTERS);
      setLoading(false);
      requestAnimationFrame(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      });
    }, 600);
  };

  const handlePack = (s: Shelter) => {
    setSelected(s);
    setOpen(true);
  };

  const shown = results.length > 0 ? results : SHELTERS;

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <MatchForm
        description={description}
        city={city}
        onDescriptionChange={setDescription}
        onCityChange={setCity}
        onMatch={handleMatch}
        loading={loading}
      />
      <section id="results" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
              媒合結果
            </h2>
            <p className="mt-2 text-muted-foreground">
              以下收容所目前急需您的支援。
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            共 {shown.length} 間收容所
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <ShelterCard key={s.id} shelter={s} onPack={handlePack} />
          ))}
        </div>
      </section>
      <Footer />
      <PackingDialog shelter={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
