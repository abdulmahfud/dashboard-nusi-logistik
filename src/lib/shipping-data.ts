export interface Tag {
  label: string;
  type: "warning" | "info" | "default";
}

export interface ShippingOption {
  id: string;
  name: string;
  logo: string;
  price: string;
  originalPrice?: string;
  duration: string;
  recommended?: boolean;
  available: boolean;
  tags?: Tag[];
  /** Field Addpostingdoc dari response cek ongkir Pos (format serviceCode + fee camelCase) */
  posIndonesiaPosting?: {
    serviceCode: number;
    fee: number;
    feeTax: number;
    insurance: number;
    insuranceTax: number;
    totalFee: number;
  };
}

export const shippingOptions: ShippingOption[] = [
  {
    id: "jnt-cargo",
    name: "J&T Cargo Reguler",
    logo: "/imagess/jnt.png",
    price: "Rp194.040",
    originalPrice: "Rp198.000",
    duration: "14-16 Hari",
    recommended: true,
    available: true,
    tags: [
      { label: "COD tidak tersedia", type: "warning" },
      { label: "Asuransi tidak tersedia", type: "warning" }
    ]
  },
  {
    id: "lion-regpack",
    name: "Lion Regpack",
    logo: "/images/lion.png",
    price: "Rp78.500",
    originalPrice: "Rp83.500",
    duration: "7-9 Hari",
    available: true,
  },
  {
    id: "sap-satria",
    name: "SAP Satria Reg",
    logo: "/images/sap-new.png",
    price: "Rp81.000",
    originalPrice: "Rp86.000",
    duration: "2-5 Hari",
    available: true,
    tags: [
      { label: "Potensi retur Tinggi", type: "warning" }
    ]
  },
  {
    id: "ninja-standard",
    name: "Ninja Standard",
    logo: "/images/ninja.png",
    price: "Rp87.400",
    originalPrice: "Rp92.400",
    duration: "3-6 Hari",
    available: true,
  },
  {
    id: "sicepat-berani",
    name: "Sicepat BERANI BAYAR MURAH",
    logo: "/images/sicepat.png",
    price: "Rp91.500",
    duration: "7-10 Hari",
    available: true,
  },
  {
    id: "ncs-regular",
    name: "NCS Regular Service",
    logo: "/images/ncs.png",
    price: "Rp94.050",
    originalPrice: "Rp99.000",
    duration: "4-5 Hari",
    available: true,
    tags: [
      { label: "COD tidak tersedia", type: "warning" }
    ]
  },
  {
    id: "jnt-ez",
    name: "J&T EZ",
    logo: "/images/jnt.png",
    price: "Rp103.000",
    duration: "3-6 Hari",
    available: true,
    tags: [
      { label: "Potensi retur Sedang", type: "info" }
    ]
  },
  {
    id: "sicepat-reguler",
    name: "Sicepat REGULER",
    logo: "/images/sicepat.png",
    price: "Rp103.000",
    originalPrice: "Rp108.000",
    duration: "7-9 Hari",
    available: true,
  },
  {
    id: "pos-reguler",
    name: "Pos Indonesia POS REGULER",
    logo: "/images/pos.png",
    price: "Rp106.000",
    duration: "7 Hari",
    available: true,
  },
  {
    id: "tiki-reguler",
    name: "Tiki Reguler",
    logo: "/images/tiki.png",
    price: "Rp130.000",
    originalPrice: "Rp135.000",
    duration: "1-13 Hari",
    available: true,
  },
  {
    id: "id-express",
    name: "ID Express Standard",
    logo: "/images/id-express.png",
    price: "Rp140.700",
    originalPrice: "Rp145.700",
    duration: "5-7 Hari",
    available: true,
  }
];

export const serviceTypes = [
  { id: "economy", name: "Economy" },
  { id: "regular", name: "Regular" },
  { id: "cargo", name: "Cargo" },
];

export const sortOptions = [
  { value: "cheapest", label: "Harga Termurah" },
  { value: "fastest", label: "Waktu Tersingkat" },
  { value: "recommended", label: "Rekomendasi" },
];