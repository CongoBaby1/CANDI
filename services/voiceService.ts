/**
 * voiceService.ts
 *
 * Routes all app speech through the best available voice engine:
 *
 *   1. PRIMARY  — liveTTSService (persistent Live WebSocket, same Aoede voice
 *                 as the mic agent, audio starts < 500 ms, real-time streaming)
 *   2. FALLBACK — gemini-2.5-flash-preview-tts REST API (1-2 s delay, still Aoede)
 *   3. LAST     — Browser SpeechSynthesis (generic, only if both Gemini paths fail)
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { liveTTSService } from "./liveTTSService";

// ─── helpers ────────────────────────────────────────────────────────────────

const getApiKey = (): string => {
  try {
    if (import.meta.env?.VITE_GEMINI_API_KEY)
      return import.meta.env.VITE_GEMINI_API_KEY;
  } catch {}
  try {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  } catch {}
  return "";
};

/** Strip HTML / markdown and cap length for clean TTS input. */
const cleanForSpeech = (raw: string): string =>
  raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 250); // match liveTTSService cap — less text = faster

// ─── REST API TTS fallback (gemini-2.5-flash-preview-tts) ───────────────────

/** base64 → Uint8Array */
const b64ToBytes = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
};

/** Raw 16-bit PCM (mono, 24 kHz) → AudioBuffer */
const rawPcmToAudioBuffer = (bytes: Uint8Array, ctx: AudioContext): AudioBuffer => {
  const numSamples = Math.floor(bytes.byteLength / 2);
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, numSamples);
  const buf = ctx.createBuffer(1, numSamples, 24000);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < numSamples; i++) ch[i] = int16[i] / 32768.0;
  return buf;
};

let _restAudioCtx: AudioContext | null = null;
const getRestCtx = (): AudioContext => {
  if (!_restAudioCtx || _restAudioCtx.state === "closed")
    _restAudioCtx = new AudioContext({ sampleRate: 24000 });
  return _restAudioCtx;
};

const restTTSFallback = async (cleanText: string): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) { browserFallback(cleanText); return; }

  const ai = new GoogleGenAI({ apiKey });
  const ttsPrompt = `Say in Jamaican Patois with warmth: ${cleanText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ role: "user", parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
    } as any,
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) throw new Error("No audio data from REST TTS");

  const audioBytes = b64ToBytes(inlineData.data);
  const ctx = getRestCtx();
  if (ctx.state === "suspended") await ctx.resume();
  window.speechSynthesis?.cancel();

  let audioBuffer: AudioBuffer;
  try {
    const copy = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength);
    audioBuffer = await ctx.decodeAudioData(copy);
  } catch {
    audioBuffer = rawPcmToAudioBuffer(audioBytes, ctx);
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start();
  console.log("[VoiceService] REST TTS playing:", cleanText.substring(0, 50));
};

// ─── browser TTS last resort ─────────────────────────────────────────────────

const browserFallback = (text: string): void => {
  if (!("speechSynthesis" in window)) return;
  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice =
      voices.find(v => v.name.toLowerCase().includes("mark") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.toLowerCase().includes("david") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang.startsWith("en") && v.localService) ||
      voices.find(v => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.85;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) { doSpeak(voices); return; }
  window.speechSynthesis.onvoiceschanged = () => {
    doSpeak(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = null;
  };
  setTimeout(() => { if (!window.speechSynthesis.speaking) doSpeak(window.speechSynthesis.getVoices()); }, 400);
};

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Speak text using the best available real-time voice engine.
 *
 * Priority:
 *   1. liveTTSService  — Live WebSocket, real-time PCM streaming, < 500 ms start
 *   2. restTTSFallback — REST API TTS, ~1-2 s delay, still Aoede
 *   3. browserFallback — generic browser voice, last resort
 */
export const speakAgentVoice = async (
  text: string,
  isMuted: boolean = false
): Promise<void> => {
  if (isMuted || !text?.trim()) return;

  const cleanText = cleanForSpeech(text);
  if (!cleanText) return;

  // ── 1. Real-time Live TTS ──────────────────────────────────────────────────
  try {
    await liveTTSService.speak(cleanText);
    console.log("[VoiceService] ✅ Live TTS speaking:", cleanText.substring(0, 50));
    return;
  } catch (liveErr) {
    console.warn("[VoiceService] Live TTS failed, trying REST TTS:", liveErr);
  }

  // ── 2. REST API TTS fallback ───────────────────────────────────────────────
  try {
    await restTTSFallback(cleanText);
    return;
  } catch (restErr) {
    console.warn("[VoiceService] REST TTS failed, using browser fallback:", restErr);
  }

  // ── 3. Browser last resort ─────────────────────────────────────────────────
  browserFallback(cleanText);
};
