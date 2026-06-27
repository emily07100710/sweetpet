import {
  buildOfficialShelters,
  OFFICIAL_SHELTER_DATA,
} from "@/components/shelter/officialShelters";
import type { Shelter } from "@/components/shelter/data";

const LIST_URL =
  "https://animal.moa.gov.tw/Frontend/PublicShelter?searchLon=121.21653528800341&searchLat=25.008008979119904";

function normalizeTaiwanText(value: string) {
  return value.replace(/台/g, "臺");
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDetailValue(html: string, regex: RegExp) {
  const match = html.match(regex);
  return match ? stripHtml(match[1]) : "";
}

function toProxyUrl(url: string) {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

async function fetchText(url: string) {
  const response = await fetch(toProxyUrl(url), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.text();
}

export async function syncOfficialShelters(): Promise<Shelter[]> {
  try {
    const listHtml = await fetchText(LIST_URL);
    const detailUrls = Array.from(
      new Set(
        Array.from(listHtml.matchAll(/href="(\/Frontend\/PublicShelter\/Detail\/[^"#]+)"/g)).map(
          (match) => match[1],
        ),
      ),
    );

    const shelters: Shelter[] = [];
    const tagPool = [
      "貓飼料",
      "幼犬乾糧",
      "寵物尿布墊",
      "舊毛巾",
      "漂白水",
      "營業用洗潔精",
      "特大垃圾袋",
      "看護墊",
      "貓砂",
    ];

    for (const detailPath of detailUrls) {
      const detailUrl = `https://animal.moa.gov.tw${detailPath}`;
      const detailHtml = await fetchText(detailUrl);
      const name =
        extractDetailValue(detailHtml, /<p class="bold h1">([^<]+)<\/p>/i) ||
        detailHtml.match(/<title>([^<]+)<\/title>/i)?.[1] ||
        "";
      const address =
        extractDetailValue(detailHtml, /地址：\s*([^<\n]+)/i) ||
        extractDetailValue(detailHtml, /<p[^>]*>地址[^<]*<[^>]+>([^<]+)<\/[^>]+>/i) ||
        extractDetailValue(detailHtml, /地址[^>]*>([^<]+)<\/[^>]+>/i);
      const phone =
        extractDetailValue(detailHtml, /電話：\s*([^<\n]+)/i) ||
        extractDetailValue(detailHtml, /電話[^>]*>([^<]+)<\/[^>]+>/i);

      if (!name || !address) {
        continue;
      }

      const shuffled = [...tagPool].sort(() => Math.random() - 0.5);
      const urgentNeeds = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));
      const normalizedAddress = normalizeTaiwanText(address);
      const city =
        normalizedAddress.match(
          /(臺北市|新北市|桃園市|臺中市|臺南市|高雄市|基隆市|新竹市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義市|嘉義縣|屏東縣|宜蘭縣|花蓮縣|臺東縣|澎湖縣|金門縣|連江縣)/,
        )?.[1] ?? "台灣";

      shelters.push({
        id: detailPath,
        name,
        address,
        phone: phone || "未提供電話",
        city,
        needs: urgentNeeds,
        urgent_needs: urgentNeeds,
      });
    }

    if (shelters.length > 0) {
      return shelters;
    }
  } catch (error) {
    console.error("Failed to sync official shelters", error);
  }

  return OFFICIAL_SHELTER_DATA.length > 0 ? buildOfficialShelters() : [];
}
