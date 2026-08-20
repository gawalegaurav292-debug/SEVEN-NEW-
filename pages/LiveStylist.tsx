import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, ArrowLeft, Mic, MicOff, Lock, Radio, Target, Fingerprint, Cpu, X } from 'lucide-react';
import { connectLiveStylist } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

export const LiveStylist: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
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

  const startSession = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = connectLiveStylist({
        onopen: () => {
          setIsActive(true);
          setIsConnecting(false);
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e: any) => {
            if (isMuted || !isActive) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const base64Data = encode(new Uint8Array(int16.buffer));
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (message: any) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }
          
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => {
          setIsActive(false);
          setIsConnecting(false);
        },
        onerror: (e: any) => {
          console.error("Live Error:", e);
          setIsActive(false);
          setIsConnecting(false);
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close?.();
    inputAudioContextRef.current?.close?.();
    outputAudioContextRef.current?.close?.();
    setIsActive(false);
    navigate('/stylist');
  };

  return (
    <div className="fixed inset-0 bg-white text-black flex flex-col items-center justify-center z-[9999] overflow-hidden">
      <div className="absolute top-12 left-12 flex items-center gap-4 text-black/20">
        <Cpu size={18} strokeWidth={1} />
        <span className="text-[10px] font-light uppercase tracking-[0.8em]">Authority Voice Protocol</span>
      </div>
      
      <button onClick={stopSession} className="absolute top-12 right-12 p-4 border border-black/5 rounded-full hover:bg-black hover:text-white transition-all">
        <X size={24} strokeWidth={1} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center">
        <div className="relative mb-32">
           <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[2000ms] ${isActive ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}>
              <div className="w-80 h-80 rounded-full border border-black/5 animate-ping" style={{ animationDuration: '4s' }}></div>
           </div>

           <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-1000 relative z-20 ${isActive ? 'bg-black shadow-2xl scale-110' : 'bg-white border border-black/5'}`}>
              {isActive ? (
                <div className="flex items-center gap-3 h-12">
                   {[...Array(8)].map((_, i) => (
                     <div 
                       key={i} 
                       className="w-[1px] bg-white animate-bounce" 
                       style={{ animationDelay: `${i * 100}ms`, height: `${40 + Math.random() * 60}%` }}
                     ></div>
                   ))}
                </div>
              ) : (
                <Radio size={48} strokeWidth={1} className="text-black/5" />
              )}
              {isConnecting && <div className="absolute inset-0 rounded-full border-t border-black animate-spin"></div>}
           </div>
        </div>

        <div className="space-y-8 px-8">
          <h2 className="text-5xl font-extralight tracking-telegraphic leading-none">
            {isActive ? "Live Session." : "Authorize Voice."}
          </h2>
          <p className="text-black/30 text-lg font-light leading-relaxed italic">
            {isActive ? "SÉVEN is listening. Speak freely." : "Encrypted handshake required for real-time consultation."}
          </p>

          {!isActive ? (
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="w-full py-10 border border-black text-black rounded-full text-sm font-light uppercase tracking-[0.8em] transition-all hover:bg-black hover:text-white mt-12"
            >
              {isConnecting ? "ESTABLISHING..." : "INITIATE CONNECTION"}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-12 mt-16">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-20 h-20 rounded-full border transition-all flex items-center justify-center ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'border-black/5 hover:border-black'}`}
              >
                {isMuted ? <MicOff size={28} strokeWidth={1} /> : <Mic size={28} strokeWidth={1} />}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-4 opacity-5">
        <Fingerprint size={24} strokeWidth={1} />
        <p className="text-[10px] uppercase tracking-[1em] font-light">Authorized Personnel Only</p>
      </div>
    </div>
  );
};