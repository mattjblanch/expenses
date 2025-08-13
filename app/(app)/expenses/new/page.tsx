"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewExpensePage() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [account, setAccount] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendorData } = await supabase
        .from("vendors")
        .select("name")
        .order("name", { ascending: true });
      setVendors(vendorData?.map((v: { name: string }) => v.name) ?? []);

      const { data: categoryData } = await supabase
        .from("categories")
        .select("name")
        .order("name", { ascending: true });
      setCategories(categoryData?.map((c: { name: string }) => c.name) ?? []);

      const { data: lastCategory } = await supabase
        .from("expenses")
        .select("category")
        .eq("user_id", user.id)
        .not("category", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastCategory?.category) setCategory(lastCategory.category);

      const { data: accountData } = await supabase
        .from("accounts")
        .select("name")
        .order("name", { ascending: true });
      setAccounts(accountData?.map((a: { name: string }) => a.name) ?? []);
    };
    loadData();
  }, []);

  const submit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const parsedAmount = parseFloat(amount);
    const parsedDate = new Date(date);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        currency,
        // ensure the date is in ISO format to satisfy the API/DB
        date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
        description,
        vendor,
        category,
        account,
      }),
      // send authentication cookies with the request
      credentials: "include",
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      // surface error for easier debugging
      console.error("Failed to save expense", await res.json());
    }
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
        <input
          list="vendors"
          placeholder="Vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
        <datalist id="vendors">
          {vendors.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
        <input
          list="categories"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          list="accounts"
          placeholder="Account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <datalist id="accounts">
          {accounts.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
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
