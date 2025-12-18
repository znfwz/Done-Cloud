import { GoogleGenAI } from "@google/genai";
import type { LogEntry, Language } from '../types.ts';

export const generateWeeklyReport = async (entries: LogEntry[], language: Language, apiKey: string): Promise<string> => {
  // Use the mandatory initialization pattern
  const ai = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
  
  if (entries.length === 0) return language === 'zh' ? "没有找到记录。" : "No logs found.";

  const entriesText = entries.map(e => {
    const date = new Date(e.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `[${date} ${time}] ${e.content}`;
  }).join('\n');

  const langInstruction = language === 'zh' 
    ? "Please generate the report in Simplified Chinese (简体中文)." 
    : "Please generate the report in English.";

  const prompt = `
    You are a professional assistant. Below is a raw list of work logs. 
    Format them into a clean Markdown Weekly Report.
    Rules: Group by Date, Summarize achievements, use bullet points.
    Language: ${langInstruction}

    Raw Logs:
    ${entriesText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Use correct model as per guidelines
      contents: prompt,
    });
    
    // Correct .text property access (not a function)
    return response.text || (language === 'zh' ? "生成失败。" : "Failed to generate.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'zh' ? "AI 服务连接失败" : "AI Service Error";
  }
};