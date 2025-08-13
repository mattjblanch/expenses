import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !image) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
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
              { type: "input_text", text: "Here is the receipt:" },
              { type: "input_image", image_url: `data:image/jpeg;base64,${image}` },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    const message = data.choices?.[0]?.message?.content;
    if (!message) throw new Error("No response from model");
    return NextResponse.json(JSON.parse(message));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to extract receipt" }, { status: 500 });
  }
}
