import React from 'react';

const ApiKeyInstructions: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-center p-4">
    <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-md border border-gray-200">
      <header className="mb-6">
        <div className="text-5xl mb-4">🔑</div>
        <h1 className="text-3xl font-bold text-gray-800">
          Chave de API não configurada
        </h1>
        <p className="mt-2 text-gray-600">
          Para usar esta aplicação, você precisa de uma chave de API do Google AI.
        </p>
      </header>
      
      <main className="text-left space-y-4 text-gray-700">
        <p>Por favor, siga estes passos:</p>
        <ol className="list-decimal list-inside space-y-2 bg-gray-50 p-4 rounded-lg">
          <li>Crie um arquivo chamado <code>config.ts</code> na raiz do projeto (mesmo nível de <code>App.tsx</code>).</li>
          <li>Adicione o seguinte conteúdo ao arquivo:
            <pre className="bg-gray-800 text-white p-3 rounded-md mt-2 text-sm overflow-x-auto">
              <code>
                {`// IMPORTANTE:\n// 1. Obtenha sua chave em https://aistudio.google.com/app/apikey\n// 2. Adicione este arquivo ao seu .gitignore para não compartilhar a chave.\n\nexport const API_KEY = 'SUA_CHAVE_DE_API_AQUI';`}
              </code>
            </pre>
          </li>
          <li>Substitua <code>'SUA_CHAVE_DE_API_AQUI'</code> pela sua chave de API real do Google AI.</li>
          <li>Certifique-se de adicionar <code>config.ts</code> ao seu arquivo <code>.gitignore</code>!</li>
        </ol>
      </main>
      
      <footer className="text-gray-500 text-sm mt-8">
        <p>
          Você pode obter uma chave de API em{' '}
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline"
          >
            Google AI Studio
          </a>.
        </p>
      </footer>
    </div>
  </div>
);

export default ApiKeyInstructions;
