import { requireAuth } from "@/lib/auth";
import { callScreenData } from "@/lib/leads";
import { CallScreen } from "./CallScreen";

export const dynamic = "force-dynamic";

export default async function CallPage() {
  await requireAuth();
  const data = callScreenData();
  return <CallScreen initial={data} />;
}
