
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { ragEngine } from '../services/rag-engine.js';

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

router.post('/generate', async (req, res) => {
  try {
    const { url, description, gender } = req.body;
    let eventContext = description;

    // Simulate URL scraping if URL is provided
    if (url) {
      // In prod: await scrape(url)
      if (url.includes('wedding')) eventContext = "Formal evening wedding at a vineyard.";
      else if (url.includes('tech')) eventContext = "Casual tech conference in San Francisco.";
      else eventContext = `Event from ${url}: ${description}`;
    }

    // 1. Analyze Event Context to get Search Filters
    const prompt = `
      Context: ${eventContext}
      User Gender: ${gender}
      
      Determine the strict dress code and required item categories.
      Return JSON: { "occasion": "string", "style": "string", "category": "string" }
    `;

    // Fix: Updated to gemini-3-flash-preview for text analysis task
    const analysis = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const context = JSON.parse(analysis.text);

    // 2. Use RAG Engine to get real products
    const products = await ragEngine.generate({
      gender: gender,
      occasion: context.occasion,
      style: [context.style],
      product_type: 'Full Outfit'
    });

    res.json({ success: true, context, products: products.slice(0, 4) });

  } catch (e) {
    console.error("Event Stylist Error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
