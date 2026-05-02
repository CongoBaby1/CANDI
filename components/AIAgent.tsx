
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mic, Send, X, Sparkles, CircleCheck, AlertTriangle, RefreshCcw, Loader2, Zap, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { 
  startLiveSession, 
  generateChatResponse, 
  base64ToUint8Array, 
  decodeAudioData, 
  floatToPcm,
  FileAttachment
} from '../services/geminiService';
import { BUSINESS_INFO } from '../constants';
import { Cultivator } from '../types';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{sent: boolean, recipient: string} | null>(null);
  const [pendingConsultation, setPendingConsultation] = useState<any>({});
  const [errorState, setErrorState] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { chatHistoryRef.current = messages; }, [messages]);
  useEffect(() => { isVoiceActiveRef.current = isVoiceMode; }, [isVoiceMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isConnecting, isAgentSpeaking]);

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
  }, []);

  const closeSession = useCallback(() => {
    setIsAgentSpeaking(false);
    stopAllAudio();
    cleanupAudioNodes();
    isPendingTerminationRef.current = false;
    isPendingModalRef.current = false;
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => { try { s.close(); } catch {} });
      sessionPromiseRef.current = null;
    }
    setIsOpen(false);
  }, [stopAllAudio, cleanupAudioNodes]);

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
    setMessages(prev => [...prev, newMessage]);
    checkSecretPhrase(text);
  }, [checkSecretPhrase]);

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => 
        part.startsWith('**') && part.endsWith('**') 
          ? <strong key={j} className="font-bold text-emerald-800">{part.slice(2, -2)}</strong> 
          : part
      );
      
      return (
        <div key={i} className={`min-h-[1.2em] ${line.trim().startsWith('-') ? 'pl-2' : ''}`}>
          {parts}
        </div>
      );
    });
  };

  const startSession = async () => {
    setErrorState(null);
    setIsConnecting(true);
    isPendingTerminationRef.current = false;
    isPendingModalRef.current = false;
    isSessionLiveRef.current = false;
    cleanupAudioNodes();
    
    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!inputAudioContextRef.current) inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      try { await inputAudioContextRef.current.resume(); } catch (e) {}
      try { await outputAudioContextRef.current.resume(); } catch (e) {}

      const sessionPromise = startLiveSession({
        onopen: async () => {
          setIsConnecting(false);
          try {
            const stream = await streamPromise;
            if (!sessionPromiseRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
            microphoneStreamRef.current = stream;
            setIsAgentSpeaking(true);
            isSessionLiveRef.current = true;
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputAudioContextRef.current!.createScriptProcessor(1024, 1, 1);
            processorNodeRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (!isSessionLiveRef.current || !isVoiceActiveRef.current) return;
              try {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = floatToPcm(inputData);
                sessionPromise.then((session) => {
                  if (!isSessionLiveRef.current) return;
                  try { session.sendRealtimeInput({ audio: pcmBlob }); } catch (err) { }
                });
              } catch (err) { isSessionLiveRef.current = false; }
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);
            
            sessionPromise.then((session) => {
              try { session.sendRealtimeInput({ text: "SYSTEM_START" }); } catch (e) { }
            });
          } catch (micErr) {
            setErrorState("Hardware link denied.");
            setIsConnecting(false);
            cleanupAudioNodes();
          }
        },
        onmessage: async (msg: any) => {
          if (msg.toolCall) {
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
                
                // Clear notification status after 5 seconds
                setTimeout(() => setNotificationStatus(null), 5000);

                // Send tool response to model
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
              }
            }
          }

          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData && outputAudioContextRef.current && isVoiceActiveRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
            const buffer = await decodeAudioData(base64ToUint8Array(audioData), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(outputAudioContextRef.current.destination);
            source.addEventListener('ended', () => { 
              activeSourcesRef.current.delete(source);
              if (isPendingModalRef.current && activeSourcesRef.current.size === 0) {
                isPendingModalRef.current = false; setShowConfirmModal(true); setIsAgentSpeaking(false);
              }
              if (isPendingTerminationRef.current && activeSourcesRef.current.size === 0) setTimeout(closeSession, 200);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            activeSourcesRef.current.add(source);
          }

          if (msg.serverContent?.interrupted) stopAllAudio();
          if (msg.serverContent?.inputTranscription) {
            userTranscriptionRef.current += msg.serverContent.inputTranscription.text;
            checkSecretPhrase(userTranscriptionRef.current);
          }
          if (msg.serverContent?.outputTranscription) modelTranscriptionRef.current += msg.serverContent.outputTranscription.text;

          if (msg.serverContent?.turnComplete) {
            if (userTranscriptionRef.current) { addMessage('user', userTranscriptionRef.current); userTranscriptionRef.current = ""; }
            if (modelTranscriptionRef.current) { addMessage('agent', modelTranscriptionRef.current); modelTranscriptionRef.current = ""; }
          }
        },
        onerror: (err: any) => { 
            setErrorState("Consultant offline."); 
            setIsConnecting(false); 
            cleanupAudioNodes(); 
        },
        onclose: () => { 
            isSessionLiveRef.current = false; 
            setIsConnecting(false); 
            cleanupAudioNodes(); 
        }
      });
      
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      setErrorState("Uplink failed.");
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
      
      setIsOpen(true); 
      setIsVoiceMode(true); 
      startSession(); 
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
    addMessage('user', msg + (attachments.length > 0 ? ` [Attached: ${attachments.map(f => f.name).join(', ')}]` : ""));
    
    if (isVoiceMode) { setIsVoiceMode(false); stopAllAudio(); cleanupAudioNodes(); }
    try {
      const response = await generateChatResponse(msg, chatHistoryRef.current, attachments);
      addMessage('agent', response.text);
    } catch (err) { addMessage('agent', "Protocol link interrupted."); }
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

  return (
    <>
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-white px-4 md:px-5 py-2 md:py-2.5 rounded-2xl rounded-br-sm shadow-xl border border-emerald-100 animate-in slide-in-from-bottom-4 fade-in duration-700 mb-1 relative group cursor-pointer" onClick={toggleOpen}>
             <p className="mono font-mono font-bold text-emerald-800 text-[10px] md:text-sm whitespace-nowrap pr-1 uppercase tracking-tighter">YOU ASK, I TELL!</p>
          </div>
        )}
        <button 
          onClick={toggleOpen}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group ${isOpen ? 'bg-emerald-950 text-white rotate-90' : 'bg-emerald-800 text-white hover:scale-110 hover:shadow-emerald-200'}`}
        >
          {isOpen ? <X size={28} /> : <div className="relative"><Mic size={28} className="md:w-8 md:h-8" /><div className="absolute inset-0 bg-emerald-400 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div></div>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-32 md:right-8 z-[60] w-full md:w-[450px] md:h-[700px] bg-white md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in md:slide-in-from-bottom-12 duration-500 border border-emerald-50">
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
            <button onClick={closeSession} className="p-2 md:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition text-emerald-100/40 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#f8faf9] custom-scrollbar">
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
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 mono tracking-[0.2em]">Establishing Neural Link...</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-[2rem] text-sm font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-emerald-900 text-white rounded-tr-none shadow-lg' 
                    : 'bg-white text-slate-700 rounded-tl-none shadow-sm border border-emerald-100/50'
                }`}>
                  {renderMessageText(m.text)}
                </div>
              </div>
            ))}
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
                placeholder={isUploading ? "Uploading status..." : "Message Green Genie..."}
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
