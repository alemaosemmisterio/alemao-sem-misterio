import React from 'react';
import type { OverallFeedback } from '../types';

interface OverallFeedbackModalProps {
  feedback: OverallFeedback | null;
  onClose: () => void;
  onRestart: () => void;
}

// SVG Icons for a more professional look
const ThumbsUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.714 4.224a2 2 0 00-.28 1.085V18" />
  </svg>
);
const MagnifyingGlassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const MarkdownContent: React.FC<{ content: string; isExpressionList?: boolean }> = ({ content, isExpressionList = false }) => {
    const items = content.split('\n').map(line => line.trim()).filter(line => line.startsWith('* ')).map(line => line.substring(2).trim());

    if (items.length === 0) {
        return <p className="text-gray-600 leading-relaxed">{content}</p>;
    }

    return (
        <ul className="space-y-2 text-gray-700">
            {items.map((item, index) => {
                if (isExpressionList && item.includes(' - ')) {
                    const parts = item.split(' - ');
                    const german = parts[0];
                    const portuguese = parts.slice(1).join(' - ');
                    return (
                        <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2 mt-1.5">•</span>
                            <div>
                                <span className="font-semibold text-gray-800">{german}</span>
                                <span className="block text-sm text-gray-500">{portuguese}</span>
                            </div>
                        </li>
                    );
                }
                return (
                    <li key={index} className="flex items-start">
                         <span className="text-gray-400 mr-2 mt-1.5">•</span>
                         <span>{item}</span>
                    </li>
                );
            })}
        </ul>
    );
}

const FeedbackCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; cardClasses: string; titleClasses: string }> = ({ icon, title, children, cardClasses, titleClasses }) => (
    <div className={`p-5 rounded-xl border ${cardClasses}`}>
        <div className="flex items-center mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${titleClasses}`}>
                {icon}
            </div>
            <h3 className={`font-bold text-lg ${titleClasses}`}>{title}</h3>
        </div>
        <div className="pl-2">
            {children}
        </div>
    </div>
);


const OverallFeedbackModal: React.FC<OverallFeedbackModalProps> = ({ feedback, onClose, onRestart }) => {
  if (!feedback) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 text-center border-b bg-gray-50 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Relatório da sua Prática</h2>
            <p className="text-gray-600 max-w-xl mx-auto">{feedback.summary}</p>
        </header>
        
        <main className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto bg-gray-50/50">
            <FeedbackCard 
                icon={<ThumbsUpIcon />}
                title="O que você mandou bem!" 
                cardClasses="bg-green-50 border-green-200"
                titleClasses="text-green-800"
            >
                <MarkdownContent content={feedback.strengths} />
            </FeedbackCard>
            
            <FeedbackCard 
                icon={<MagnifyingGlassIcon />}
                title="Pontos para ficar de olho"
                cardClasses="bg-yellow-50 border-yellow-200"
                titleClasses="text-yellow-800"
            >
                <MarkdownContent content={feedback.errorPatterns} />
            </FeedbackCard>

            <FeedbackCard 
                icon={<LightbulbIcon />}
                title="Dicas para a próxima vez"
                cardClasses="bg-blue-50 border-blue-200"
                titleClasses="text-blue-800"
            >
                <MarkdownContent content={feedback.tips} />
            </FeedbackCard>

            <FeedbackCard 
                icon={<BookOpenIcon />}
                title="Novas palavras e expressões"
                cardClasses="bg-purple-50 border-purple-200"
                titleClasses="text-purple-800"
            >
                <MarkdownContent content={feedback.newExpressions} isExpressionList={true}/>
            </FeedbackCard>
        </main>

        <footer className="mt-auto p-6 flex justify-end space-x-4 bg-gray-100 border-t rounded-b-2xl">
            <button 
                onClick={onClose} 
                className="px-5 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors">
                Ver Conversa
            </button>
            <button 
                onClick={onRestart}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                Praticar Outro Cenário
            </button>
        </footer>
      </div>
    </div>
  );
};

export default OverallFeedbackModal;