import { GoogleGenAI } from "@google/genai";
import { TEXT_MODEL, FAST_TEXT_MODEL } from "../config/geminiModels";
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

// Lean, fast system prompt — focused only on what the model needs for plant examination.
function getPlantExaminationSystemPrompt(): string {
  return `You are The Green Genie, an expert cannabis cultivation AI.
You are examining a plant based on its data and activity logs.
Rules:
- Write ALL responses in clear, plain English. Do NOT use Jamaican Patois in text.
- Use the plant data provided. Do not invent missing information.
- Respond with ONLY valid JSON. No markdown. No explanation outside the JSON.
JSON structure (exactly this, no extra fields):
{"overallStatus":"...","plantSummary":"...","whatLooksGood":[...],"possibleIssues":[...],"likelyCauses":[...],"recommendedNextSteps":[...],"whatToMonitor":[...],"suggestedReminder":"...","confidenceLevel":"Low|Medium|High"}`;
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
      // Use fast model for text-only examination, full model when an image is included
      model: imageBase64 ? TEXT_MODEL : FAST_TEXT_MODEL,
      config: {
        systemInstruction: getPlantExaminationSystemPrompt(),
        temperature: 0.2,
        maxOutputTokens: 2048,   // Must be high enough to fit full JSON response
        responseMimeType: "application/json",
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
      // Extract JSON string from markdown code block if present
      let cleanText = text.trim();
      const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        cleanText = jsonMatch[1].trim();
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

  const prompt = `Generate a ${contextDesc} plant report for "${plant.name}".

Plant state: Stage=${plant.stage}, Health=${plant.healthStatus}, pH=${plant.currentPH || 'N/A'}, PPM=${plant.currentPPM || 'N/A'}

Activities:
${filteredActivities.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map(a=>`[${new Date(a.date).toLocaleDateString()}] ${a.type}: ${a.notes||''}${a.ph?' pH:'+a.ph:''}${a.ppm?' PPM:'+a.ppm:''}`).join('\n')}

Respond ONLY with this JSON (no markdown, no extra text):
{"text":"A plain English spoken summary of the plant's progress and what to watch for, starting with 'Hey there grower,...'","html":"<h3>Report</h3><p>...</p>"}`;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: FAST_TEXT_MODEL,  // Text-only report — use the faster model
      config: {
        // NOTE: Do NOT use responseMimeType: "application/json" here.
        // The html field contains HTML tags which confuse strict JSON mode.
        systemInstruction: "You are The Green Genie, a cannabis cultivation expert. Write ALL responses in plain English. Return ONLY a single valid JSON object. No markdown. No code blocks.",
        temperature: 0.2,
        maxOutputTokens: 2048,   // Must be high enough for full JSON — 1024 was causing truncation
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let cleanText = (response.text || "").trim();

    // Strip markdown code fences if present
    const fenceMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      cleanText = fenceMatch[1].trim();
    }

    // Find the JSON object boundaries robustly
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    console.log("[PlantReport] Parsing JSON:", cleanText.substring(0, 200));
    const result = JSON.parse(cleanText);
    return {
      text: result.text || "Report generated.",
      html: result.html || "<p>Report generated.</p>"
    };
  } catch (error) {
    console.error("[PlantReport] Comparison report failed:", error);
    return { text: "Signal interference. Couldn't generate the report right now.", html: "<p class='text-rose-400'>Error generating report. Please try again.</p>" };
  }
}