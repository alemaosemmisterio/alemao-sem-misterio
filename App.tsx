import React, { useState } from 'react';
import ScenarioSelector from './components/ScenarioSelector';
import PracticeArea from './components/PracticeArea';
import PronunciationTrainer from './components/PronunciationTrainer';
import ModeSelectorModal from './components/ModeSelector';
import OverallFeedbackModal from './components/OverallFeedbackModal';
// Per Gemini API guidelines, API key is handled via environment variables, so direct import is removed.
import type { Scenario, Message, OverallFeedback, PracticeMode, Persona } from './types';
import { startScenario, getOverallFeedback, generateAudio } from './services/geminiService';

type AppState = 'selecting' | 'practicing' | 'feedback' | 'pronunciation';

const personas: Persona[] = [
  { name: 'Alex', voice: 'Kore', formality: 'informal' },
  { name: 'Julia', voice: 'Zephyr', formality: 'informal' },
  { name: 'Herr Schmidt', voice: 'Puck', formality: 'formal' },
  { name: 'Lukas', voice: 'Charon', formality: 'informal' },
  { name: 'Frau Meier', voice: 'Zephyr', formality: 'formal' },
  { name: 'Jonas', voice: 'Fenrir', formality: 'informal' },
];

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-center">
        <div className="sparkle-container mb-4">
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 animate-fade-in">{message}</h2>
    </div>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('selecting');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('chat');
  const [isModeSelectorVisible, setIsModeSelectorVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<OverallFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleScenarioSelect = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    if (scenario.type === 'writing') {
      handleModeSelect('chat');
    } else {
      setIsModeSelectorVisible(true);
    }
  };

  const handleModeSelect = async (mode: PracticeMode) => {
    if (!currentScenario) return;
    
    const selectedPersona = personas[Math.floor(Math.random() * personas.length)];
    setCurrentPersona(selectedPersona);

    setIsModeSelectorVisible(false);
    setLoadingMessage('Preparando o seu cenário...');
    setIsLoading(true);
    setPracticeMode(mode);
    
    try {
        const startMessageText = await startScenario(currentScenario, selectedPersona);
        const audioB64 = await generateAudio(startMessageText, selectedPersona.voice);

        const firstMessage: Message = {
          id: '0',
          role: 'model',
          text: startMessageText,
          avatar: currentScenario.emoji,
          audio_base64: audioB64,
          isAudioLoading: false,
        };
        setMessages([firstMessage]);
        
        setAppState('practicing');
    } catch (error) {
        alert('Ocorreu um erro ao iniciar o cenário. Verifique se sua chave de API está configurada e tente novamente.');
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartPronunciationTrainer = () => {
    setAppState('pronunciation');
  };

  const handleEndSession = async (finalMessages: Message[]) => {
    setLoadingMessage('Preparando o seu relatório de prática...');
    setIsLoading(true);
    setMessages(finalMessages);
    try {
        const feedback = await getOverallFeedback(finalMessages, currentScenario!);
        setOverallFeedback(feedback);
        setAppState('feedback');
    } catch (error) {
        alert('Ocorreu um erro ao gerar o feedback. Tente novamente.');
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const resetState = () => {
    setCurrentScenario(null);
    setCurrentPersona(null);
    setMessages([]);
    setOverallFeedback(null);
    setIsModeSelectorVisible(false);
  }
  
  const handleRestart = () => {
      resetState();
      setAppState('selecting');
  };
  
  const handleExit = () => {
    resetState();
    setAppState('selecting');
  }

  const renderContent = () => {
    if (isLoading) {
        return <LoadingScreen message={loadingMessage} />;
    }
    
    // Per Gemini API guidelines, API key is assumed to be present via environment variables.
    // The check for a placeholder key has been removed.
    
    switch (appState) {
        case 'selecting':
            return <ScenarioSelector onScenarioSelect={handleScenarioSelect} onStartPronunciation={handleStartPronunciationTrainer} />;
        case 'practicing':
             if (currentScenario && currentPersona) {
                return <PracticeArea 
                    scenario={currentScenario} 
                    persona={currentPersona}
                    initialMessages={messages}
                    mode={practiceMode}
                    onEndSession={handleEndSession}
                    onExit={handleExit}
                />;
            }
            return <ScenarioSelector onScenarioSelect={handleScenarioSelect} onStartPronunciation={handleStartPronunciationTrainer} />;
        case 'pronunciation':
            return <PronunciationTrainer onExit={handleExit} />;
        case 'feedback':
            if (currentScenario && currentPersona) {
                return <PracticeArea 
                    scenario={currentScenario}
                    persona={currentPersona}
                    initialMessages={messages}
                    mode={practiceMode}
                    onEndSession={handleEndSession}
                    onExit={handleExit}
                    isReadOnly={true}
                />;
            }
            return <ScenarioSelector onScenarioSelect={handleScenarioSelect} onStartPronunciation={handleStartPronunciationTrainer} />;
        default:
            return <ScenarioSelector onScenarioSelect={handleScenarioSelect} onStartPronunciation={handleStartPronunciationTrainer} />;
    }
  };

  return (
    <div className="font-sans">
      {renderContent()}
      {isModeSelectorVisible && currentScenario && (
        <ModeSelectorModal 
          scenario={currentScenario}
          onSelect={handleModeSelect}
          onClose={() => setIsModeSelectorVisible(false)}
        />
      )}
      {appState === 'feedback' && overallFeedback && (
        <OverallFeedbackModal 
            feedback={overallFeedback}
            onClose={() => setAppState('practicing')}
            onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default App;
