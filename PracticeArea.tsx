import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage, Modality, Blob } from '@google/genai';
import type { Scenario, Message, Feedback, PracticeMode, Persona } from './types';
import { continueConversation, getInlineFeedback, generateAudio, translateText, getSuggestion, ai } from './geminiService';
import FeedbackModal from './FeedbackModal';

type LiveSession = Awaited<ReturnType<typeof ai.live.connect>>;


// ===============================================
// AUDIO HELPERS
// ===============================================

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const numChannels = 1;
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

// ===============================================
// CHILD COMPONENTS
// ===============================================

const MessageBubble: React.FC<{ message: Message, onGetFeedback: (messageId: string, text: string) => void, onReplayAudio: (audio_base64: string) => void, onTranslate: (messageId: string, text: string) => void }> = ({ message, onGetFeedback, onReplayAudio, onTranslate }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
          {message.avatar}
        </div>
      )}

      <div className={`max-w-md md:max-w-lg p-3 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-lg'}`}>
        <p className="text-base whitespace-pre-wrap">{message.text || <span className="text-gray-400 italic">...</span>}</p>

        {message.translation && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                <p className="text-sm text-gray-600">{message.translation}</p>
            </div>
        )}
        
        <div className="flex items-center mt-2 space-x-4">
            {message.isAudioLoading && (
                <div className="p-1 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {message.audio_base64 && !message.isAudioLoading && (
              <button onClick={() => onReplayAudio(message.audio_base64!)} className={`flex items-center space-x-1.5 p-1 rounded-full transition ${isUser ? 'text-blue-100 hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`} title="Ouvir fala">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
              </button>
            )}

            {!isUser && message.text && !message.translation && (
                 <button 
                    onClick={() => onTranslate(message.id, message.text)} 
                    disabled={message.isTranslating}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-70 disabled:cursor-wait font-medium"
                    title="Traduzir"
                >
                    {message.isTranslating ? 'Traduzindo...' : 'Traduzir 🇧🇷'}
                </button>
            )}
        </div>
      </div>

       {isUser && !message.feedback && message.text && (
          <button onClick={() => onGetFeedback(message.id, message.text)} className="text-xs mb-1 bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors" title="Ver Feedback desta frase">
           🔍 
          </button>
        )}
    </div>
  );
};

const ChatInput: React.FC<{ 
    isLoading: boolean; 
    onSendMessage: () => void; 
    isReadOnly: boolean;
    value: string;
    onChange: (value: string) => void;
}> = ({ isLoading, onSendMessage, isReadOnly, value, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSendMessageClick = () => {
        if (value.trim() && !isLoading && !isReadOnly) {
            onSendMessage();
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${e.target.scrollHeight}px`;
        }
    };

    return (
        <div className="flex items-end space-x-3">
            <textarea 
                ref={textareaRef}
                value={value} 
                onChange={handleInputChange} 
                placeholder="Digite sua mensagem em alemão..." 
                className="flex-grow w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none overflow-y-hidden" 
                rows={1}
                disabled={isLoading || isReadOnly} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessageClick();
                    }
                }}
            />
            <button onClick={handleSendMessageClick} disabled={isLoading || !value.trim() || isReadOnly} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 self-end" title="Enviar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </div>
    );
};

const VoiceInput: React.FC<{ isRecording: boolean; onToggleRecording: () => void; isReadOnly: boolean }> = ({ isRecording, onToggleRecording, isReadOnly }) => (
    <div className="flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 mb-3">{isReadOnly ? "Aguarde..." : (isRecording ? "Gravando... Clique para enviar." : "Pressione para falar")}</p>
        <button onClick={onToggleRecording} disabled={isReadOnly} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isRecording ? 'bg-red-500 shadow-lg scale-110 text-white' : 'bg-german-gold text-german-black hover:bg-yellow-400'} disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </button>
    </div>
);

const SuggestionBox: React.FC<{ 
    suggestions: string[]; 
    isLoading: boolean;
    onSelect: (suggestion: string) => void;
    onClose: () => void;
    mode: PracticeMode;
}> = ({ suggestions, isLoading, onSelect, onClose, mode }) => {
    return (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm text-yellow-900">Sugestões:</h4>
                <button onClick={onClose} className="text-yellow-700 hover:text-yellow-900 text-xl">&times;</button>
            </div>
            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-9 w-full rounded-md shimmer-bg"></div>
                    <div className="h-9 w-full rounded-md shimmer-bg"></div>
                </div>
            ) : (
                <div className="space-y-2">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => onSelect(s)}
                            className="w-full text-left text-sm p-2 bg-white rounded-md hover:bg-yellow-100 transition"
                        >
                            {s} {mode === 'chat' && <span className="text-xs text-gray-500 ml-1">(clique para usar)</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ===============================================
// MAIN COMPONENT
// ===============================================

interface PracticeAreaProps {
  scenario: Scenario;
  persona: Persona;
  initialMessages: Message[];
  mode: PracticeMode;
  onEndSession: (messages: Message[]) => void;
  onExit: () => void;
  isReadOnly?: boolean;
}

const PracticeArea: React.FC<PracticeAreaProps> = ({ scenario, persona, initialMessages, mode, onEndSession, onExit, isReadOnly = false }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const currentUserMessageIdRef = useRef<string | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentModelMessageIdRef = useRef<string | null>(null);
  const currentOutputTranscriptionRef = useRef('');

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (!outputAudioContextRef.current || !base64Audio) return;
    try {
      const ctx = outputAudioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
        console.error("Audio playback failed:", e);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages.length, scrollToBottom]);
  
  const handleApiError = (error: unknown) => {
    alert("Ocorreu um erro na comunicação com a IA. Verifique se sua chave de API está atualizada na Netlify e tente novamente.");
    console.error(error);
  };

  const handleSendMessage = async () => {
    const text = chatInputValue.trim();
    if (!text) return;

    setIsLoading(true);
    setChatInputValue('');
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    try {
        const modelResponseText = await continueConversation(currentMessages, scenario, persona);
        
        const modelMessageId = (Date.now() + 1).toString();
        const modelMessage: Message = {
          id: modelMessageId, 
          role: 'model', 
          text: modelResponseText, 
          avatar: scenario.emoji,
          isAudioLoading: true, 
        };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);

        const audioB64 = await generateAudio(modelResponseText, persona.voice);
        setMessages(prev => prev.map(m => 
            m.id === modelMessageId 
                ? { ...m, audio_base64: audioB64, isAudioLoading: false } 
                : m
        ));
        
        if (audioB64) {
          playAudio(audioB64);
        }
    } catch (error) {
        handleApiError(error);
        setIsLoading(false);
        setMessages(messages);
    }
  };

  const handleGetSuggestions = async () => {
    setShowSuggestions(true);
    setIsSuggestionLoading(true);
    try {
        const suggestionResult = await getSuggestion(messages, scenario);
        setSuggestions(suggestionResult);
    } catch (error) {
        handleApiError(error);
        setShowSuggestions(false);
    } finally {
        setIsSuggestionLoading(false);
    }
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
      if (mode === 'chat') {
          setChatInputValue(suggestion);
      }
      setShowSuggestions(false);
  };

  const handleGetFeedback = async (messageId: string, text: string) => {
    try {
        const feedback = await getInlineFeedback(text);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
        setSelectedFeedback(feedback);
    } catch (error) {
        handleApiError(error);
    }
  };

  const handleTranslateMessage = async (messageId: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTranslating: true } : m));
    try {
        const translation = await translateText(text);
        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? { ...m, translation, isTranslating: false }
                : m
        ));
    } catch (error) {
        handleApiError(error);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTranslating: false } : m));
    }
  };

  useEffect(() => {
    if (mode !== 'conversation' || isReadOnly) return;
    
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    currentModelMessageIdRef.current = null;
    currentUserMessageIdRef.current = null;
    
    const setupAudio = async () => {
      try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        if (!outputAudioContextRef.current) outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("O acesso ao microfone é necessário para o modo de conversa. Por favor, habilite nas configurações do seu navegador.");
        onExit();
      }
    };
    
    const startLiveSession = async () => {
        await setupAudio();
        if (!scriptProcessorRef.current) return;
        
        try {
            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voice } },
                    },
                    systemInstruction: `Você é ${persona.name}, um tutor de alemão, interpretando o papel de "${scenario.persona}". Converse em ALEMÃO com um aluno A1, usando um tom ${persona.formality === 'formal' ? 'formal (Sie)' : 'informal (du)'}. Mantenha as respostas curtas e simples.`,
                },
                callbacks: {
                    onopen: () => console.log('Live session opened.'),
                    onclose: () => console.log('Live session closed.'),
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        handleApiError(e);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            if (currentUserMessageIdRef.current) {
                               setMessages(prev => prev.map(m => m.id === currentUserMessageIdRef.current ? { ...m, text: currentInputTranscriptionRef.current } : m));
                            }
                        }
                        if (message.serverContent?.outputTranscription) {
                            if (!currentModelMessageIdRef.current) {
                                const newModelId = `model-${Date.now()}`;
                                currentModelMessageIdRef.current = newModelId;
                                const newModelMessage: Message = { id: newModelId, role: 'model', text: '', avatar: scenario.emoji };
                                setMessages(prev => [...prev, newModelMessage]);
                            }
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            setMessages(prev => prev.map(m => m.id === currentModelMessageIdRef.current ? { ...m, text: currentOutputTranscriptionRef.current } : m));
                        }
                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const ctx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        if (message.serverContent?.turnComplete) {
                            if (!currentUserMessageIdRef.current) {
                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                                currentModelMessageIdRef.current = null;
                            }
                        }
                    }
                }
            });
            await sessionPromise.current;
        } catch (error) {
            handleApiError(error);
        }
    }
    startLiveSession();
    
    return () => { 
      sessionPromise.current?.then(session => session.close());
      mediaStreamSourceRef.current?.mediaStream.getTracks().forEach(track => track.stop());
      scriptProcessorRef.current?.disconnect();
      mediaStreamSourceRef.current?.disconnect();
      audioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };

  }, [mode, isReadOnly, scenario.persona, onExit, persona]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      if (scriptProcessorRef.current && mediaStreamSourceRef.current) {
        currentInputTranscriptionRef.current = ''; 
        const newId = `user-speaking-${Date.now()}`;
        currentUserMessageIdRef.current = newId;
        setMessages(prev => [...prev, { id: newId, role: 'user', text: '' }]);

        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
          const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
          sessionPromise.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };
        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(audioContextRef.current!.destination); 
        setIsRecording(true);
      }
    } else {
      if (scriptProcessorRef.current && mediaStreamSourceRef.current) {
        scriptProcessorRef.current.onaudioprocess = null; 
        scriptProcessorRef.current.disconnect();
        mediaStreamSourceRef.current.disconnect();
        currentUserMessageIdRef.current = null; 
        setIsRecording(false);
      }
    }
  };
  
  const isInputDisabled = isReadOnly;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
            <button onClick={onExit} className="mr-4 text-gray-500 hover:text-gray-800" title="Voltar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
                <h2 className="font-bold text-lg text-gray-800">{scenario.title}</h2>
                <p className="text-sm text-gray-500">Nível {scenario.level} ({mode === 'chat' ? 'Chat' : 'Conversa'})</p>
            </div>
        </div>
        <div>
          <button onClick={() => onEndSession(messages)} disabled={isReadOnly} className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-german-red hover:bg-red-700 transition-colors disabled:bg-red-300">
            Encerrar Conversa
          </button>
        </div>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-6">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} onGetFeedback={handleGetFeedback} onReplayAudio={playAudio} onTranslate={handleTranslateMessage} />
          ))}
          {isLoading && mode === 'chat' && (
               <div className="flex items-end gap-2 justify-start animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">{scenario.emoji}</div>
                    <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-200 rounded-bl-lg w-28">
                       <div className="h-4 w-full rounded-md shimmer-bg"></div>
                    </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      <footer className="p-4 bg-white border-t border-gray-200">
        {showSuggestions && (
            <SuggestionBox 
                suggestions={suggestions} 
                isLoading={isSuggestionLoading} 
                onSelect={handleSuggestionSelect} 
                onClose={() => setShowSuggestions(false)}
                mode={mode}
            />
        )}
        <div className="flex items-center space-x-3">
             <button onClick={handleGetSuggestions} disabled={isInputDisabled || isSuggestionLoading} className="p-3 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 rounded-full transition-colors disabled:opacity-50" title="Pedir sugestão">
                💡
            </button>
            <div className="flex-grow">
                {mode === 'chat' ? (
                    <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} isReadOnly={isInputDisabled} value={chatInputValue} onChange={setChatInputValue} />
                ) : (
                    <VoiceInput isRecording={isRecording} onToggleRecording={handleToggleRecording} isReadOnly={isInputDisabled} />
                )}
            </div>
        </div>
      </footer>

      {selectedFeedback && <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />}
    </div>
  );
};

export default PracticeArea;