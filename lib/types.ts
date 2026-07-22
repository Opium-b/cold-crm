export type Group = "A" | "B" | "C" | "D";

export type LeadStatus =
  | "YANGI"
  | "KOTARMADI"
  | "KEYINROQ"
  | "QIZIQDI"
  | "UCHRASHUV"
  | "RAD"
  | "SOTILDI"
  | "NOTOGRI_RAQAM";

export type Outcome =
  | "KOTARMADI"
  | "KEYINROQ"
  | "QIZIQDI"
  | "UCHRASHUV"
  | "RAD"
  | "SOTILDI"
  | "NOTOGRI_RAQAM";

export type RejectReason =
  | "QIMMAT"
  | "INSTAGRAM_YETARLI"
  | "ISHONMADI"
  | "KERAK_EMAS"
  | "BOSHQA";

export interface Lead {
  id: number;
  name: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  group: Group;
  rating: number | null;
  reviews_count: number | null;
  work_hours: string | null;
  info: string | null;
  instagram: string | null;
  status: LeadStatus;
  reject_reason: RejectReason | null;
  no_answer_streak: number;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: number;
  lead_id: number;
  called_at: string;
  outcome: Outcome;
  note: string | null;
  duration_hint: "QISQA" | "ORTACHA" | "UZOQ" | null;
}

export interface Meeting {
  id: number;
  lead_id: number;
  meet_at: string;
  location: string | null;
  status: "REJALANGAN" | "OTKAZILDI" | "BEKOR";
  note: string | null;
}

// Ko'rsatish uchun status yorliqlari va ranglari (Tailwind sinflari)
export const STATUS_LABEL: Record<LeadStatus, string> = {
  YANGI: "Yangi",
  KOTARMADI: "Ko'tarmadi",
  KEYINROQ: "Keyinroq",
  QIZIQDI: "Qiziqdi",
  UCHRASHUV: "Uchrashuv",
  RAD: "Rad etdi",
  SOTILDI: "Sotildi",
  NOTOGRI_RAQAM: "Noto'g'ri raqam",
};

export const STATUS_BADGE: Record<LeadStatus, string> = {
  YANGI: "bg-slate-100 text-slate-700",
  KOTARMADI: "bg-gray-200 text-gray-700",
  KEYINROQ: "bg-amber-100 text-amber-800",
  QIZIQDI: "bg-green-100 text-green-800",
  UCHRASHUV: "bg-blue-100 text-blue-800",
  RAD: "bg-red-100 text-red-800",
  SOTILDI: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400",
  NOTOGRI_RAQAM: "bg-neutral-800 text-white",
};

export const GROUP_BADGE: Record<Group, string> = {
  A: "bg-red-500 text-white",
  B: "bg-orange-500 text-white",
  C: "bg-sky-500 text-white",
  D: "bg-slate-400 text-white",
};

export const REJECT_LABEL: Record<RejectReason, string> = {
  QIMMAT: "Qimmat",
  INSTAGRAM_YETARLI: "Instagram yetarli",
  ISHONMADI: "Ishonmadi",
  KERAK_EMAS: "Kerak emas",
  BOSHQA: "Boshqa",
};
