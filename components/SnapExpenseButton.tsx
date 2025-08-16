"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { parseDateInput } from "@/lib/date";
import { useRef } from "react";

export default function SnapExpenseButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const saveExpense = async (receiptFile: File) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", user.id)
        .single();
      const defaultCurrency =
        profile?.settings?.defaultCurrency ||
        process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ||
        "AUD";
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
            currency: defaultCurrency,
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
            const parsedDate = data.date ? parseDateInput(data.date) : null;
            // Update fields but keep expense pending until user confirmation
            await fetch(`/api/expenses/${expenseId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: data.amount ?? 0,
                currency: (data.currency || defaultCurrency).toUpperCase(),
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
    void saveExpense(receiptFile);
  };

  return (
    <>
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
        className={className}
      >
        Snap expense
      </button>
    </>
  );
}

