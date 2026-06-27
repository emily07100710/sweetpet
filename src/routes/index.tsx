import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, Truck } from "lucide-react";
import { Hero } from "@/components/shelter/Hero";
import { MatchForm } from "@/components/shelter/MatchForm";
import { ShelterCard } from "@/components/shelter/ShelterCard";
import { PackingDialog } from "@/components/shelter/PackingDialog";
import { Footer } from "@/components/shelter/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Shelter } from "@/components/shelter/data";
import { getGeminiApiKey } from "@/lib/runtime-env";
import { syncOfficialShelters } from "@/lib/shelter-sync";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

type GeminiMatchedShelter = {
  name: string;
  reason: string;
};

type GeminiAdvisorResult = {
  safetyWarning: string | null;
  logisticsAdvice: string | null;
  matchedShelters: GeminiMatchedShelter[];
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

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseGeminiAdvisorResult(text: string): GeminiAdvisorResult {
  const parsed = JSON.parse(extractJsonObject(text)) as Partial<GeminiAdvisorResult>;
  const matchedShelters = Array.isArray(parsed.matchedShelters)
    ? parsed.matchedShelters
        .filter(
          (item): item is GeminiMatchedShelter =>
            typeof item?.name === "string" && typeof item?.reason === "string",
        )
        .slice(0, 3)
    : [];

  return {
    safetyWarning: typeof parsed.safetyWarning === "string" ? parsed.safetyWarning : null,
    logisticsAdvice: typeof parsed.logisticsAdvice === "string" ? parsed.logisticsAdvice : null,
    matchedShelters,
  };
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

function orderSheltersByAiMatches(candidates: Shelter[], matchedShelters: Shelter[]) {
  const matchedIds = new Set(matchedShelters.map((shelter) => shelter.id));
  const unmatchedShelters = candidates.filter((shelter) => !matchedIds.has(shelter.id));

  return [...matchedShelters, ...unmatchedShelters];
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const prompt = `
你是一個專業的流浪動物物資媒合 AI 顧問。請分析使用者的「捐贈物資描述」，並根據我提供的「全台收容所名單與需求」，同時扮演：
1. 收容所媒合顧問：挑出最適合的收容所。
2. 安全審查員：辨識可能對動物有毒或危險的物品。
3. 物流顧問：判斷物資體積、重量、易碎性與寄送限制。

請特別理解同義或近義物資，例如：
- 二手毛巾、舊浴巾、擦拭布可對應舊毛巾或清潔擦拭用品。
- 尿墊、尿布墊、看護墊可互相對應。
- 貓砂、礦砂、豆腐砂可互相對應。
- 乾糧、飼料、犬糧、貓糧需依動物類型判斷。

捐贈物資描述：
${description}

已依使用者選擇縣市過濾後的候選收容所 JSON：
${JSON.stringify(
  candidates.map((shelter) => ({
    name: shelter.name,
    city: shelter.city,
    address: shelter.address,
    needs: shelter.needs,
    urgentNeeds: shelter.urgent_needs,
  })),
)}

你必須只回傳嚴格 JSON，不要 markdown，不要解釋，不要前後文字。格式必須完全符合：
{
  "safetyWarning": "如果物資包含對動物有毒（如巧克力、葡萄、人類藥物）或具危險性（如有拉鍊的衣物）的物品，請在此給出繁體中文的安全警告。若無危險，回傳 null。",
  "logisticsAdvice": "根據物資描述，估算大概的體積或重量。如果超過一般超商寄件限制（約5公斤），或是有易碎品，請給出繁體中文的物流分裝或寄送建議。若無特殊狀況，回傳 null。",
  "matchedShelters": [
    {
      "name": "配對到的收容所名稱（最多選出最適合的3家）",
      "reason": "結合季節、地理位置或物資特性的推論理由。例如：厚棉被適合目前位於山區、氣溫較低的本機構，或該機構目前正急需您提供的幼貓奶粉。"
    }
  ]
}

請務必遵守：
- matchedShelters 最多 3 家。
- matchedShelters.name 必須使用候選收容所 JSON 裡既有的 name，不能自行創造新名稱。
- matchedShelters 只列出你真正推薦的高匹配收容所。若沒有明確匹配，請回傳空陣列，前端仍會顯示同縣市其他可捐贈地點。
- safetyWarning 與 logisticsAdvice 沒有內容時必須是 null，不要回傳空字串。
- 如果使用者輸入不是具體可捐贈物資，或完全無法判斷可捐贈內容，例如「我沒錢」、「不知道」、「隨便」、「今天心情不好」，請將 safetyWarning 設為「目前輸入不像具體可捐贈物資，請改填物資名稱、數量或狀態，例如貓砂 2 包、二手毛巾 10 條。」、logisticsAdvice 設為 null、matchedShelters 設為空陣列。
- 所有文字使用繁體中文。
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
          temperature: 0.1,
          responseMimeType: "application/json",
          maxOutputTokens: 768,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        typeof errorData?.error?.message === "string"
          ? errorData.error.message
          : `Gemini API request failed: ${response.status}`;

      throw new Error(message);
    }

    const responseData = await response.json();
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      throw new Error("Gemini response did not include text content.");
    }

    return parseGeminiAdvisorResult(text);
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
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [logisticsAdvice, setLogisticsAdvice] = useState<string | null>(null);
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
    setSafetyWarning(null);
    setLogisticsAdvice(null);

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

        const advisorResult = await callGeminiMatch({ data: { description, candidates } });
        const matchedShelters = advisorResult.matchedShelters
          .map((match) => findShelterByGeminiName(candidates, match.name))
          .filter((shelter): shelter is Shelter => Boolean(shelter));
        const reasons = advisorResult.matchedShelters.reduce<Record<string, string>>(
          (acc, match) => {
            const matchedShelter = findShelterByGeminiName(candidates, match.name);

            if (matchedShelter) {
              acc[matchedShelter.id] = match.reason;
            }

            return acc;
          },
          {},
        );

        setSafetyWarning(advisorResult.safetyWarning);
        setLogisticsAdvice(advisorResult.logisticsAdvice);
        setResults(orderSheltersByAiMatches(candidates, matchedShelters));
        setMatchReasons(reasons);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error && error.message.includes("尚未設定 Gemini API key")
            ? error.message
            : "AI 顧問暫時無法完成分析，已改顯示符合縣市條件的收容所清單。",
        );
        setResults(candidates);
        setMatchReasons({});
        setSafetyWarning(null);
        setLogisticsAdvice(null);
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
  const hasAdvisorAlerts = Boolean(safetyWarning || logisticsAdvice);
  const advisorAlerts = hasAdvisorAlerts ? (
    <div className="mb-6 space-y-4">
      {safetyWarning ? (
        <Alert className="border-orange-300 bg-orange-50 text-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">安全審查提醒</AlertTitle>
          <AlertDescription>{safetyWarning}</AlertDescription>
        </Alert>
      ) : null}

      {logisticsAdvice ? (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-950">
          <Truck className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900">物流寄送建議</AlertTitle>
          <AlertDescription>{logisticsAdvice}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  ) : null;

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
        {advisorAlerts}
        {shown.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            目前沒有可顯示的收容所資料，請稍後再試或更換關鍵字。
          </div>
        ) : mapView === "map" ? (
          <div>
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
