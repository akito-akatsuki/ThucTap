import OpenAI from "openai";

/* ========================
AI RATE LIMIT + CACHE
======================== */

let lastRun = 0;
let cachedResult = null;
const COOLDOWN = 60000; // 60 seconds

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET() {
  return Response.json({
    message: "AI predict API working",
  });
}

export async function POST(req) {
  try {
    let body = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const products = body.products || [];

    /* ========================
    RATE LIMIT CHECK
    ======================== */

    const now = Date.now();

    if (now - lastRun < COOLDOWN && cachedResult) {
      return Response.json({
        data: cachedResult,
        cached: true,
      });
    }

    if (!products.length) {
      return Response.json({ data: [] });
    }

    const prompt = `
You are an inventory AI.

Predict sales for the next 7 days.

Return ONLY valid JSON.

Format:
[
 {
  "name":"product",
  "prediction":[7 numbers],
  "predictedSales":number,
  "daysLeft":number
 }
]

Products:
${JSON.stringify(products)}
`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    let text = completion.choices[0].message.content;

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(text);

    /* ========================
    SAVE CACHE
    ======================== */

    lastRun = Date.now();
    cachedResult = data;

    return Response.json({ data });
  } catch (err) {
    console.error("AI error:", err);

    return Response.json({
      data: [],
      error: err.message,
    });
  }
}
