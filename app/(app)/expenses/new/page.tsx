"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { parseDateInput } from "@/lib/date";

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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleAccountChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value !== "__add_new_account__") {
      setAccount(value);
      return;
    }
    const name = prompt("New account name");
    if (!name) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("accounts")
      .insert({ name, user_id: user.id })
      .select("name")
      .single();
    if (error || !data) {
      console.error("Failed to add account", error);
      return;
    }
    setAccounts((prev) => [...prev, data.name].sort());
    setAccount(data.name);
  };

  const extract = async (file: File) => {
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/receipts/extract", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.amount) setAmount(data.amount.toString());
      if (data.currency) setCurrency(data.currency.toUpperCase());
      if (data.date) {
        const parsed = parseDateInput(data.date);
        setDate(
          parsed ? parsed.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        );
      } else {
        // reset to today's date if none found on the receipt
        setDate(new Date().toISOString().slice(0, 10));
      }
      if (data.description) setDescription(data.description);
      if (data.vendor) {
        const match = vendors.find(
          (v) => v.toLowerCase() === data.vendor.toLowerCase()
        );
        setVendor(match || data.vendor);
      }
      if (data.category) {
        const match = categories.find(
          (c) => c.toLowerCase() === data.category.toLowerCase()
        );
        setCategory(match || data.category);
      }
    } catch (err) {
      console.error("Failed to extract receipt", err);
    } finally {
      setExtracting(false);
    }
  };

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
      const categoryList =
        categoryData?.map((c: { name: string }) => c.name) ?? [];
      setCategories(categoryList);

      const { data: accountData } = await supabase
        .from("accounts")
        .select("name")
        .order("name", { ascending: true });
      let accountList = accountData?.map((a: { name: string }) => a.name) ?? [];
      if (accountList.length === 0) {
        const { data: defaultAccount } = await supabase
          .from("accounts")
          .insert({ name: "Default account", user_id: user.id })
          .select("name")
          .single();
        if (defaultAccount?.name) accountList = [defaultAccount.name];
      }
      setAccounts(accountList);

      const { data: lastAccountExpense } = await supabase
        .from("expenses")
        .select("account_id")
        .eq("user_id", user.id)
        .not("account_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastAccountExpense?.account_id) {
        const { data: lastAccountName } = await supabase
          .from("accounts")
          .select("name")
          .eq("id", lastAccountExpense.account_id)
          .maybeSingle();
        if (lastAccountName?.name) setAccount(lastAccountName.name);
        else if (accountList.length > 0) setAccount(accountList[0]);
      } else if (accountList.length > 0) {
        setAccount(accountList[0]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (vendor) {
      const match = vendors.find(
        (v) => v.toLowerCase() === vendor.toLowerCase()
      );
      if (match) setVendor(match);
    }
  }, [vendors, vendor]);

  useEffect(() => {
    if (category) {
      const match = categories.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      );
      if (match) setCategory(match);
    }
  }, [categories, category]);

  const submit = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const parsedAmount = parseFloat(amount);
      const parsedDate = parseDateInput(date) ?? new Date();
      let receipt_url: string | null = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile);
        if (uploadError) {
          console.error("Failed to upload receipt", uploadError);
        } else {
          receipt_url = filePath;
        }
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: isNaN(parsedAmount) ? 0 : parsedAmount,
          currency,
          // ensure the date is in ISO format to satisfy the API/DB
          date: isNaN(parsedDate.getTime())
            ? new Date().toISOString()
            : parsedDate.toISOString(),
          description,
          vendor,
          category,
          account,
          receipt_url,
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
    } catch (e) {
      console.error("Failed to save expense", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Add manual expense</h1>
      <div className="card space-y-3">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setReceiptFile(file);
              if (file) extract(file);
            }}
          />
          {receiptFile && (
            <div className="flex items-center space-x-2 mt-2">
              <img
                src={URL.createObjectURL(receiptFile)}
                alt="Receipt preview"
                className="h-16 w-16 object-cover rounded"
              />
              {extracting && (
                <span className="text-sm text-gray-500">OpenAI is loading...</span>
              )}
            </div>
          )}
        </div>
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
        <select value={account} onChange={handleAccountChange}>
          {accounts.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value="__add_new_account__">Add new account</option>
        </select>
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={saving}
          className="px-3 py-2 rounded-md border disabled:opacity-50 hover:bg-neutral-100"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </main>
  );
}
