"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SelectCurrencyForm() {
  const [currency, setCurrency] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const save = async () => {
    try {
      setLoading(true);
      setError(null);
      const code = currency.trim().toUpperCase();
      const res = await fetch("https://api.frankfurter.dev/v1/currencies");
      const data = await res.json();
      if (!data[code]) {
        throw new Error("Invalid currency code");
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch existing profile so we don't overwrite the full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, settings")
        .eq("id", user.id)
        .single();

      // Ensure we always provide a full_name to satisfy not-null constraint
      const full_name =
        profile?.full_name ||
        (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.name ||
        user.email ||
        "Anonymous User";

      const settings = {
        ...(profile?.settings || {}),
        defaultCurrency: code,
        enabledCurrencies: [code],
      };

      const { error: upErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name, settings }, { onConflict: "id" });
      if (upErr) throw upErr;

      // Replace any existing currency entries with the newly selected one
      const { error: delErr } = await supabase
        .from("user_currencies")
        .delete()
        .eq("user_id", user.id);
      if (delErr) throw delErr;

      const { error: curErr } = await supabase
        .from("user_currencies")
        .upsert(
          { user_id: user.id, currency: code },
          { onConflict: "user_id,currency" }
        );
      if (curErr) throw curErr;
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <div className="max-w-md mx-auto card space-y-3">
        <h1 className="text-2xl font-semibold mb-4">Choose your currency</h1>
        <input
          placeholder="Currency code (e.g. AUD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
        <button
          onClick={save}
          disabled={loading}
          className="bg-black text-white py-2 rounded-md"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </main>
  );
}
