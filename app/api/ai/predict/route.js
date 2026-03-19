import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ========================
CACHE + RATE LIMIT
======================== */
let lastRun = 0;
let cachedResult = null;
const COOLDOWN = 60000;

/* ========================
CLIENTS
======================== */
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const now = Date.now();

    /* ========================
    CACHE CHECK
    ======================== */
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

    let text = null;

    /* ========================
    TRY GROQ FIRST
    ======================== */
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      text = completion.choices[0].message.content;
      console.log("Using Groq");
    } catch (err) {
      console.log("Groq failed:", err.message);
    }

    /* ========================
    FALLBACK GEMINI
    ======================== */
    if (!text) {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });

      const result = await model.generateContent(prompt);
      text = result.response.text();
      console.log("Using Gemini");
    }

    /* ========================
    CLEAN JSON
    ======================== */
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
