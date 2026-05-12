/**
 * liveTTSService.ts
 *
 * Real-time TTS via a persistent background Live WebSocket session.
 *
 * SPEED OPTIMIZATIONS:
 *   1. sendRealtimeInput({ text }) — the low-latency path vs sendClientContent
 *   2. Minimal Patois prompt — fewer tokens = faster first-chunk
 *   3. Text capped at 250 chars — long text = long wait
 *   4. AudioContext pre-resumed on warmup — no suspend delay on first speak
 *   5. nextPlayTime never resets mid-stream — gap-free chunk scheduling
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { LIVE_MODEL } from "../config/geminiModels";

// ─── helpers ────────────────────────────────────────────────────────────────

const getApiKey = (): string => {
  try {
    if (import.meta.env?.VITE_GEMINI_API_KEY)
      return import.meta.env.VITE_GEMINI_API_KEY;
  } catch {}
  try { return process.env.GEMINI_API_KEY || process.env.API_KEY || ""; } catch {}
  return "";
};

/** Strip HTML/markdown and hard-cap to 250 chars for minimum processing time */
const prepareText = (raw: string): string =>
  raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 250);

/** base64 PCM → AudioBuffer at 24 kHz */
const pcmToBuffer = (b64: string, ctx: AudioContext): AudioBuffer => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const buf = ctx.createBuffer(1, int16.length, 24000);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < int16.length; i++) ch[i] = int16[i] / 32768;
  return buf;
};

// ─── Singleton ───────────────────────────────────────────────────────────────

class LiveTTSService {
  private session: any = null;
  private connectingPromise: Promise<void> | null = null;
  private audioCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private stopped = false;

  // Keep one AudioContext alive and always resumed
  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = 0;
    }
    return this.audioCtx;
  }

  // Schedule PCM chunks gap-free on the audio timeline
  private scheduleChunk(b64: string) {
    if (this.stopped) return;
    try {
      const ctx = this.getCtx();
      const buffer = pcmToBuffer(b64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      // Start at the end of the previous chunk (or now if idle)
      const startAt = Math.max(ctx.currentTime + 0.005, this.nextPlayTime);
      source.start(startAt);
      this.nextPlayTime = startAt + buffer.duration;
      this.activeSources.add(source);
      source.onended = () => this.activeSources.delete(source);
    } catch {}
  }

  private async connect(): Promise<void> {
    if (this.session) return;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = (async () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("No API key");

      const ai = new GoogleGenAI({ apiKey });
      this.session = await (ai.live as any).connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          // Short, punchy system instruction — fewer tokens = faster first response
          systemInstruction:
            "Speak ONLY in authentic Jamaican Patois dialect. " +
            "Use: mi=I, yu=you, di=the, fi=to, nuh=no, seen?=understood. " +
            "Be warm, energetic, and natural. Never speak in plain English.",
        },
        callbacks: {
          onmessage: (msg: any) => {
            const parts = msg.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part?.inlineData?.data) this.scheduleChunk(part.inlineData.data);
            }
          },
          onerror: (err: any) => {
            console.warn("[LiveTTS] error — will reconnect:", err);
            this.session = null;
            this.connectingPromise = null;
          },
          onclose: () => {
            this.session = null;
            this.connectingPromise = null;
          },
        },
      });

      // Pre-resume AudioContext while connecting so it's ready instantly
      const ctx = this.getCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      console.log("[LiveTTS] ✅ Background session connected.");
    })();

    return this.connectingPromise.finally(() => {
      this.connectingPromise = null;
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async speak(text: string): Promise<void> {
    if (!text?.trim()) return;
    this.stopped = false;

    const clean = prepareText(text);
    if (!clean) return;

    await this.connect();

    const ctx = this.getCtx();
    if (ctx.state === "suspended") await ctx.resume();

    // Reset timeline for this utterance
    this.nextPlayTime = ctx.currentTime;

    // sendRealtimeInput({ text }) is the low-latency path — much faster than
    // sendClientContent() which creates a full content turn with more overhead.
    // Minimal prefix: just enough to cue Patois delivery.
    this.session.sendRealtimeInput({ text: `Say in Jamaican Patois: ${clean}` });
  }

  stop(): void {
    this.stopped = true;
    this.activeSources.forEach(s => { try { s.stop(); } catch {} });
    this.activeSources.clear();
    this.nextPlayTime = 0;
    window.speechSynthesis?.cancel();
  }

  /** Open the session early on app load so first speak() is instant. */
  warmup(): void {
    this.connect().catch(() => {});
  }
}

export const liveTTSService = new LiveTTSService();
