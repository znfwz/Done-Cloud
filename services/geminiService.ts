import { GoogleGenAI } from "@google/genai";
import { LogEntry, Language } from '../types';

export const generateAIReport = async (
  entries: LogEntry[], 
  type: 'week' | 'month' | 'year',
  language: Language, 
  apiKey: string
): Promise<string> => {
  if (!apiKey) return language === 'zh' ? "未设置 API Key" : "API Key missing";
  if (entries.length === 0) return language === 'zh' ? "没有找到记录。" : "No logs found to generate a report.";

  const ai = new GoogleGenAI({ apiKey });
  
  // Format entries for the prompt
  const entriesText = entries.map(e => {
    const date = new Date(e.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `[${date} ${time}] ${e.content}`;
  }).join('\n');

  const langInstruction = language === 'zh' 
    ? "Please generate the report in Simplified Chinese (简体中文)." 
    : "Please generate the report in English.";

  const typeLabels = {
    week: { en: 'Weekly', zh: '周' },
    month: { en: 'Monthly', zh: '月度' },
    year: { en: 'Annual', zh: '年度' }
  };
  
  const currentTypeLabel = language === 'zh' ? typeLabels[type].zh : typeLabels[type].en;

  const prompt = `
    You are a helpful assistant for a busy professional. 
    Below is a raw list of work logs. 
    Please format them into a professional ${currentTypeLabel} Report.
    
    Rules:
    1. Group by Date (or by Month if this is an Annual Report and the list is very long).
    2. Summarize key achievements.
    3. Use a clean Markdown format with bullet points.
    4. Tone: Professional, concise, objective.
    5. Language: ${langInstruction}

    Raw Logs:
    ${entriesText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (language === 'zh' ? "生成失败。" : "Failed to generate report.");
  } catch (error) {
    console.error("Gemini generation error:", error);
    return language === 'zh' 
      ? "连接 AI 服务出错，请检查网络或 API Key。" 
      : "Error connecting to AI service. Please check your network or API Key.";
  }
};