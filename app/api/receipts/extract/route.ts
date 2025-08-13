import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Image is required" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  try {
    // First call: extract fields from the receipt image
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extract the amount, currency, date, vendor and description from the provided receipt image and respond in JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the receipt:" },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    const message = data.choices?.[0]?.message?.content;
    if (!message) throw new Error("No response from model");
    const extracted = JSON.parse(message);

    // Second call: verify the extracted fields against the receipt image
    const verify = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are verifying extracted receipt data. Compare the provided fields with the image and correct any mistakes. Respond in JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: JSON.stringify(extracted) },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!verify.ok) {
      const errorText = await verify.text();
      throw new Error(`OpenAI verify error: ${verify.status} ${errorText}`);
    }
    const verifyData = await verify.json();
    const verifyMsg = verifyData.choices?.[0]?.message?.content;
    if (!verifyMsg) throw new Error("No verification response from model");
    return NextResponse.json(JSON.parse(verifyMsg));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to extract receipt" }, { status: 500 });
  }
}
