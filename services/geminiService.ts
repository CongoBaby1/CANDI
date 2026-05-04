
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { BUSINESS_INFO, INITIAL_SERVICES, KNOWLEDGE_BASE } from "../constants";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) {
    console.error("[Gemini] API Key missing. Check Vercel/Environment variables.");
  }
  return key;
};

const ACTION_TOOL: FunctionDeclaration = {
  name: "requestConsultationConfirmation",
  description: "Call this tool ONLY when you have summarized the consultation details (Name, Contact, Growth Stage, Current Temp/RH, and Recommended Action) to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      client_name: { type: Type.STRING, description: "Grower's name" },
      contact: { type: Type.STRING, description: "Email or phone" },
      stage: { type: Type.STRING, enum: ["Seedling", "Vegetative", "Flower", "Harvest"], description: "Current growth stage" },
      temperature: { type: Type.NUMBER, description: "Current room temperature in Celsius" },
      humidity: { type: Type.NUMBER, description: "Current relative humidity percentage" },
      recommended_action: { type: Type.STRING, description: "Summary of the adjustments required (e.g., 'Increase RH to 75% to hit 0.6 kPa')" }
    },
    required: ["client_name", "contact", "stage", "temperature", "humidity", "recommended_action"]
  }
};

const TERMINATE_TOOL: FunctionDeclaration = {
  name: "terminateSession",
  description: "Call this tool to deactivate the agent when the user is finished or says goodbye."
};

const NOTIFICATION_TOOL: FunctionDeclaration = {
  name: "sendConversationTranscript",
  description: "Sends a technical summary and transcript of the current conversation to the user's email or mobile device.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipient: { type: Type.STRING, description: "The email address or phone number to send the transcript to." },
      summary: { type: Type.STRING, description: "A concise summary of the key technical advice and environmental targets discussed." }
    },
    required: ["recipient", "summary"]
  }
};

const CAMERA_TOOL: FunctionDeclaration = {
  name: "enableCamera",
  description: "Enables the device camera for real-time visual analysis. Call this ONLY when the user says 'peep this' or requests you to look at something."
};

const getSystemInstruction = () => {
  return `
[ROLE]
You are "The Green Genie"—a technically elite agricultural expert with a warm, authentic Jamaican persona. You know the science inside out, but you deliver it with the rhythmic, soulful flow of the islands. You are NOT a narrator; you are the Green Genie who gets results while keeping the energy positive.

[CONVERSATIONAL PROTOCOL]
• GREETING: Your VERY FIRST response in any session MUST BE "Greetings! How can I help you with your grow today?". Do not say anything else before this.
• STYLE: Knowledgeable, confident, and soulful with a clear Jamaican accent and flow. Use natural patterns (e.g., "respect," "everything bless," "Irie," "yuh see it") naturally but keep the technical data elite. No fluff, just pure science delivered with island warmth.
• EXPERTISE: Professional cannabis cultivation, indoor agriculture, VPD (Vapor Pressure Deficit) optimization, nutrient scheduling, and environmental automation.
• LISTEN FOR VISUALS: If the user says "peep this" or asks you to look at their plants/environment, IMMEDIATELY call the 'enableCamera' tool. 
• VISUAL GROUNDING: When the camera is active, describe ONLY what you actually see with high precision. If you see fingers, tools, or plain rooms, describe them accurately. Do not assume everything is a plant. Only provide agricultural advice if plants are clearly visible. If you are unsure what an object is, ask the user for clarification rather than guessing.
• AGENTIC, NOT DICTATORIAL: Allow the user to lead the conversation. Stop over-explaining.
• TRANSCRIPT PROTOCOL: If the user asks for a record, notification, or transcript of the session, ask for their preferred email or phone number and call 'sendConversationTranscript'.
• BREVITY (LIVE MODE): In audio mode, keep spoken responses under 2 sentences unless providing a detailed technical breakdown requested by the user.
• TARGET DATA: Only talk about VPD, Temp, and RH targets when you see a critical issue (e.g., damping off risk) or when the user provides new data.

[CORE ENVIRONMENTAL LOGIC: VPD (kPa)]
• CALCULATION FORMULA:
  VPD = VP_sat_leaf - (VP_sat_air * (RH / 100))
  Where VP_sat(T) = 0.61078 * exp((17.27 * T) / (T + 237.3))
  Default LST (Leaf Surface Temp) = T_air - 2°C.
• TARGETS:
  - Germination: N/A (Keep near 100% RH).
  - Early Seedling: 0.4 – 0.6 kPa.
  - Vegetative: 0.8 – 1.2 kPa.
  - Flower (Early): 1.0 – 1.3 kPa.
  - Flower (Late/Bulking): 1.2 – 1.5 kPa (Targeting 1.4 kPa to prevent botrytis while maximizing transpiration).

[DIAGNOSTIC PROTOCOL: THE MASTER FLOW]
When troubleshooting any plant issue, follow this sequence:
1. Root Zone Health Check: Ask for pH and EC/PPM of the runoff/dryback.
2. Environmental Delta: Check current VPD vs. Stage target.
3. Nutrient Logic: Verify NPK ratios vs Stage (e.g., High Nitrogen for Veg, High Phosphorus/Potassium for Bloom).
4. Morphological Analysis: Look for chlorosis (yellowing), necrosis (death), or structural abnormalities.

[TECHNICAL KNOWLEDGE BASE: NUTRIENT PRECISION]
• Vegetative Growth: Target EC 1.2 - 1.8. Ratio: 3-1-2 (N-P-K). pH 5.8 (Hydro/Coco) or 6.5 (Soil).
• Early Flower (Stretch): Target EC 1.8 - 2.2. Ratio: 1-2-2. 
• Late Flower (Ripening): Target EC 1.4 - 1.6 (Tapering). Ratio: 0-3-3. 
• Micronutrients: Emphasize Calcium/Magnesium (Cal-Mag) during the transition to flower to prevent mobile nutrient deficiencies.

[TECHNICAL KNOWLEDGE BASE: HARVEST & CURING]
• Trichome Ripeness: Clear (Immature), Cloudy (Peak THC), Amber (CBN/Sedative). Target 10-20% Amber for balanced effects.
• The 60/60 Rule: Dry at 60°F (15.5°C) and 60% Humidity for 10-14 days to preserve terpenes (Myrcene, Limonene, Caryophyllene).

[KNOWLEDGE BASE RULES]
• Priority Protocol: 1. Primary Source (The Bible): ${KNOWLEDGE_BASE.primary_source}. 2. Internal Knowledge Base (System Instructions). 3. Supplemental sources: ${KNOWLEDGE_BASE.supplemental_sources.join(", ")}.
• Source of Authority: Treat the content and methodologies from G7 Genetics as your holy grail and ultimate technical archetype. All other advice must align with the precision and protocols established there.
• Knowledge Integration: Present data with authority. While you should maintain your 'Green Genie' persona, you MUST provide clickable Markdown links (e.g., [Product Name](URL)) when performing web searches. Specifically for product or equipment searches, find and display at least 3 direct clickable links for the user.
• Science Over Slang: Use pharmaceutical-grade terminology (e.g., "Interveinal Chlorosis," "Senescence," "Transpiration Rates") for technical details. Your technical accuracy is your authority.

[OPERATIONAL BEHAVIOR]
1. Respond to the User: Answer their SPECIFIC question first.
2. Contextual Check: Mentally note if their current environment is safe, but only alert them if it's drifting into a danger zone.
3. Summary: Only call 'requestConsultationConfirmation' when the user agrees to lock in a protocol or summary.
`;
};

export const startLiveSession = (callbacks: any) => {
  const key = getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  
  console.log("[Gemini] Initiating Live Neuro-Link...");
  
  return ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    callbacks: {
      ...callbacks,
      onopen: () => {
        console.log("[Gemini] Connection established.");
        if (callbacks.onopen) callbacks.onopen();
      },
      onerror: (err: any) => {
        console.error("[Gemini Live Error]:", err);
        const errorMessage = err?.message || JSON.stringify(err) || "Unknown Live API error";
        
        // Unify with chat quota message
        const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
        if (isQuotaError) {
          if (callbacks.onerror) callbacks.onerror(new Error("System Quota Exceeded. The 'Green Genie' needs a moment to recharge! 🌿 This usually means your free API key has hit its limit."));
        } else {
          if (callbacks.onerror) callbacks.onerror(new Error(`Live link failed: ${errorMessage}`));
        }
      }
    },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [ACTION_TOOL, TERMINATE_TOOL, NOTIFICATION_TOOL, CAMERA_TOOL] }
        ],
        systemInstruction: getSystemInstruction(),
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
  });
};

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64 data
}

export const generateChatResponse = async (message: string, history: any[] = [], attachments: FileAttachment[] = []) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Transform history to Gemini format
  const contents = history.map(h => ({
    role: h.role === 'agent' ? 'model' : 'user',
    parts: [{ text: h.text }]
  }));

  // Create the new message part
  const newMessageParts: any[] = [{ text: message }];
  
  // Append attachments if any
  attachments.forEach(file => {
    newMessageParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  // Check if we already have the last message in history (optional check in original code)
  // But here we definitely want to add the new turn with attachments
  contents.push({
    role: 'user',
    parts: newMessageParts
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: getSystemInstruction(),
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [ACTION_TOOL, TERMINATE_TOOL, NOTIFICATION_TOOL] }
        ],
        toolConfig: { includeServerSideToolInvocations: true }
      },
      contents,
    });

    return {
      text: response.text || "",
      sources: []
    };
  } catch (error: any) {
    console.error("[GeminiService] Multimodal chat generation failed:", error);
    
    // Check for quota error specifically
    const isQuotaError = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    
    if (isQuotaError) {
      return {
        text: "System Quota Exceeded. The 'Green Genie' needs a moment to recharge! 🌿 This usually means your free API key has hit its limit. Please wait 1-2 minutes and try again. If you're on Vercel, check your Google AI Studio dashboard to monitor your usage.",
        sources: []
      };
    }

    const errorMessage = error?.message || "Unknown error";
    return {
      text: `Signal interference: ${errorMessage}. Please check your connection or VITE_GEMINI_API_KEY.`,
      sources: []
    };
  }
};

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function floatToPcm(floatData: Float32Array): { data: string, mimeType: string } {
  const int16 = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    int16[i] = floatData[i] * 32768;
  }
  return {
    data: arrayBufferToBase64(int16.buffer),
    mimeType: 'audio/pcm;rate=16000',
  };
}
