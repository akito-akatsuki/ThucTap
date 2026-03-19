import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ========================
RATE LIMIT
======================== */
let lastChat = 0;
const CHAT_COOLDOWN = 3000;

/* ========================
CLIENTS
======================== */
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { message } = await req.json();

  const now = Date.now();

  if (now - lastChat < CHAT_COOLDOWN) {
    return Response.json({
      reply: "Please wait a moment before sending another message.",
    });
  }

  lastChat = now;

  /* ========================
  TRY GROQ FIRST
  ======================== */
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an inventory assistant AI.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return Response.json({
      reply: completion.choices[0].message.content,
      provider: "groq",
    });
  } catch (err) {
    console.log("Groq error:", err.message);
  }

  /* ========================
  FALLBACK GEMINI
  ======================== */
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent([
      "You are an inventory assistant AI.",
      message,
    ]);

    return Response.json({
      reply: result.response.text(),
      provider: "gemini",
    });
  } catch (err) {
    console.error("Gemini error:", err.message);

    return Response.json({
      reply: "Both AI providers are busy. Try again later.",
      error: err.message,
    });
  }
}
