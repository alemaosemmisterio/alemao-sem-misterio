import React from 'react';
import type { Scenario, PracticeMode } from '../types';

interface ModeSelectorModalProps {
  scenario: Scenario;
  onSelect: (mode: PracticeMode) => void;
  onClose: () => void;
}

const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({ scenario, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 md:p-8 text-center" onClick={e => e.stopPropagation()}>
        <div className="mb-6">
            <div className="text-5xl mx-auto mb-3">{scenario.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-800">{scenario.title}</h2>
            <p className="text-gray-600 mt-1">Como você gostaria de praticar?</p>
        </div>
        
        <div className="space-y-4">
            <button
                onClick={() => onSelect('chat')}
                className="w-full flex items-center text-left p-5 bg-gray-50 rounded-lg border-2 border-transparent hover:border-german-red hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-german-red"
            >
                <div className="text-3xl mr-5">💬</div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Modo Chat</h3>
                    <p className="text-gray-600 text-sm">Pratique escrevendo suas respostas.</p>
                </div>
            </button>

            <button
                onClick={() => onSelect('conversation')}
                className="w-full flex items-center text-left p-5 bg-gray-50 rounded-lg border-2 border-transparent hover:border-german-gold hover:bg-yellow-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-german-gold"
            >
                <div className="text-3xl mr-5">🎙️</div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Modo Conversa</h3>
                    <p className="text-gray-600 text-sm">Pratique falando e ouça a resposta em áudio.</p>
                </div>
            </button>
        </div>
         <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
      </div>
    </div>
  );
};

export default ModeSelectorModal;