"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { parseDateInput } from "@/lib/date";

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
  const [vendors, setVendors] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [account, setAccount] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [exportId, setExportId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

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
        .select("*, account:accounts(name), category_entity:categories(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (!data) {
        router.push("/expenses");
        return;
      }
      setAmount(String(data.amount ?? ""));
      setCurrency(
        data.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD"
      );
      setDate(
        data.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
      );
      setVendor(data.vendor || "");
      setCategory(data.category_entity?.name || data.category || "");
      setAccount(data.account?.name || "");
      setDescription(data.description || "");
      setExportId(data.export_id || null);
      setReceiptUrl(data.receipt_url || null);
    };
    load();
  }, [id, router]);

  useEffect(() => {
    const loadData = async () => {
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

      const { data: accountData } = await supabase
        .from("accounts")
        .select("name")
        .order("name", { ascending: true });
      setAccounts(accountData?.map((a: { name: string }) => a.name) ?? []);
    };
    loadData();
  }, []);

  useEffect(() => {
    const createSigned = async () => {
      if (!receiptUrl) {
        setSignedUrl(null);
        return;
      }
      try {
        const res = await fetch("/api/receipts/sign-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: receiptUrl }),
        });
        if (res.ok) {
          const { url } = await res.json();
          setSignedUrl(url);
        }
      } catch (e) {
        console.error("Failed to create signed URL", e);
      }
    };
    createSigned();
  }, [receiptUrl]);

  const submit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const parsedAmount = parseFloat(amount);
    const parsedDate = parseDateInput(date) ?? new Date();
    let newReceiptUrl = receiptUrl;
    if (receiptFile) {
      const fileExt = receiptFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);
      if (uploadError) {
        console.error("Failed to upload receipt", uploadError);
      } else {
        newReceiptUrl = filePath;
      }
    }

    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        currency,
        date: isNaN(parsedDate.getTime())
          ? new Date().toISOString()
          : parsedDate.toISOString(),
        description,
        vendor,
        category,
        account,
        receipt_url: newReceiptUrl,
      }),
      credentials: "include",
    });

    if (res.ok) {
      router.push("/expenses");
      router.refresh();
    } else {
      console.error("Failed to save expense", await res.json());
    }
  };

  const remove = async () => {
    if (exportId) return;
    const confirmDelete = confirm("Delete this expense?");
    if (!confirmDelete) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (!error) {
        router.push("/dashboard");
        router.refresh();
      }
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
        {signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View current receipt
          </a>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
        />
        <div className="flex gap-2">
          <button
            onClick={remove}
            disabled={!!exportId}
            className="bg-red-600 text-white py-2 px-4 rounded-md disabled:opacity-50 w-fit"
          >
            Delete
          </button>
          <button
            onClick={submit}
            className="bg-black text-white py-2 rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </main>
  );
}

