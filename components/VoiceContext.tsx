/**
 * VoiceContext.tsx
 *
 * Global React context that provides a single speak() function to the entire app.
 *
 * Voice priority:
 *   1. Live Gemini session (when mic is open) — real-time Aoede voice via WebSocket
 *   2. Gemini TTS API (speakAgentVoice) — same Aoede voice, fetched on demand
 *   3. Browser TTS — last resort fallback inside speakAgentVoice if API fails
 */
import React, { createContext, useContext, useRef, useCallback, useEffect } from "react";
import { speakAgentVoice } from "../services/voiceService";
import { liveTTSService } from "../services/liveTTSService";

interface VoiceContextType {
  /** Speak text using the best available voice. Fire-and-forget. */
  speak: (text: string) => void;
  /** Called by AIAgent to register/deregister the live session speak path. */
  registerLiveSpeak: (fn: ((text: string) => void) | null) => void;
  /** Stop all in-progress speech immediately. */
  stopSpeaking: () => void;
}

const VoiceContext = createContext<VoiceContextType>({
  speak: (text) => { speakAgentVoice(text); },
  registerLiveSpeak: () => {},
  stopSpeaking: () => {},
});

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const liveSpeakRef = useRef<((text: string) => void) | null>(null);

  // Warm up the background Live TTS session on mount so first speak is instant
  useEffect(() => {
    liveTTSService.warmup();
  }, []);

  const registerLiveSpeak = useCallback(
    (fn: ((text: string) => void) | null) => {
      liveSpeakRef.current = fn;
    },
    []
  );

  const speak = useCallback((text: string) => {
    if (!text?.trim()) return;
    if (liveSpeakRef.current) {
      // Route through the open live session (real-time Aoede voice)
      liveSpeakRef.current(text);
    } else {
      // Use Gemini TTS API → same Aoede voice, no mic required
      speakAgentVoice(text).catch(() => {});
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return (
    <VoiceContext.Provider value={{ speak, registerLiveSpeak, stopSpeaking }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
