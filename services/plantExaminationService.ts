import { GoogleGenAI } from "@google/genai";
import { TEXT_MODEL } from "../config/geminiModels";
import { Garden, Plant, Activity, AIExaminationResult, calculateAgeInDays } from "./myGardensStorage";

const getApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  try {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    return key;
  } catch (e) {
    return "";
  }
};

function getPlantExaminationSystemPrompt(): string {
  return `
You are a knowledgeable, beginner-friendly plant care assistant. Your role is to examine a plant based on its saved data, recent activity logs, and any user-provided concern.

Guidelines:
- Use the plant's saved data before giving advice.
- If information is missing, mention that it's missing rather than inventing it.
- Give practical, actionable next steps.
- If more details would help, ask for them.
- Avoid making medical, legal, or unsafe claims.
- Avoid extreme certainty. Use language like "possible," "may be," and "based on your logs."
- Recommend monitoring and taking updated photos.
- Keep feedback clear, practical, and beginner-friendly.

You must respond with valid JSON only. Do not include markdown code blocks or any text outside the JSON object.

The JSON must have exactly this structure:
{
  "overallStatus": "A short overall status (e.g., 'Doing Well', 'Needs Attention', 'At Risk')",
  "plantSummary": "A 2-3 sentence summary of the plant's current state based on the data provided.",
  "whatLooksGood": ["List of positive observations"],
  "possibleIssues": ["List of possible issues"],
  "likelyCauses": ["List of likely causes for the issues"],
  "recommendedNextSteps": ["List of actionable next steps"],
  "whatToMonitor": ["List of things to keep an eye on"],
  "suggestedReminder": "A short reminder suggestion like 'Check soil moisture in 2 days'",
  "confidenceLevel": "Low | Medium | High"
}
`;
}

export async function examinePlantWithAI(
  plant: Plant,
  garden: Garden | null,
  recentActivities: Activity[],
  userConcern: string,
  imageBase64?: string | null
): Promise<AIExaminationResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getFallbackResult("API key not configured. Please set VITE_GEMINI_API_KEY in your environment.");
  }

  const ageInDays = calculateAgeInDays(plant.startDate);

  // Build the plant data context
  const plantContext = `
Plant Information:
- Name: ${plant.name}
- Garden: ${garden ? garden.name : 'Unknown'}
- Strain/Type: ${plant.strainOrType || 'Not specified'}
- Source: ${plant.source || 'Unknown'}
- Age: ${ageInDays} days (started: ${plant.startDate})
- Stage: ${plant.stage || 'Not specified'}
- Medium: ${plant.medium || 'Not specified'}
- Pot Size: ${plant.potSize || 'Not specified'}
- Light Schedule: ${plant.lightSchedule || 'Not specified'}
- Current pH: ${plant.currentPH || 'Not recorded'}
- Current PPM: ${plant.currentPPM || 'Not recorded'}
- Height: ${plant.height || 'Not recorded'}
- Health Status: ${plant.healthStatus || 'Not specified'}
- Notes: ${plant.notes || 'None'}

Recent Activity Log (last ${recentActivities.length} records):
${recentActivities.map((a, i) => `
${i + 1}. ${a.type} - ${a.date}
   Notes: ${a.notes || 'None'}
   pH: ${a.ph || 'N/A'} | PPM: ${a.ppm || 'N/A'} | Amount: ${a.amount || 'N/A'}
`).join('\n')}

User's Concern: ${userConcern || 'No specific concern provided. Give a general health assessment.'}
`;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [
      { text: plantContext }
    ];

    // Add image if provided
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      config: {
        systemInstruction: getPlantExaminationSystemPrompt(),
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    const text = response.text || "";
    
    // Try to parse JSON from the response
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/```(json)?/g, "").trim();
      }
      const result = JSON.parse(cleanText);
      
      // Validate required fields
      const requiredFields = [
        "overallStatus", "plantSummary", "whatLooksGood", "possibleIssues",
        "likelyCauses", "recommendedNextSteps", "whatToMonitor",
        "suggestedReminder", "confidenceLevel"
      ];
      
      for (const field of requiredFields) {
        if (!(field in result)) {
          throw new Error(`Missing field: ${field}`);
        }
      }

      // Ensure confidence level is valid
      if (!["Low", "Medium", "High"].includes(result.confidenceLevel)) {
        result.confidenceLevel = "Medium";
      }

      return result as AIExaminationResult;
    } catch (parseError) {
      console.error("[PlantExamination] Failed to parse AI response:", parseError);
      return getFallbackResult("The AI returned an unparseable response. Please try again.");
    }
  } catch (error: any) {
    console.error("[PlantExamination] AI request failed:", error);
    
    const isQuotaError = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    if (isQuotaError) {
      return getFallbackResult("Plant examination could not be completed right now. Please try again.");
    }

    if (error?.message?.includes("API_KEY") || error?.message?.includes("auth")) {
      return getFallbackResult("Authentication issue. Image analysis is not connected yet. This examination is based on your plant data and notes.");
    }

    return getFallbackResult("Plant examination could not be completed right now. Please try again.");
  }
}

function getFallbackResult(message: string): AIExaminationResult {
  return {
    overallStatus: "Unable to examine",
    plantSummary: message,
    whatLooksGood: [],
    possibleIssues: [],
    likelyCauses: [],
    recommendedNextSteps: ["Add more plant details, notes, or a photo for a better examination.", "Try running the examination again."],
    whatToMonitor: [],
    suggestedReminder: "Check back after updating your plant data.",
    confidenceLevel: "Low",
  };
}

export async function generateComparisonReport(
  plant: Plant,
  garden: Garden | null,
  activities: Activity[],
  timeRange: 'last_exam' | 'weekly' | 'monthly'
): Promise<{ text: string, html: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { text: "API key not configured.", html: "<p>API key not configured.</p>" };
  }

  const now = new Date();
  let filteredActivities = activities;
  let contextDesc = "";

  if (timeRange === 'weekly') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredActivities = activities.filter(a => new Date(a.date) >= oneWeekAgo);
    contextDesc = "over the past week";
  } else if (timeRange === 'monthly') {
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredActivities = activities.filter(a => new Date(a.date) >= oneMonthAgo);
    contextDesc = "over the past month";
  } else if (timeRange === 'last_exam') {
    const exams = activities.filter(a => a.type === 'AI Examination').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (exams.length < 2) {
      return { 
        text: "Aye bredrin, yu need at least two AI examinations fi run a comparison. Run another exam first, seen?", 
        html: "<p class='text-emerald-100/60'>You need at least two AI examinations to generate a comparison report.</p>" 
      };
    }
    filteredActivities = activities.filter(a => new Date(a.date) >= new Date(exams[1].date));
    contextDesc = "between the last two examinations";
  }

  const prompt = `
You are the Green Genie, a knowledgeable cannabis cultivation assistant.
Generate a comparison report for the plant "${plant.name}" ${contextDesc}.

Plant Current State:
- Stage: ${plant.stage}
- Health: ${plant.healthStatus}
- pH: ${plant.currentPH || 'N/A'}
- PPM: ${plant.currentPPM || 'N/A'}

Recent Activities (chronological):
${filteredActivities.sort((a,b)=>new Date(a.date).getTime() - new Date(b.date).getTime()).map(a => `- [${a.date}] ${a.type}: ${a.notes} ${a.ph ? '(pH: '+a.ph+')' : ''} ${a.ppm ? '(PPM: '+a.ppm+')' : ''}`).join('\n')}

Based on this data, provide:
1. A conversational, spoken-word summary (in a friendly, expert Jamaican Patois tone, starting with 'Aye bredrin') analyzing how the plant has progressed, what changed, and what to look out for. This should be plain text.
2. An HTML formatted report with bullet points, bold text, and a clean structure for the user to read on screen. Do not include markdown code block syntax inside the html string.

Respond ONLY with a JSON object in this format:
{"text": "Spoken word summary...", "html": "<h3>Report</h3><p>...</p>"}
`;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      config: {
        systemInstruction: "You are a specialized cannabis cultivation analysis tool. Respond ONLY in valid JSON.",
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let cleanText = response.text || "";
    if (cleanText.startsWith("\`\`\`")) cleanText = cleanText.replace(/\`\`\`(json)?/g, "").trim();
    if (cleanText.endsWith("\`\`\`")) cleanText = cleanText.substring(0, cleanText.length - 3);

    const result = JSON.parse(cleanText);
    return {
      text: result.text || "Report generated.",
      html: result.html || "<p>Report generated.</p>"
    };
  } catch (error) {
    console.error("Comparison report failed", error);
    return { text: "Signal interference. Couldn't generate the report right now.", html: "<p>Error generating report.</p>" };
  }
}