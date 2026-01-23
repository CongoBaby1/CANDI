
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { BUSINESS_INFO, INITIAL_SERVICES } from "../constants";

const BOOKING_TOOL: FunctionDeclaration = {
  name: "requestBookingConfirmation",
  description: "Call this tool ONLY when you have collected all required booking details (Name, Phone, Email, Service, Date, Time, Technician) and have verbally summarized them to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      first_name: { type: Type.STRING, description: "Client's first name" },
      phone: { type: Type.STRING, description: "Client's phone number" },
      email: { type: Type.STRING, description: "Client's email address" },
      service: { type: Type.STRING, description: "The specific service requested" },
      date: { type: Type.STRING, description: "The appointment date (e.g. Monday, Dec 5th)" },
      time: { type: Type.STRING, description: "The appointment time" },
      tech: { type: Type.STRING, description: "The requested nail technician" }
    },
    required: ["first_name", "phone", "email", "service", "date", "time", "tech"]
  }
};

const TERMINATE_TOOL: FunctionDeclaration = {
  name: "terminateSession",
  description: "Call this tool to deactivate the agent and close the window when the user says they are finished or don't need further help."
};

const getSystemInstruction = (teamNames: string[] = []) => {
  const techniciansList = teamNames.length > 0 
    ? teamNames.join(", ") + ", or First Available"
    : "Candi, Sarah, James, or First Available";

  return `
You are Candi Nails & Spa’s AI Voice, the official AI assistant.

MANDATORY OPENING PROTOCOL:
The VERY FIRST thing you say in every session MUST be exactly this phrase:
"Hey Love. I am Candi Nails & Spa's AI Voice, the official assistant here. I can help with any questions, booking, rescheduling, or canceling appointments. How may I assist you today?"

Do not vary this. Do not say "Hello" or "How can I help" before this. Lead with "Hey Love."

You are responsible for:
- Speaking automatically when users click the agent icon
- Booking, rescheduling, and canceling appointments
- Capturing leads
- Managing multi-employee calendars
- Saving data into CRM
- Handling email notifications
- Triggering a pop-up confirmation window
- Switching between voice mode and chat mode
- Entering admin mode via secret phrase ("${BUSINESS_INFO.adminPhrase}")

PERSONALITY:
Professional, friendly, courteous, warm, and personable. Never robotic.

COMMUNICATION RULES:
1. Ask ONLY one question at a time. Never bundle multiple requests for information into a single turn.
2. When asking the user for their email address, you MUST explicitly ask them to spell it out to ensure 100% accuracy.

BOOKING WORKFLOW:
Collect info one-by-one: First name, Phone, Email (ask to spell it), Service, Date, Time, Nail tech.
Technicians available: ${techniciansList}.

After collecting all details, you MUST:
1. Verbally summarize all booking details.
2. Ask if the information is correct.
3. If confirmed, call 'requestBookingConfirmation'.

POST-CONFIRMATION:
Once confirmed, say exactly: “Perfect! Your appointment has been successfully booked. Is there anything else I can help you with?”

EXIT PROTOCOL:
If the user indicates they are finished, says "No" to your offer of further help, or says goodbye, you MUST call 'terminateSession' to deactivate the agent immediately.

CANCELLATIONS:
- Must be made 24+ hours before.
- If inside 24 hours, say: “Cancellations must be at least 24 hours in advance. Would you like to reschedule instead?”

Business Info: ${BUSINESS_INFO.name}, ${BUSINESS_INFO.address}.
Hours: Mon-Sat ${BUSINESS_INFO.hours.mon_sat}, Sun ${BUSINESS_INFO.hours.sun}.
Services: ${INITIAL_SERVICES.map(s => `${s.name}: ${s.price}`).join(", ")}.
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
        tools: [{ functionDeclarations: [BOOKING_TOOL, TERMINATE_TOOL] }],
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("[GeminiService] Chat generation failed:", error);
    return "I'm having trouble connecting to my service. Could you please try again?";
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
