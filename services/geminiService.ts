
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { BUSINESS_INFO, INITIAL_SERVICES } from "../constants";

const BOOKING_TOOL: FunctionDeclaration = {
  name: "requestBookingConfirmation",
  description: "Call this tool ONLY when you have collected ALL required booking details (Name, Phone, Email, Service, Date, Time, Tech) and summarized them to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      first_name: { type: Type.STRING, description: "Client's first name" },
      phone: { type: Type.STRING, description: "Client's phone number" },
      email: { type: Type.STRING, description: "Client's email address" },
      service: { type: Type.STRING, description: "The specific service requested" },
      date: { type: Type.STRING, description: "Appointment date" },
      time: { type: Type.STRING, description: "Appointment time" },
      tech: { type: Type.STRING, description: "Requested nail technician" }
    },
    required: ["first_name", "phone", "email", "service", "date", "time", "tech"]
  }
};

const TERMINATE_TOOL: FunctionDeclaration = {
  name: "terminateSession",
  description: "Call this tool to deactivate the agent when the user is finished or says goodbye."
};

const getSystemInstruction = (teamNames: string[] = []) => {
  const techniciansList = teamNames.length > 0 
    ? teamNames.join(", ") + ", or First Available"
    : "Candi, Sarah, James, or First Available";

  return `
You are Candi Nails & Spa’s official AI Voice. 

GREETING:
Start EVERY session with: "Hey Love. I am Candi Nails & Spa's AI Voice, the official assistant here. I can help with any questions, booking, rescheduling, or canceling appointments. How may I assist you today?"

ROLE:
- Book/Reschedule/Cancel appointments.
- Answer questions about nail care, trends, and beauty advice using Google Search if needed.
- Admin access: "${BUSINESS_INFO.adminPhrase}".

RULES:
1. Ask ONLY ONE question at a time.
2. Ask for email spelling: "Could you please spell that out for me?"
3. Technicians: ${techniciansList}.
4. Summary: Summarize all details before calling 'requestBookingConfirmation'.

SERVICES: ${INITIAL_SERVICES.map(s => `${s.name} (${s.price})`).join(", ")}.
HOURS: Mon-Sat ${BUSINESS_INFO.hours.mon_sat}, Sun ${BUSINESS_INFO.hours.sun}.
ADDRESS: ${BUSINESS_INFO.address}.

POST-BOOKING: "Perfect! Your appointment has been successfully booked. Is there anything else I can help you with?"
EXIT: Call 'terminateSession' if the user is done.
`;
};

export const startLiveSession = async (callbacks: any, teamNames: string[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    return await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        ...callbacks,
        onerror: (err: any) => {
          console.error("[Gemini Live Error]:", err);
          if (callbacks.onerror) callbacks.onerror(err);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        tools: [{ functionDeclarations: [BOOKING_TOOL, TERMINATE_TOOL] }],
        systemInstruction: getSystemInstruction(teamNames),
        thinkingConfig: { thinkingBudget: 0 }, 
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      },
    });
  } catch (error: any) {
    console.error("[GeminiService] Connection failure:", error);
    throw error;
  }
};

export const generateChatResponse = async (message: string, history: any[] = [], teamNames: string[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents = history.map(h => ({
    role: h.role === 'agent' ? 'model' : 'user',
    parts: [{ text: h.text }]
  }));
  
  if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== message) {
    contents.push({ role: 'user', parts: [{ text: message }] });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { 
        systemInstruction: getSystemInstruction(teamNames),
        tools: [{ functionDeclarations: [BOOKING_TOOL, TERMINATE_TOOL] }, { googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean);

    return {
      text: response.text || "",
      sources: sources || []
    };
  } catch (error) {
    console.error("[GeminiService] Chat generation failed:", error);
    return {
      text: "I'm having trouble connecting to my service. Could you please try again?",
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
