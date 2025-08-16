import { redirect } from "next/navigation";
import SelectCurrencyForm from "./SelectCurrencyForm";
import { serverClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = serverClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?redirect=/select-currency");
  }
  return <SelectCurrencyForm />;
}
