"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { parseDateInput } from "@/lib/date";
import { useRef, useEffect } from "react";

export default function SnapExpensePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fileInputRef.current?.click();
  }, []);

  const saveExpense = async (receiptFile: File) => {
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

      // Create a placeholder expense
      let expenseId: string | null = null;
      try {
        const createRes = await fetch("/api/expenses", {
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
        if (createRes.ok) {
          const created = await createRes.json();
          expenseId = created.id;
        } else {
          console.error("Failed to save expense", await createRes.json());
        }
      } catch (e) {
        console.error("Failed to save expense", e);
      }

      // Extract data with OpenAI and update the expense
      if (expenseId) {
        try {
          const formData = new FormData();
          formData.append("image", receiptFile);
          const extractRes = await fetch("/api/receipts/extract", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (extractRes.ok) {
            const data = await extractRes.json();
            const parsedDate = data.date
              ? parseDateInput(data.date)
              : null;
            // Update fields but keep expense pending until user confirmation
            await fetch(`/api/expenses/${expenseId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: data.amount ?? 0,
                currency:
                  (data.currency ||
                    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ||
                    "AUD").toUpperCase(),
                date: (parsedDate ?? new Date()).toISOString(),
                description: data.description || "",
                vendor: data.vendor || "",
                category: data.category || "",
                account: "",
                receipt_url: filePath,
              }),
              credentials: "include",
            });
          } else {
            console.error(
              "Failed to extract receipt",
              await extractRes.json()
            );
          }
        } catch (e) {
          console.error("Failed to process receipt", e);
        }
      }
    } catch (e) {
      console.error("Failed to save expense", e);
    } finally {
      router.refresh();
    }
  };

  const submit = (receiptFile: File) => {
    router.push("/dashboard");
    router.refresh();
    void saveExpense(receiptFile);
  };

  return (
    <main className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Snap expense</h1>
      <div className="card space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) submit(file);
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-md border block text-center bg-green-600 text-white hover:bg-green-700"
        >
          Snap expense
        </button>
      </div>
    </main>
  );
}
