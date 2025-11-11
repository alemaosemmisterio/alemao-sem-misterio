import React, { useState } from 'react';
import { SCENARIOS } from './constants';
import type { Scenario } from './types';

interface ScenarioSelectorProps {
  onScenarioSelect: (scenario: Scenario) => void;
  onStartPronunciation: () => void;
}

const ScenarioCard: React.FC<{ scenario: Scenario; onSelect: () => void }> = ({ scenario, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const accentColors = ['border-german-black', 'border-german-red', 'border-german-gold'];
  const randomAccent = accentColors[Math.floor(Math.random() * accentColors.length)];

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full text-left p-6 bg-white rounded-xl shadow-md border-2 ${isHovered ? randomAccent : 'border-transparent'} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-german-gold`}
    >
      <div className="flex items-start">
        <div className="text-4xl mr-5 mt-1">{scenario.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <h3 className="font-bold text-lg text-gray-800 mr-2">{scenario.title}</h3>
          </div>
          <p className="text-gray-600 text-sm">{scenario.description}</p>
          {scenario.type === 'writing' && (
             <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Apenas Escrita
              </span>
          )}
        </div>
      </div>
    </button>
  );
};

const PronunciationCard: React.FC<{ onSelect: () => void }> = ({ onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="md:col-span-2 lg:col-span-3 w-full text-left p-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-german-gold"
    >
       <div className="flex items-center">
        <div className="text-4xl mr-5">🔊</div>
        <div className="flex-1">
          <h3 className="font-bold text-xl">Treinar Pronúncia</h3>
          <p className="text-gray-300 text-sm mt-1">Receba feedback detalhado da sua fala, palavra por palavra, e melhore sua entonação.</p>
        </div>
        <div className="ml-4 text-2xl font-bold">→</div>
      </div>
    </button>
  );
};


const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onScenarioSelect, onStartPronunciation }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8 animate-fade-in-up">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Prática de Alemão - Nível A1</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Escolha um modo de prática ou uma situação do dia a dia abaixo para começar.</p>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PronunciationCard onSelect={onStartPronunciation} />
          {SCENARIOS.map(scenario => (
            <ScenarioCard key={scenario.id} scenario={scenario} onSelect={() => onScenarioSelect(scenario)} />
          ))}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default ScenarioSelector;