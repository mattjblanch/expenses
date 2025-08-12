"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewExpensePage() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const router = useRouter();

  const submit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount || 0),
        currency,
        date,
        description,
        vendor,
      }),
    });

    if (res.ok) router.push("/dashboard");
  };

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Add expense</h1>
      <div className="card space-y-3">
        <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input
          placeholder="Currency (e.g., AUD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input placeholder="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={submit} className="bg-black text-white py-2 rounded-md">
          Save
        </button>
      </div>
    </main>
  );
}
