

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPronunciationFeedback, generateAudio } from '../services/geminiService';
import type { PronunciationFeedback, WordFeedbackScore } from '../types';

// ===============================================
// AUDIO HELPERS
// ===============================================
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

const PRONUNCIATION_PHRASES = [
  "Guten Morgen, wie geht es Ihnen?",
  "Ich heiße Alex und komme aus Brasilien.",
  "Können Sie mir bitte helfen?",
  "Wo ist der nächste Bahnhof?",
  "Ich möchte einen Kaffee bestellen.",
  "Das Wetter ist heute sehr schön.",
  "Was kostet das? Das ist zu teuer.",
  "Entschuldigung, ich spreche nur ein bisschen Deutsch.",
  "Auf Wiedersehen, bis bald!",
  "Gestern habe ich meine Freunde getroffen.",
  "Ich wohne in Berlin.",
  "Wie spät ist es?",
  "Ich hätte gern eine Brezel.",
  "Fünf Äpfel, bitte.",
  "Zwanzig Euro und fünfzig Cent.",
  "Mein Zug hat Verspätung.",
  "Ich verstehe das nicht.",
  "Das ist sehr freundlich von Ihnen.",
  "Ich lerne Deutsch seit sechs Monaten.",
  "Meine Hobbys sind Lesen und Schwimmen.",
  "Der Kühlschrank ist leer.",
  "Ich fahre mit dem Fahrrad zur Arbeit.",
  "Herzlichen Glückwunsch zum Geburtstag!",
  "Die Rechnung, bitte.",
  "Gute Besserung!",
  "Ich habe eine Frage.",
  "Das ist eine gute Idee.",
  "Können Sie das bitte wiederholen?",
  "Ich bin müde und möchte schlafen.",
  "Das Essen schmeckt sehr gut.",
  "Ich brauche eine Fahrkarte nach Hamburg.",
  "Wo finde ich eine Apotheke?",
  "Er arbeitet als Ingenieur bei einer großen Firma.",
  "Sie liest gern Bücher in ihrer Freizeit.",
  "Wir gehen am Wochenende ins Kino.",
  "Die Kinder spielen im Garten.",
  "Mein Lieblingsessen ist Pizza.",
  "Ich trinke gern Apfelsaft.",
  "Der Supermarkt schließt um acht Uhr.",
  "Ich muss morgen früh aufstehen."
];

const scoreToColorMap: Record<WordFeedbackScore, { text: string; bg: string; border: string }> = {
    correct: { text: 'text-green-800', bg: 'bg-green-100', border: 'border-green-300' },
    partial: { text: 'text-yellow-800', bg: 'bg-yellow-100', border: 'border-yellow-300' },
    incorrect: { text: 'text-red-800', bg: 'bg-red-100', border: 'border-red-300' },
    unrecognized: { text: 'text-gray-800', bg: 'bg-gray-100', border: 'border-gray-300' },
};

const FeedbackSkeleton: React.FC<{ phrase: string }> = ({ phrase }) => (
    <div className="mt-6 animate-fade-in">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 mb-4 space-y-2">
            <div className="h-5 w-3/4 mx-auto rounded-md shimmer-bg"></div>
            <div className="h-4 w-full mx-auto rounded-md shimmer-bg"></div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
            {phrase.split(' ').map((word, index) => (
                <div key={index} className="h-8 rounded-md shimmer-bg" style={{ width: `${word.length * 0.8 + 1.5}rem`}}></div>
            ))}
        </div>
    </div>
);


interface PronunciationTrainerProps {
    onExit: () => void;
}

const PronunciationTrainer: React.FC<PronunciationTrainerProps> = ({ onExit }) => {
    const [currentPhrase, setCurrentPhrase] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recognitionRef = useRef<any>(null);


    const selectNewPhrase = useCallback(() => {
        setFeedback(null);
        setError(null);
        const randomIndex = Math.floor(Math.random() * PRONUNCIATION_PHRASES.length);
        setCurrentPhrase(PRONUNCIATION_PHRASES[randomIndex]);
    }, []);
    
    const handleApiError = (error: unknown) => {
        setError("Ocorreu um erro na comunicação com a IA. Tente novamente.");
        console.error(error);
    };

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.lang = 'de-DE';
            recognitionInstance.interimResults = false;
            recognitionInstance.maxAlternatives = 1;
            recognitionRef.current = recognitionInstance;
        } else {
            setError("Seu navegador não suporta a API de Reconhecimento de Fala. Este módulo não funcionará.");
        }
        
        selectNewPhrase();

    }, [selectNewPhrase]);

    const playPhraseAudio = async () => {
        if (!currentPhrase || !audioContextRef.current) return;
        setIsLoading(true);
        try {
            const audioB64 = await generateAudio(currentPhrase, 'Zephyr');
            if (audioB64) {
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                const decodedBytes = decode(audioB64);
                const audioBuffer = await decodeAudioData(decodedBytes, ctx);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start();
            } else {
                 setError("Não foi possível gerar o áudio da frase.");
            }
        } catch (e) {
            handleApiError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordToggle = async () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isRecording) {
            recognition.stop();
        } else {
            setFeedback(null);
            setError(null);
            setIsRecording(true);
            recognition.start();
        }

        recognition.onresult = async (event: any) => {
            setIsLoading(true);
            const transcript = event.results[0][0].transcript;
            console.log("Transcript:", transcript);
            try {
                const feedbackResult = await getPronunciationFeedback(currentPhrase, transcript);
                setFeedback(feedbackResult);
            } catch (e) {
                handleApiError(e);
            } finally {
                setIsLoading(false);
            }
        };
        
        recognition.onerror = (event: any) => {
            setError(`Erro no reconhecimento de voz: ${event.error}`);
            setIsRecording(false);
            setIsLoading(false);
        };
        
        recognition.onend = () => {
            setIsRecording(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8 animate-fade-in-up">
            <div className="w-full max-w-3xl">
                <header className="relative text-center mb-8">
                     <button onClick={onExit} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800" title="Voltar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     </button>
                    <h1 className="text-3xl font-bold text-gray-800">Treinar Pronúncia</h1>
                </header>
                
                <main className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">Ouça e repita a frase abaixo:</p>
                        <div className="flex justify-center items-center gap-4 p-4 bg-gray-100 rounded-lg">
                            <h2 className="text-2xl font-semibold text-gray-800 text-center">{currentPhrase}</h2>
                            <button onClick={playPhraseAudio} disabled={isLoading} title="Ouvir a frase" className="p-2 rounded-full hover:bg-gray-200 transition disabled:opacity-50">
                                🔊
                            </button>
                        </div>
                    </div>
                    <div className="my-8 flex flex-col items-center justify-center">
                        <button onClick={handleRecordToggle} disabled={isLoading || !!error} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isRecording ? 'bg-red-500 shadow-lg scale-110 text-white' : 'bg-german-gold text-german-black hover:bg-yellow-400'} disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none`}>
                            {isLoading && !isRecording ? 
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div> :
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            }
                        </button>
                        <p className="mt-3 text-sm text-gray-500">{isRecording ? "Gravando... Clique para parar." : (isLoading ? "Analisando..." : "Pressione para gravar")}</p>
                    </div>

                    {isLoading && !feedback && <FeedbackSkeleton phrase={currentPhrase} />}

                    {!isLoading && error && <div className="text-center p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                    {!isLoading && feedback && (
                        <div className="mt-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-center mb-4 text-gray-800">Seu Feedback</h3>
                             <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                                <p className="font-semibold text-blue-800">Pontuação Geral: {feedback.overallScore}%</p>
                                <p className="text-sm text-blue-700 mt-1">{feedback.feedbackSummary}</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {feedback.words.map((wordFeedback, index) => {
                                    const colors = scoreToColorMap[wordFeedback.score];
                                    return (
                                        <div key={index} className={`p-2 rounded-md border ${colors.bg} ${colors.border}`}>
                                            <p className={`font-semibold text-lg ${colors.text}`}>{wordFeedback.word}</p>
                                            {wordFeedback.tip && <p className={`text-xs mt-1 ${colors.text}`}>{wordFeedback.tip}</p>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <button onClick={selectNewPhrase} className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-gray-700 hover:bg-gray-800 transition-colors">
                            Nova Frase
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PronunciationTrainer;
