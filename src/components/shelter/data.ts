export const TAIWAN_CITIES = [
  "台北市",
  "新北市",
  "桃園市",
  "台中市",
  "台南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

export type Shelter = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  needs: string[];
  urgent_needs: string[];
};

export type ShelterApiRecord = Record<string, unknown>;

export const SHELTERS: Shelter[] = [
  {
    id: "tao-yuan",
    name: "桃園市動物保護教育園區",
    city: "桃園市",
    address: "桃園市新屋區新屋區1鄰35號",
    phone: "03-4861760",
    needs: ["成犬乾飼料", "幼犬奶粉", "舊毛巾", "消毒水"],
    urgent_needs: ["成犬乾飼料", "幼犬奶粉", "舊毛巾"],
  },
  {
    id: "taipei",
    name: "台北市動物之家",
    city: "台北市",
    address: "台北市內湖區潭美街690號",
    phone: "02-87913254",
    needs: ["無穀貓飼料", "貓砂", "寵物尿布墊", "舊報紙"],
    urgent_needs: ["無穀貓飼料", "貓砂", "寵物尿布墊"],
  },
  {
    id: "taichung",
    name: "台中市動物之家南屯園區",
    city: "台中市",
    address: "台中市南屯區萬和路二段350號",
    phone: "04-23862103",
    needs: ["大型犬飼料", "牽繩", "外出籠", "舊毛毯"],
    urgent_needs: ["大型犬飼料", "牽繩", "外出籠"],
  },
];
