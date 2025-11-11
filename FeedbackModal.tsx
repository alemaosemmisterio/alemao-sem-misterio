import React from 'react';
import type { Feedback } from '../types';

interface FeedbackModalProps {
  feedback: Feedback | null;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ feedback, onClose }) => {
  if (!feedback) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
           <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-800">Feedback da sua frase</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
          </div>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
            <p className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-800 font-semibold text-center">{feedback.summary}</p>

            {feedback.corrections.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-700">Correções:</h3>
                    <ul className="space-y-3">
                        {feedback.corrections.map((correction, index) => (
                            <li key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-800"><span className="line-through">{correction.erroneous}</span> ➔ <span className="font-bold text-green-700">{correction.correct}</span></p>
                                <p className="text-sm text-gray-600 mt-1 pl-1">{correction.explanation}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {feedback.suggestions.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-700">Sugestões (Outras formas de dizer):</h3>
                     <ul className="space-y-2">
                        {feedback.suggestions.map((suggestion, index) => (
                            <li key={index} className="p-3 bg-green-50 rounded-lg border border-green-200 text-green-800 font-medium">
                                <p>"{suggestion}"</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {feedback.corrections.length === 0 && feedback.suggestions.length === 0 && (
                 <div className="text-center p-4">
                    <p className="text-gray-600">Nenhuma correção ou sugestão necessária. Ótimo trabalho!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;