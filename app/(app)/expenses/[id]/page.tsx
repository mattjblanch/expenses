"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD"
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (!data) {
        router.push("/expenses");
        return;
      }
      setAmount(String(data.amount ?? ""));
      setCurrency(data.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD");
      setDate(data.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
      setVendor(data.vendor || "");
      setDescription(data.description || "");
    };
    load();
  }, [id, router]);

  const submit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("expenses")
      .update({
        amount: Number(amount || 0),
        currency,
        date,
        description,
        vendor,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (!error) router.push("/expenses");
  };

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Edit expense</h1>
      <div className="card space-y-3">
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          placeholder="Currency (e.g., AUD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          placeholder="Vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={submit}
          className="bg-black text-white py-2 rounded-md"
        >
          Save
        </button>
      </div>
    </main>
  );
}

