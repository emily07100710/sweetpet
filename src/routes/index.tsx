import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Hero } from "@/components/shelter/Hero";
import { MatchForm } from "@/components/shelter/MatchForm";
import { ShelterCard } from "@/components/shelter/ShelterCard";
import { PackingDialog } from "@/components/shelter/PackingDialog";
import { Footer } from "@/components/shelter/Footer";
import { type Shelter } from "@/components/shelter/data";
import { getGeminiApiKey } from "@/lib/runtime-env";
import { syncOfficialShelters } from "@/lib/shelter-sync";

type GeminiMatch = {
  shelterName: string;
  matchReason: string;
};

type GeminiMatchInput = {
  description: string;
  candidates: Shelter[];
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "全台流浪動物物資智能媒合平台" },
      {
        name: "description",
        content: "用科技點亮微光：全台毛孩物資 AI 智能媒合平台，將善意精準送往最需要的收容所。",
      },
      { property: "og:title", content: "全台流浪動物物資智能媒合平台" },
      {
        property: "og:description",
        content: "全台毛孩物資 AI 智能媒合平台，將善意精準送往最需要的收容所。",
      },
    ],
  }),
  component: Index,
});

function normalizeCity(value: string) {
  return value.replace(/台/g, "臺");
}

function getCandidateShelters(city: string, shelters: Shelter[]) {
  const normalizedCity = normalizeCity(city);
  return normalizedCity
    ? shelters.filter((s) => normalizeCity(s.city) === normalizedCity)
    : shelters;
}

function extractJsonArray(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("[");
  const end = withoutFence.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON array.");
  }

  return withoutFence.slice(start, end + 1);
}

function findShelterByGeminiName(candidates: Shelter[], shelterName: string) {
  const normalizedGeminiName = normalizeCity(shelterName);

  return candidates.find((shelter) => {
    const normalizedShelterName = normalizeCity(shelter.name);

    return (
      normalizedShelterName === normalizedGeminiName ||
      normalizedShelterName.includes(normalizedGeminiName) ||
      normalizedGeminiName.includes(normalizedShelterName)
    );
  });
}

const callGeminiMatch = createServerFn({ method: "POST" })
  .validator((data: unknown): GeminiMatchInput => {
    if (!data || typeof data !== "object") {
      throw new Error("媒合資料格式不正確，請重新送出。");
    }

    const input = data as Partial<GeminiMatchInput>;

    if (typeof input.description !== "string" || !Array.isArray(input.candidates)) {
      throw new Error("媒合資料格式不正確，請重新送出。");
    }

    return {
      description: input.description,
      candidates: input.candidates,
    };
  })
  .handler(async ({ data }) => {
    const { description, candidates } = data;
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      throw new Error(
        "尚未設定 Gemini API key。請在 Cloudflare Pages 環境變數加入 GEMINI_API_KEY，或重新部署讓既有設定生效。",
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
你是全台動物收容所物資捐贈媒合助手。請根據捐贈者提供的物資描述，分析它與各收容所目前需求的語意相似度。

請特別理解同義或近義物資，例如：
- 二手毛巾、舊浴巾、擦拭布可對應舊毛巾或清潔擦拭用品。
- 尿墊、尿布墊、看護墊可互相對應。
- 貓砂、礦砂、豆腐砂可互相對應。
- 乾糧、飼料、犬糧、貓糧需依動物類型判斷。

捐贈物資描述：
${description}

候選收容所 JSON：
${JSON.stringify(
  candidates.map((shelter) => ({
    shelterName: shelter.name,
    city: shelter.city,
    address: shelter.address,
    needs: shelter.needs,
    urgentNeeds: shelter.urgent_needs,
  })),
)}

請挑選最適合的 Top 3 收容所。你必須只回傳嚴格 JSON，不要 markdown，不要解釋，不要前後文字。
格式必須完全符合：
[
  {
    "shelterName": "收容所名字",
    "matchReason": "簡短的推薦理由，例如：因為您提供了貓砂，而該機構目前急需此物資。"
  }
]
`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const responseData = await response.json();
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      throw new Error("Gemini response did not include text content.");
    }

    const parsed = JSON.parse(extractJsonArray(text));

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini response JSON is not an array.");
    }

    return parsed
      .filter(
        (item): item is GeminiMatch =>
          typeof item?.shelterName === "string" && typeof item?.matchReason === "string",
      )
      .slice(0, 3);
  });

function Index() {
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [results, setResults] = useState<Shelter[]>([]);
  const [matchReasons, setMatchReasons] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Shelter | null>(null);
  const [open, setOpen] = useState(false);
  const [mapView, setMapView] = useState<"group" | "map">("group");

  useEffect(() => {
    let ignore = false;

    async function loadShelters() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const parsedShelters = await syncOfficialShelters();
        if (!ignore) {
          setShelters(parsedShelters);
          setResults(parsedShelters);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setErrorMessage("目前無法同步即時收容所資料，已改用本地備援資料。");
          setShelters([]);
          setResults([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadShelters();
    return () => {
      ignore = true;
    };
  }, []);

  const handleMatch = () => {
    setLoading(true);
    setErrorMessage(null);
    setMatchReasons({});

    void (async () => {
      const candidates = getCandidateShelters(city, shelters);

      try {
        if (candidates.length === 0) {
          setResults([]);
          return;
        }

        if (!description.trim()) {
          setResults(candidates.slice().sort((a, b) => a.name.localeCompare(b.name)));
          return;
        }

        const aiMatches = await callGeminiMatch({ data: { description, candidates } });
        const matchedShelters = aiMatches
          .map((match) => findShelterByGeminiName(candidates, match.shelterName))
          .filter((shelter): shelter is Shelter => Boolean(shelter));
        const reasons = aiMatches.reduce<Record<string, string>>((acc, match) => {
          const matchedShelter = findShelterByGeminiName(candidates, match.shelterName);

          if (matchedShelter) {
            acc[matchedShelter.id] = match.matchReason;
          }

          return acc;
        }, {});

        setResults(matchedShelters.length > 0 ? matchedShelters : candidates);
        setMatchReasons(reasons);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "AI 語意媒合暫時失敗，請稍後再試。",
        );
        setResults(candidates);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        });
      }
    })();
  };

  const handlePack = (s: Shelter) => {
    setSelected(s);
    setOpen(true);
  };

  const shown = results;
  const groupedShelters = shown.reduce<Record<string, Shelter[]>>((acc, shelter) => {
    const key = shelter.city || "其他";
    acc[key] = acc[key] ? [...acc[key], shelter] : [shelter];
    return acc;
  }, {});

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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
              媒合結果
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isLoading
                ? "正在同步官方收容所資料..."
                : (errorMessage ?? "以下收容所目前最適合您捐贈的物資需求。")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">共 {shown.length} 間收容所</span>
            <div className="rounded-full border border-border bg-background p-1">
              <button
                className={`rounded-full px-3 py-1.5 text-sm ${mapView === "group" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setMapView("group")}
              >
                依縣市分群
              </button>
              <button
                className={`rounded-full px-3 py-1.5 text-sm ${mapView === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setMapView("map")}
              >
                地圖檢視
              </button>
            </div>
          </div>
        </div>
        {shown.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            目前沒有可顯示的收容所資料，請稍後再試或更換關鍵字。
          </div>
        ) : mapView === "map" ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl text-foreground">收容所地圖</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  點選下方收容所卡片可直接開啟打包單。
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <iframe
                title="台灣收容所地圖"
                src="https://www.google.com/maps?q=台灣%20動物收容所&z=6&output=embed"
                className="h-[420px] w-full"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {shown.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handlePack(s)}
                  className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-accent"
                >
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.address}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedShelters).map(([city, items]) => (
              <div key={city} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-2xl text-foreground">{city}</h3>
                  <span className="text-sm text-muted-foreground">{items.length} 間</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <ShelterCard
                      key={s.id}
                      shelter={s}
                      matchReason={matchReasons[s.id]}
                      onPack={handlePack}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
      <PackingDialog shelter={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
