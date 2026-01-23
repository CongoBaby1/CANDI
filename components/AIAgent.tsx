
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mic, Send, X, Sparkles, CircleCheck, AlertTriangle, RefreshCcw, Loader2, ExternalLink } from 'lucide-react';
import { 
  startLiveSession, 
  generateChatResponse, 
  base64ToUint8Array, 
  decodeAudioData, 
  floatToPcm 
} from '../services/geminiService';
import { BUSINESS_INFO } from '../constants';
import { Technician } from '../types';

interface AIAgentProps {
  onAdminAuth: (phrase: string) => void;
  onNewBooking: (booking: any) => void;
  onNewLead: (lead: any) => void;
  team?: Technician[];
}

const BookingConfirmationModal = ({ booking, onConfirm, onCancel }: { booking: any, onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-10">
        <div className="flex justify-between items-start mb-8">
          <div className="p-4 bg-green-50 rounded-3xl text-green-500 shadow-sm border border-green-100">
            <CircleCheck size={32} />
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
        </div>
        <h2 className="text-3xl font-bold mb-4 font-serif text-slate-900">Confirm Booking</h2>
        <div className="bg-slate-50 p-6 rounded-3xl space-y-4 mb-8 text-sm border border-slate-100">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Name</p>
              <p className="font-bold text-slate-800">{booking.first_name}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Nail tech</p>
              <p className="font-bold text-slate-800">{booking.tech}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Service</p>
              <p className="font-bold text-slate-800">{booking.service}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Appointment</p>
              <p className="font-bold text-slate-800">{booking.date} at {booking.time}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Phone</p>
              <p className="font-bold text-slate-800 truncate">{booking.phone}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-1">Email</p>
              <p className="font-bold text-slate-800 truncate">{booking.email}</p>
            </div>
          </div>
        </div>
        <button onClick={onConfirm} className="w-full bg-pink-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-pink-700 transition shadow-xl shadow-pink-100">All Correct</button>
      </div>
    </div>
  </div>
);

const AIAgent: React.FC<AIAgentProps> = ({ onAdminAuth, onNewBooking, onNewLead, team = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>({});
  const [errorState, setErrorState] = useState<string | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const userTranscriptionRef = useRef("");
  const modelTranscriptionRef = useRef("");
  const chatHistoryRef = useRef<any[]>([]);
  const isVoiceActiveRef = useRef(true);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const isPendingTerminationRef = useRef(false);
  const isPendingBookingModalRef = useRef(false);

  const teamNames = team.map(t => t.name);

  useEffect(() => { chatHistoryRef.current = messages; }, [messages]);
  useEffect(() => { isVoiceActiveRef.current = isVoiceMode; }, [isVoiceMode]);

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const closeSession = useCallback(() => {
    setIsAgentSpeaking(false);
    stopAllAudio();
    isPendingTerminationRef.current = false;
    isPendingBookingModalRef.current = false;
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => { try { s.close(); } catch {} });
      sessionPromiseRef.current = null;
    }
    setIsOpen(false);
  }, [stopAllAudio]);

  const addMessage = (role: 'user' | 'agent', text: string, sources: any[] = []) => {
    if (!text.trim()) return;
    const newMessage = { id: Math.random().toString(36), role, text, sources, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);

    const normalized = (t: string) => t.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    if (normalized(text) === normalized(BUSINESS_INFO.adminPhrase)) {
      onAdminAuth(BUSINESS_INFO.adminPhrase);
    }
  };

  const startSession = async () => {
    setErrorState(null);
    setIsConnecting(true);
    isPendingTerminationRef.current = false;
    isPendingBookingModalRef.current = false;
    
    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!inputAudioContextRef.current) inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

      const sessionPromise = startLiveSession({
        onopen: async () => {
          try {
            const stream = await streamPromise;
            const session = await sessionPromise;
            setIsConnecting(false);
            setIsAgentSpeaking(true);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current!.createScriptProcessor(1024, 1, 1);
            processor.onaudioprocess = (e) => {
              if (!isVoiceActiveRef.current) return;
              const pcmBlob = floatToPcm(e.inputBuffer.getChannelData(0));
              session.sendRealtimeInput({ media: pcmBlob });
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);
            
            session.sendRealtimeInput({ 
              text: "CONVERSATION_START: Please state your official opening statement exactly as defined in your instructions." 
            });
          } catch (micErr) {
            setErrorState("Microphone access denied.");
            setIsConnecting(false);
          }
        },
        onmessage: async (msg: any) => {
          if (msg.toolCall) {
            for (const fc of msg.toolCall.functionCalls) {
              if (fc.name === "requestBookingConfirmation") {
                setPendingBooking({ ...fc.args, toolCallId: fc.id });
                if (activeSourcesRef.current.size === 0) {
                  setShowConfirmModal(true);
                  setIsAgentSpeaking(false);
                } else {
                  isPendingBookingModalRef.current = true;
                }
              } else if (fc.name === "terminateSession") {
                if (activeSourcesRef.current.size === 0) {
                  closeSession();
                } else {
                  isPendingTerminationRef.current = true;
                }
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
              
              if (isPendingBookingModalRef.current && activeSourcesRef.current.size === 0) {
                isPendingBookingModalRef.current = false;
                setShowConfirmModal(true);
                setIsAgentSpeaking(false);
              }

              if (isPendingTerminationRef.current && activeSourcesRef.current.size === 0) {
                setTimeout(closeSession, 200);
              }
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            activeSourcesRef.current.add(source);
          }

          if (msg.serverContent?.interrupted) stopAllAudio();
          if (msg.serverContent?.outputTranscription) modelTranscriptionRef.current += msg.serverContent.outputTranscription.text;
          else if (msg.serverContent?.inputTranscription) userTranscriptionRef.current += msg.serverContent.inputTranscription.text;

          if (msg.serverContent?.turnComplete) {
            if (userTranscriptionRef.current) { addMessage('user', userTranscriptionRef.current); userTranscriptionRef.current = ""; }
            if (modelTranscriptionRef.current) {
              const text = modelTranscriptionRef.current;
              addMessage('agent', text);
              modelTranscriptionRef.current = "";
            }
          }
        },
        onerror: (e: any) => { 
          setErrorState("AI Service Unavailable. Please check your connection.");
          setIsConnecting(false);
        },
        onclose: () => { 
          setIsConnecting(false); 
        }
      }, teamNames);
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      setErrorState("Connection failed.");
      setIsConnecting(false);
    }
  };

  const toggleOpen = () => {
    if (isOpen) { closeSession(); return; }
    setIsOpen(true);
    setIsVoiceMode(true);
    startSession();
  };

  const handleChatSubmit = async () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setInputText("");
    addMessage('user', msg);
    if (isVoiceMode) { setIsVoiceMode(false); stopAllAudio(); }
    try {
      const response = await generateChatResponse(msg, chatHistoryRef.current, teamNames);
      addMessage('agent', response.text, response.sources);
    } catch (err) {
      addMessage('agent', "I'm having a bit of trouble connecting. Try again?");
    }
  };

  const handleModalConfirm = async () => {
    onNewBooking(pendingBooking);
    setShowConfirmModal(false);
    
    if (sessionPromiseRef.current && pendingBooking.toolCallId) {
      const session = await sessionPromiseRef.current;
      session.sendToolResponse({
        functionResponses: [{
          id: pendingBooking.toolCallId,
          name: "requestBookingConfirmation",
          response: { result: "Success. The user clicked 'All Correct'. Now follow POST-CONFIRMATION instructions: say 'Perfect! Your appointment has been successfully booked. Is there anything else I can help you with?'" }
        }]
      });
    } else {
      addMessage('agent', "Perfect! Your appointment has been successfully booked. Is there anything else I can help you with?");
    }
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[60]">
        {isOpen ? (
          <div className="w-[350px] md:w-[420px] h-[650px] glass rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(219,39,119,0.3)] border border-white/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-pink-600 p-8 flex justify-between items-center text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-lg tracking-tight">Candi Nails & Spa:</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <p className="text-[9px] uppercase font-black tracking-widest opacity-90">{isVoiceMode ? "Voice Agent Active" : "Chat Mode"}</p>
                  </div>
                </div>
              </div>
              <button onClick={closeSession} className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scroll-smooth">
              {messages.length === 0 && !isConnecting && !errorState && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Sparkles size={40} className="text-pink-300" />
                  <p className="text-sm font-medium italic font-serif text-slate-400">"Hey Love. How can I help you?"</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-slate-900 text-white rounded-br-none shadow-lg' : 'bg-white border border-pink-100/50 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 px-2">
                      {m.sources.map((s: any, idx: number) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-pink-300 hover:text-pink-500 transition shadow-sm">
                          <ExternalLink size={10} /> {s.title || 'Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isConnecting && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 size={32} className="text-pink-500 animate-spin" />
                  <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.3em] animate-pulse">Establishing Link...</p>
                </div>
              )}
              {errorState && (
                <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 flex flex-col items-center gap-4 text-center animate-in shake">
                  <AlertTriangle size={32} className="text-red-500" />
                  <p className="text-xs text-red-800 font-medium">{errorState}</p>
                  <button onClick={startSession} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg">
                    <RefreshCcw size={14} /> Reconnect
                  </button>
                </div>
              )}
              <div id="messages-end"></div>
            </div>

            <div className="p-6 bg-white/80 border-t border-pink-50/50 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-slate-100/80 p-2 rounded-2xl border border-slate-200/50">
                <button 
                  onClick={() => {
                    if (isVoiceMode) { setIsVoiceMode(false); stopAllAudio(); }
                    else { setIsVoiceMode(true); startSession(); }
                  }} 
                  className={`p-4 rounded-xl transition-all duration-300 ${isVoiceMode ? 'bg-pink-600 text-white shadow-lg rotate-0' : 'text-slate-500 hover:bg-slate-200 rotate-12'}`}
                >
                  <Mic size={20} />
                </button>
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()} 
                  placeholder="Ask me anything..." 
                  className="flex-1 bg-transparent text-sm font-medium outline-none px-3" 
                />
                <button 
                  onClick={handleChatSubmit} 
                  disabled={!inputText.trim()}
                  className="p-4 bg-slate-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-30"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={toggleOpen} 
            className="group relative w-20 h-20 bg-pink-600 rounded-full shadow-[0_15px_40px_-5px_rgba(219,39,119,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-500 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-700 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles className="text-white relative z-10" size={32} />
          </button>
        )}
      </div>
      {showConfirmModal && (
        <BookingConfirmationModal 
          booking={pendingBooking} 
          onConfirm={handleModalConfirm} 
          onCancel={() => setShowConfirmModal(false)} 
        />
      )}
    </>
  );
};

export default AIAgent;
