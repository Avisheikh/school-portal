import { redirect } from "next/navigation";
import { DONATE_URL } from "@/lib/donate";

export default function DonatePage() {
  redirect(DONATE_URL);
}
