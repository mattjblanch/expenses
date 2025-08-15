"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SnapExpensePage() {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const submit = () => {
    if (!receiptFile) return;
    setSaving(true);
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const fileExt = receiptFile.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile);
        if (uploadError) {
          console.error("Failed to upload receipt", uploadError);
        }
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 0,
            currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "AUD",
            date: new Date().toISOString(),
            description: "",
            vendor: "",
            category: "",
            account: "",
            receipt_url: filePath,
            pending: true,
          }),
          credentials: "include",
        });
        if (!res.ok) {
          console.error("Failed to save expense", await res.json());
        }
      } catch (e) {
        console.error("Failed to save expense", e);
      }
    })();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Snap expense</h1>
      <div className="card space-y-3">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={submit}
          disabled={!receiptFile || saving}
          className="px-3 py-2 rounded-md border disabled:opacity-50 hover:bg-neutral-100"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </main>
  );
}
