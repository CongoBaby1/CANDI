/**
 * Central configuration for Gemini AI models used throughout the application.
 */

// Stable model for text-only or multimodal generateContent REST calls
export const TEXT_MODEL = "gemini-2.5-flash";

// Alias used for fast text calls — same model, kept for import compatibility
export const FAST_TEXT_MODEL = "gemini-2.5-flash";

// Dedicated TTS model — used by voiceService for all app-wide speech synthesis
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Current working model for Realtime/Live BidiGenerateContent (WebSocket)
export const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

export const getModelErrorMessage = (error: any) => {
  const errorStr = JSON.stringify(error);
  if (errorStr.includes("404") || errorStr.includes("not found") || errorStr.includes("not supported") || errorStr.includes("tool call context circulation")) {
    return "The AI model request was rejected because of an unsupported tool configuration. Please update the Gemini model settings.";
  }
  return null;
};