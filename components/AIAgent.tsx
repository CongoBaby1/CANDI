import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router-dom';
import { User, Mic, Send, X, Sparkles, CircleCheck, AlertTriangle, RefreshCcw, Loader2, Zap, Paperclip, FileText, Image as ImageIcon, Volume2, VolumeX, GraduationCap, Sprout } from 'lucide-react';
import { 
  startLiveSession, 
  generateChatResponse, 
  base64ToUint8Array, 
  decodeAudioData, 
  floatToPcm,
  FileAttachment
} from '../services/geminiService';
import { BUSINESS_INFO, SAMPLE_PROMPTS } from '../constants';
import { TEXT_MODEL, LIVE_MODEL, getModelErrorMessage } from '../config/geminiModels';
import { Cultivator } from '../types';
import { speakAgentVoice } from '../services/voiceService';
import { useVoice } from './VoiceContext';

interface AIAgentProps {
  onAdminAuth: (phrase: string) => void;
  onConsultation: (consultation: any) => void;
  cultivators?: Cultivator[];
}

const ConsultationConfirmationModal = ({ consultation, onConfirm, onCancel }: { consultation: any, onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-md">
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-10">
        <div className="flex justify-between items-start mb-8">
          <div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600 shadow-sm border border-emerald-100/50">
            <CircleCheck size={32} />
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
        </div>
        <h2 className="text-3xl font-bold mb-4 tracking-tighter text-slate-900">Sync Protocol</h2>
        <div className="bg-slate-50 p-6 rounded-3xl space-y-4 mb-8 text-sm border border-slate-100">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Grower</p>
              <p className="font-bold text-slate-800">{consultation.client_name}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Stage</p>
              <p className="font-bold text-slate-800">{consultation.stage}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Contact</p>
              <p className="font-bold text-slate-800">{consultation.contact}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Env Temp</p>
              <p className="font-bold text-slate-800">{consultation.temperature}°C</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Relative Humidity</p>
              <p className="font-bold text-slate-800">{consultation.humidity}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1 mono">Recommended Action</p>
              <p className="font-bold text-emerald-700">{consultation.recommended_action}</p>
            </div>
          </div>
        </div>
        <button onClick={onConfirm} className="w-full bg-emerald-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-900 transition shadow-xl shadow-emerald-100 mono">Initialize Calibration</button>
      </div>
    </div>
  </div>
);

const AIAgent: React.FC<AIAgentProps> = ({ onAdminAuth, onConsultation, cultivators = [] }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{sent: boolean, recipient: string} | null>(null);
  const [pendingConsultation, setPendingConsultation] = useState<any>({});
  const [errorState, setErrorState] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<number | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userTranscriptionRef = useRef("");
  const modelTranscriptionRef = useRef("");
  const chatHistoryRef = useRef<any[]>([]);
  const isVoiceActiveRef = useRef(true);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const isSessionLiveRef = useRef(false);
  const isPendingTerminationRef = useRef(false);
  const isPendingModalRef = useRef(false);
  const isAgentSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);

  const { registerLiveSpeak } = useVoice();

  useEffect(() => { chatHistoryRef.current = messages; }, [messages]);
  useEffect(() => { isVoiceActiveRef.current = isVoiceMode; }, [isVoiceMode]);
  useEffect(() => { isAgentSpeakingRef.current = isAgentSpeaking; }, [isAgentSpeaking]);

  // Register / deregister the live speak function in the global VoiceContext
  // whenever the session opens or closes, or mute state changes
  useEffect(() => {
    if (isOpen && isSessionLiveRef.current && !isMuted) {
      registerLiveSpeak((text: string) => {
        // Send text to the live Gemini session so it speaks in its own voice
        if (sessionPromiseRef.current && isSessionLiveRef.current) {
          sessionPromiseRef.current.then((session: any) => {
            try {
              session.sendRealtimeInput({
                text: `SPEAK THIS ALOUD in your Green Genie persona: ${text}`
              });
            } catch {
              speakAgentVoice(text, isMuted);
            }
          });
        } else {
          speakAgentVoice(text, isMuted);
        }
      });
    } else {
      // No live session — fall back to browser TTS from VoiceContext
      registerLiveSpeak(null);
    }
  }, [isOpen, isMuted, registerLiveSpeak]);

  // Handle camera stream attachment to video element
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(e => console.warn("[AIAgent] Video play failed:", e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isConnecting, isAgentSpeaking, isThinking]);

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const cleanupAudioNodes = useCallback(() => {
    isSessionLiveRef.current = false;
    if (processorNodeRef.current) { 
      try { processorNodeRef.current.disconnect(); } catch {}
      processorNodeRef.current = null; 
    }
    if (sourceNodeRef.current) { 
      try { sourceNodeRef.current.disconnect(); } catch {}
      sourceNodeRef.current = null; 
    }
    if (microphoneStreamRef.current) { 
      microphoneStreamRef.current.getTracks().forEach(track => track.stop()); 
      microphoneStreamRef.current = null; 
    }
    stopCameraStreaming();
  }, []);

  const stopCameraStreaming = useCallback(() => {
    setIsCameraActive(false);
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const startCameraStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "environment" 
        } 
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);

      cameraIntervalRef.current = window.setInterval(async () => {
        if (!isSessionLiveRef.current || !canvasRef.current || !videoRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure video is playing and has data
        if (video.paused || video.ended || video.readyState < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sync canvas size to video size to ensure no stretching or empty fills
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 jpeg
        const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        
        const session = await sessionPromiseRef.current;
        if (session && isSessionLiveRef.current) {
          try {
            session.sendRealtimeInput({
              video: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            });
          } catch (e) {
            console.warn("[AIAgent] Failed to send image frame:", e);
          }
        }
      }, 3000); // Send 1 frame per 3 seconds to preserve quota on free tier keys

    } catch (err) {
      console.error("[AIAgent] Camera access denied or failed:", err);
      addMessage('agent', "I couldn't activate the visual link. Please check your camera permissions.");
    }
  }, []);

  const speak = useCallback((text: string) => {
    speakAgentVoice(text, isMuted);
  }, [isMuted]);

  const toggleMute = () => {
    if (!isMuted) {
      stopAllAudio();
      window.speechSynthesis.cancel();
    }
    setIsMuted(!isMuted);
  };

  const closeSession = useCallback(() => {
    setIsAgentSpeaking(false);
    stopAllAudio();
    cleanupAudioNodes();
    isPendingTerminationRef.current = false;
    isPendingModalRef.current = false;
    
    // Deregister live speak — fall back to browser TTS
    registerLiveSpeak(null);

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => { try { s.close(); } catch {} });
      sessionPromiseRef.current = null;
    }
    setIsOpen(false);
  }, [stopAllAudio, cleanupAudioNodes, registerLiveSpeak]);

  const checkSecretPhrase = useCallback((text: string) => {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const secret = BUSINESS_INFO.adminPhrase.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    if (normalized.includes(secret)) {
      onAdminAuth(BUSINESS_INFO.adminPhrase);
      closeSession();
    }
  }, [onAdminAuth, closeSession]);

  const addMessage = useCallback((role: 'user' | 'agent', text: string) => {
    if (!text.trim()) return;
    const newMessage = { id: Math.random().toString(36), role, text, timestamp: new Date() };
    setMessages(prev => {
      const next = [...prev, newMessage];
      if (role === 'agent' && next.length === 1) {
        setShowSuggestions(true);
      }
      return next;
    });
    checkSecretPhrase(text);
  }, [checkSecretPhrase]);

  const renderMessageText = (text: string, role: 'user' | 'agent') => {
    const isUser = role === 'user';
    return (
      <div className={`markdown-body ${isUser ? 'text-white' : 'text-slate-700'}`}>
        <ReactMarkdown
          components={{
            a: ({node, ...props}) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`${isUser ? 'text-emerald-300 hover:text-emerald-100' : 'text-emerald-600 hover:text-emerald-800'} underline transition-colors font-bold break-all`} 
              />
            ),
            p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0 leading-relaxed" />,
            ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 mb-3 space-y-1" />,
            ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-5 mb-3 space-y-1" />,
            li: ({node, ...props}) => <li {...props} className="mb-1" />,
            strong: ({node, ...props}) => <strong {...props} className={`font-bold ${isUser ? 'text-emerald-200' : 'text-emerald-900'}`} />,
            h1: ({node, ...props}) => <h1 {...props} className="text-xl font-black mb-2 mono uppercase" />,
            h2: ({node, ...props}) => <h2 {...props} className="text-lg font-black mb-2 mono uppercase" />,
            h3: ({node, ...props}) => <h3 {...props} className="text-md font-black mb-1 mono uppercase" />,
            code: ({node, inline, ...props}: any) => (
              <code 
                {...props} 
                className={`${inline ? 'bg-slate-100 px-1 rounded text-emerald-800' : 'block bg-slate-900 text-emerald-400 p-3 rounded-xl my-2 overflow-x-auto'} font-mono text-xs`} 
              />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  const submitMessage = async (msg: string, attachmentsToUse: FileAttachment[] = []) => {
    if (!msg.trim() && attachmentsToUse.length === 0) return;
    
    addMessage('user', msg + (attachmentsToUse.length > 0 ? ` [Attached: ${attachmentsToUse.map(f => f.name).join(', ')}]` : ""));
    
    const isOnlyText = attachmentsToUse.length === 0 && msg.trim() !== "";

    // If it's ONLY text and we are in voice mode, send it to the live session
    if (isOnlyText && isVoiceMode && isSessionLiveRef.current && sessionPromiseRef.current) {
      const session: any = await sessionPromiseRef.current;
      if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.sendRealtimeInput({ text: msg });
        return;
      }
    }

    // If we reach here, we either have attachments, or we are in text mode.
    if (isVoiceMode) isProcessingRef.current = true;
    setIsThinking(true);

    // Auto-clear thinking after 30s as safety net
    const thinkingTimeout = setTimeout(() => {
      setIsThinking(false);
      isProcessingRef.current = false;
    }, 30000);

    try {
      const response = await generateChatResponse(msg, chatHistoryRef.current, attachmentsToUse);
      clearTimeout(thinkingTimeout);
      setIsThinking(false);
      
      // Always show the text response as a visible message so user sees something
      addMessage('agent', response.text);
      
      // Send to voice session if available — this uses the natural Kore voice from Gemini
      const liveSessionAvailable = isVoiceMode && isSessionLiveRef.current && sessionPromiseRef.current;
      
      if (liveSessionAvailable) {
        const session: any = await sessionPromiseRef.current;
        try {
          session.sendRealtimeInput({ text: `SYSTEM_DIRECTIVE: The user just uploaded a document/image. I have analyzed it. Please provide a brief, conversational spoken summary of the following analysis to the user in your persona: \n\n${response.text}` });
        } catch (e) {}
        // Do NOT use browser speech synthesis — let the Gemini voice handle it
      } else if (attachmentsToUse.length > 0) {
        // Fallback: use browser speech only if live session is NOT available
        speak(response.text);
      }
      
      isProcessingRef.current = false;
    } catch (err) { 
      clearTimeout(thinkingTimeout);
      setIsThinking(false);
      addMessage('agent', "Protocol link interrupted."); 
      isProcessingRef.current = false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const promise = new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          newAttachments.push({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64
          });
          resolve();
        };
      });

      reader.readAsDataURL(file);
      await promise;
    }

    setPendingFiles(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatSubmit = async () => {
    if (!inputText.trim() && pendingFiles.length === 0) return;
    const msg = inputText;
    const attachments = [...pendingFiles];
    
    setInputText("");
    setPendingFiles([]);
    setShowSuggestions(false);
    
    await submitMessage(msg, attachments);
  };

  const handlePromptClick = async (prompt: string) => {
    setShowSuggestions(false);
    await submitMessage(prompt, []);
  };

  const startSession = async () => {
    console.log("[AIAgent] Starting Neural Link initialization...");
    setErrorState(null);
    setIsConnecting(true);
    isPendingTerminationRef.current = false;
    isPendingModalRef.current = false;
    isSessionLiveRef.current = false;
    cleanupAudioNodes();
    
    try {
      console.log("[AIAgent] Requesting hardware permissions...");
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true }).catch(e => {
        console.error("[AIAgent] Mic access denied:", e);
        throw new Error("Hardware access denied. Please enable microphone permissions.");
      });
      
      if (!inputAudioContextRef.current) {
        console.log("[AIAgent] Creating Input Audio Context (16kHz)");
        inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        console.log("[AIAgent] Creating Output Audio Context (24kHz)");
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      
      console.log("[AIAgent] Resuming Audio Contexts...");
      try { await inputAudioContextRef.current.resume(); } catch (e) { console.warn("[AIAgent] Input AudioContext resume failed:", e); }
      try { await outputAudioContextRef.current.resume(); } catch (e) { console.warn("[AIAgent] Output AudioContext resume failed:", e); }

      console.log(`[AIAgent] Connecting to Gemini Live API with model: ${LIVE_MODEL}`);
      const sessionPromise = startLiveSession({
        onopen: async () => {
          console.log("[AIAgent] Neural Link Synchronized. Socket OPEN.");
          setIsConnecting(false);
          try {
            const stream = await streamPromise;
            if (!sessionPromiseRef.current) { 
              console.log("[AIAgent] Session promise invalidated, stopping stream.");
              stream.getTracks().forEach(t => t.stop()); 
              return; 
            }

            console.log("[AIAgent] Microphone streaming hardware engaged.");
            microphoneStreamRef.current = stream;
            setIsAgentSpeaking(true);
            isSessionLiveRef.current = true;

            // Register this live session's speak capability in the global VoiceContext
            registerLiveSpeak((text: string) => {
              if (sessionPromiseRef.current && isSessionLiveRef.current && !isMuted) {
                sessionPromiseRef.current.then((session: any) => {
                  try {
                    session.sendRealtimeInput({
                      text: `SPEAK THIS ALOUD in your Green Genie persona (Jamaican Patois): ${text}`
                    });
                  } catch {
                    speakAgentVoice(text, isMuted);
                  }
                });
              } else {
                speakAgentVoice(text, isMuted);
              }
            });

            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputAudioContextRef.current!.createScriptProcessor(1024, 1, 1);
            processorNodeRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (!isSessionLiveRef.current || !isVoiceActiveRef.current || isAgentSpeakingRef.current || isProcessingRef.current) return;
              try {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = floatToPcm(inputData);
                sessionPromise.then((session: any) => {
                  if (!isSessionLiveRef.current) return;
                  try { 
                    session.sendRealtimeInput({ media: pcmBlob }); 
                  } catch (err) { 
                    console.debug("Send error:", err);
                    isSessionLiveRef.current = false;
                    cleanupAudioNodes();
                  }
                });
              } catch (err) { 
                console.error("[AIAgent] PCM Streaming Error:", err);
                isSessionLiveRef.current = false; 
              }
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);
            
            sessionPromise.then((session: any) => {
              const greetings = [
                "Hey! The Green Genie is here. What do you need today?",
                "Welcome back, grower! The Green Genie is ready to help.",
                "What's good! How is your grow doing today?",
                "Respect! The Green Genie is in the building.",
                "Big up! What can I do for your plants today?",
                "Let's grow! Talk to me, what's on your mind?",
                "The Green Genie is online. What do you need?",
                "Blessings! How is the garden looking today?",
                "You know what time it is! What do you need for the grow?",
                "The Green Genie is ready to chat. What's going on?",
                "Boom! What issue are you dealing with today?",
                "Greetings, grow family! Talk to me.",
                "Hey boss grower! How are things going?",
                "Respect and prosperity! What do you need?",
                "Good vibes! The Green Genie is on deck.",
                "What's good, cannabis champion?",
                "Let's fix those plants today. What's happening?",
                "Hey! How are the ladies looking?",
                "What can I solve for you today?",
                "The Green Genie is live and ready. Talk to me.",
              ];
              const greeting = greetings[Math.floor(Math.random() * greetings.length)];
              try { session.sendRealtimeInput({ text: `SYSTEM_START. Greet the user now by saying warmly: "${greeting}"` }); } catch (e) { }
            });
          } catch (micErr: any) {
            console.error("[AIAgent] Hardware link failed:", micErr);
            setErrorState(`Hardware link denied: ${micErr.message || 'Permission error'}`);
            setIsConnecting(false);
            cleanupAudioNodes();
          }
        },
        onmessage: async (msg: any) => {
          if (msg.toolCall) {
            console.log("[AIAgent] Tool call received:", msg.toolCall);
            for (const fc of msg.toolCall.functionCalls) {
              if (fc.name === "requestConsultationConfirmation") {
                setPendingConsultation({ ...fc.args, toolCallId: fc.id });
                stopAllAudio();
                setShowConfirmModal(true); 
                setIsAgentSpeaking(false); 
              } else if (fc.name === "terminateSession") {
                isPendingTerminationRef.current = true;
                if (activeSourcesRef.current.size === 0) setTimeout(closeSession, 1000);
              } else if (fc.name === "sendConversationTranscript") {
                const { recipient, summary } = fc.args;
                setNotificationStatus({ sent: true, recipient });
                setTimeout(() => setNotificationStatus(null), 5000);

                sessionPromise.then((session) => {
                  try {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: fc.id,
                        name: "sendConversationTranscript",
                        response: { result: `Success: Technical transcript sent to ${recipient}.` }
                      }]
                    });
                  } catch (e) { }
                });
              } else if (fc.name === "enableCamera") {
                startCameraStreaming();
                sessionPromise.then((session) => {
                  try {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: fc.id,
                        name: "enableCamera",
                        response: { result: "Camera activated. Viewing real-time stream." }
                      }]
                    });
                  } catch (e) { }
                });
              }
            }
          }

          // Scan ALL parts — native audio models can place audio chunks in any part index
          const parts = msg.serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            const audioData = part?.inlineData?.data;
            if (audioData && outputAudioContextRef.current && isVoiceActiveRef.current) {
              try {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(outputAudioContextRef.current.destination);
                source.addEventListener('ended', () => { 
                  activeSourcesRef.current.delete(source);
                  if (activeSourcesRef.current.size === 0) {
                    setIsAgentSpeaking(false);
                  }
                  if (isPendingModalRef.current && activeSourcesRef.current.size === 0) {
                    isPendingModalRef.current = false; setShowConfirmModal(true); setIsAgentSpeaking(false);
                  }
                  if (isPendingTerminationRef.current && activeSourcesRef.current.size === 0) setTimeout(closeSession, 200);
                });
                setIsAgentSpeaking(true);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                activeSourcesRef.current.add(source);
              } catch (audioErr) {
                console.warn('[AIAgent] Audio decode error for part:', audioErr);
              }
            }
          }

          if (msg.serverContent?.interrupted) {
            console.log("[AIAgent] Model interrupted");
            stopAllAudio();
          }
          if (msg.serverContent?.inputTranscription) {
            userTranscriptionRef.current += msg.serverContent.inputTranscription.text;
            checkSecretPhrase(userTranscriptionRef.current);
          }
          if (msg.serverContent?.outputTranscription) {
            modelTranscriptionRef.current += msg.serverContent.outputTranscription.text;
          }

          if (msg.serverContent?.turnComplete) {
            if (userTranscriptionRef.current) { addMessage('user', userTranscriptionRef.current); userTranscriptionRef.current = ""; }
            if (modelTranscriptionRef.current) { addMessage('agent', modelTranscriptionRef.current); modelTranscriptionRef.current = ""; }
          }
        },
        onerror: (err: any) => { 
            console.error("[AIAgent] Session Error:", err);
            setErrorState(`Consultant offline: ${err.message || 'Connection failed'}`); 
            setIsConnecting(false); 
            cleanupAudioNodes(); 
        },
        onclose: (e: any) => { 
            console.log("[AIAgent] Session closed. Code:", e.code, "Reason:", e.reason);
            isSessionLiveRef.current = false; 
            setIsConnecting(false); 
            cleanupAudioNodes(); 
        }
      });

      sessionPromise.catch((err) => {
        console.error("Connection failed", err);
        setErrorState("Connection failed");
        setIsConnecting(false);
        cleanupAudioNodes();
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error("[AIAgent] Initialization error:", err);
      setErrorState(`Uplink failed: ${err.message || 'Unknown error'}`);
      setIsConnecting(false);
      cleanupAudioNodes();
    }
  };

  const toggleOpen = () => { 
    if (isOpen) {
      closeSession(); 
    } else { 
      // Reset session state for a fresh start
      setMessages([]);
      chatHistoryRef.current = [];
      userTranscriptionRef.current = "";
      modelTranscriptionRef.current = "";
      setErrorState(null);
      setPendingFiles([]);
      setShowSuggestions(false);
      
      setIsOpen(true); 
      setIsVoiceMode(true); 
      startSession(); 
    } 
  };

  const handleModalConfirm = async () => {
    onConsultation(pendingConsultation);
    setShowConfirmModal(false);
    if (sessionPromiseRef.current && pendingConsultation.toolCallId) {
      sessionPromiseRef.current.then((session) => {
        session.sendToolResponse({ functionResponses: [{ id: pendingConsultation.toolCallId, name: "requestConsultationConfirmation", response: { result: "Success: Protocol Authenticated." } }] });
      });
    } else { addMessage('agent', "Record updated. Protocol active."); }
  };

  const handleModalCancel = () => {
    setShowConfirmModal(false);
    if (sessionPromiseRef.current && pendingConsultation.toolCallId) {
      sessionPromiseRef.current.then((session) => {
        session.sendToolResponse({ functionResponses: [{ id: pendingConsultation.toolCallId, name: "requestConsultationConfirmation", response: { result: "User aborted calibration." } }] });
      });
    }
  };

  if (location.pathname === '/cannabis-university') return null;

  return (
    <>
      <div className="fixed bottom-6 md:bottom-10 right-4 md:right-16 z-[60] flex flex-col items-center gap-3 pointer-events-auto">
        <button 
          onClick={toggleOpen}
          className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group ${isOpen ? 'bg-emerald-950 text-white rotate-90' : 'bg-emerald-800 text-white hover:scale-110 hover:shadow-emerald-200'}`}
        >
          {isOpen ? <X size={28} /> : <div className="relative"><Mic size={24} className="md:w-8 md:h-8" /><div className="absolute inset-0 bg-emerald-400 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div></div>}
        </button>

        <Link 
          to="/my-gardens" 
          className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-emerald-800 text-white border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-700 transition-all shadow-lg font-bold uppercase tracking-widest text-[9px] md:text-[10px]"
        >
          <Sprout className="w-4 h-4" />
          <span className="hidden sm:inline">My Gardens</span>
          <span className="sm:hidden">Gardens</span>
        </Link>

        <Link 
          to="/cannabis-university" 
          className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-emerald-800 text-white border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-700 transition-all shadow-lg font-bold uppercase tracking-widest text-[9px] md:text-[10px]"
        >
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">Cannabis University</span>
          <span className="sm:hidden">University</span>
        </Link>
      </div>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-32 md:right-16 z-[60] w-full md:w-[450px] md:h-[700px] bg-white md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in md:slide-in-from-bottom-12 duration-500 border border-emerald-50">
          <div className="p-6 md:p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-800 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                {isVoiceMode ? <Mic size={20} className={`md:w-6 md:h-6 ${isAgentSpeaking ? 'animate-pulse' : ''}`} /> : <Sparkles size={20} className="md:w-6 md:h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg mono font-mono tracking-tighter">THE GREEN GENIE</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnecting ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-emerald-400/60 font-bold mono">{isConnecting ? 'Syncing...' : 'Secure Protocol ON'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className={`p-2 md:p-2.5 rounded-xl transition ${isMuted ? 'bg-red-500/20 text-red-200' : 'bg-white/5 text-emerald-100/40 hover:text-white hover:bg-white/10'}`}
                title={isMuted ? "Unmute Agent" : "Mute Agent"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={closeSession} className="p-2 md:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition text-emerald-100/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#f8faf9] custom-scrollbar">
            {isCameraActive && (
              <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/20 mb-4 animate-in zoom-in duration-500">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                />
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Neural Vision Link
                </div>
                <button 
                  onClick={stopCameraStreaming}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {notificationStatus?.sent && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 mb-4">
                <div className="bg-emerald-500 rounded-full p-1 text-white">
                  <CircleCheck size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">Transcript Sent</p>
                  <p className="text-[11px] text-emerald-600/80">Calibration data pushed to {notificationStatus.recipient}</p>
                </div>
                <button onClick={() => setNotificationStatus(null)} className="text-emerald-300 hover:text-emerald-500">
                  <X size={14} />
                </button>
              </div>
            )}
            {messages.length === 0 && !isConnecting && (
              <div className="text-center py-6 md:py-10 space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={28} className="md:w-8 md:h-8" />
                </div>
                <h4 className="text-slate-800 font-bold text-lg md:text-xl tracking-tight">Environmental Status?</h4>
                <p className="text-slate-400 text-xs max-w-[240px] mx-auto leading-relaxed">Provide current Temperature and Humidity for a precise VPD calibration.</p>
              </div>
            )}
            
            {isConnecting && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 mono tracking-[0.2em]">Establishing Neural Link...</p>
                  <div className="pt-6 border-t border-emerald-500/10">
                    <p className="text-emerald-800 font-bold uppercase tracking-widest text-[9px]">Age Verification Required</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">You must be 21+ to use this site. By continuing, you verify your age.</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-[2rem] text-sm font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-emerald-900 text-white rounded-tr-none shadow-lg' 
                    : 'bg-white text-slate-700 rounded-tl-none shadow-sm border border-emerald-100/50'
                }`}>
                  {renderMessageText(m.text, m.role)}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-[2rem] bg-white text-slate-700 rounded-tl-none shadow-sm border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mono">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && (
              <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 rounded-2xl text-[11px] font-bold text-emerald-800 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorState && (
            <div className="px-6 md:px-8 py-3 bg-red-50 border-t border-red-100 flex items-center gap-3 text-red-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mono">
              <AlertTriangle size={14} /> {errorState}
              <button onClick={startSession} className="ml-auto underline">Attempt Recalibration</button>
            </div>
          )}

          <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 md:mb-4 animate-in slide-in-from-bottom-2 duration-300">
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl group relative">
                    {file.mimeType.startsWith('image/') ? <ImageIcon size={12} className="text-emerald-600" /> : <FileText size={12} className="text-emerald-600" />}
                    <span className="text-[9px] md:text-[10px] font-bold text-emerald-800 truncate max-w-[80px] md:max-w-[100px]">{file.name}</span>
                    <button onClick={() => removePendingFile(idx)} className="p-0.5 hover:bg-emerald-100 rounded-full text-emerald-400 hover:text-emerald-600">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center gap-2 md:gap-3">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept="image/*,.pdf,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100"
              >
                <Paperclip size={18} className="md:w-5 md:h-5" />
              </button>
              <input 
                type="text"
                placeholder={isUploading ? "Uploading status..." : "Message The Green Genie..."}
                value={inputText}
                disabled={isUploading}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm outline-none focus:border-emerald-200 transition-all font-medium pr-12 md:pr-14 disabled:opacity-50"
              />
              <button 
                onClick={handleChatSubmit}
                disabled={(!inputText.trim() && pendingFiles.length === 0) || isUploading}
                className="absolute right-1.5 md:right-2 p-2 md:p-2.5 bg-emerald-800 text-white rounded-lg md:rounded-xl hover:bg-emerald-900 transition disabled:opacity-50 disabled:grayscale shadow-md"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="md:w-4.5 md:h-4.5" />}
              </button>
            </div>
            <div className="mt-3 md:mt-4 flex justify-between items-center px-1">
               <button 
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${isVoiceMode ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isVoiceMode ? 'bg-emerald-700 animate-pulse' : 'bg-slate-300'}`}></div>
                  {isVoiceMode ? 'Voice Protocol Active' : 'Enable Voice Comms'}
                </button>
                <span className="text-[8px] md:text-[9px] text-slate-300 font-bold uppercase tracking-widest mono font-mono">2026.III.AI</span>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <ConsultationConfirmationModal 
          consultation={pendingConsultation} 
          onConfirm={handleModalConfirm} 
          onCancel={handleModalCancel} 
        />
      )}
    </>
  );
};

export default AIAgent;