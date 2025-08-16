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
      const settings = { defaultCurrency: code, enabledCurrencies: [code] };
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ settings })
        .eq("id", user.id);
      if (upErr) throw upErr;
      await supabase.from("user_currencies").insert({ user_id: user.id, currency: code });
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
