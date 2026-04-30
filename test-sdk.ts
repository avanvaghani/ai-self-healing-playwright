import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Client created successfully");
} catch (e) {
    console.log("Error:", e.message);
}
