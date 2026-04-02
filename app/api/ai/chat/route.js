import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ========================
CLIENTS
======================== */
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ========================
RATE LIMIT (per user)
======================== */
const rateMap = new Map();
const COOLDOWN = 3000;

/* ========================
SYSTEM PROMPT
======================== */
const SYSTEM_PROMPT = `
You are an inventory assistant.

Always format responses like this:

- Use emojis for clarity
- Use line breaks
- Use sections (Product, Stock, Recommendation)

Example format:

🚨 LOW STOCK ALERT

📦 Product: {name}
📊 Stock:
- Current: X
- Minimum: Y

👉 Recommendation:
Restock at least Z units

Keep responses clean and readable.
`;
/* ========================
POST HANDLER
======================== */
export async function POST(req) {
  try {
    const { message, context, userId = "guest" } = await req.json();

    /* ========= VALIDATE ========= */
    if (!message) {
      return Response.json({
        success: false,
        reply: "Message is required",
      });
    }

    /* ========= RATE LIMIT ========= */
    const now = Date.now();
    const last = rateMap.get(userId) || 0;

    if (now - last < COOLDOWN) {
      return Response.json({
        success: false,
        reply: "Please wait a moment...",
      });
    }

    rateMap.set(userId, now);

    /* ========= BUILD MESSAGES ========= */
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];

    // ✅ FIX: chỉ thêm context nếu tồn tại
    if (context) {
      const contextString = JSON.stringify(context);

      messages.push({
        role: "system",
        content: `Inventory Data:
${contextString.slice(0, 3000)}`,
      });
    }

    messages.push({
      role: "user",
      content: message,
    });

    /* ========================
    TRY GROQ
    ======================== */
    try {
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
      });

      return Response.json({
        success: true,
        provider: "groq",
        reply: res.choices[0].message.content,
      });
    } catch (err) {
      console.log("Groq failed:", err.message);
    }

    /* ========================
    FALLBACK GEMINI
    ======================== */
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        context ? JSON.stringify(context).slice(0, 3000) : "",
        message,
      ]);

      return Response.json({
        success: true,
        provider: "gemini",
        reply: result.response.text(),
      });
    } catch (err) {
      console.error("Gemini error:", err.message);

      return Response.json({
        success: false,
        reply: "Both AI providers are busy. Try again later.",
      });
    }
  } catch (err) {
    console.error("API error:", err);

    return Response.json({
      success: false,
      reply: "Server error",
    });
  }
}
