

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
// Per Gemini guidelines, API key is handled via environment variables, so direct import is removed.
import type { Scenario, Message, Feedback, OverallFeedback, PronunciationFeedback, Persona } from '../types';

// FIX: Per Gemini API guidelines, API key is assumed to be present via environment variables.
// The check for a placeholder key has been removed, which also resolves the TypeScript error.
if (!process.env.API_KEY) {
  console.warn("Chave de API não configurada. Por favor, adicione-a como uma variável de ambiente API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash';

async function safeApiCall<T>(apiCall: () => Promise<T>, errorMessage: string): Promise<T> {
  // FIX: Per Gemini API guidelines, API key presence is assumed.
  // The check for a placeholder key has been removed.
  try {
    return await apiCall();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error('Ocorreu um erro na API. Verifique o console para mais detalhes.');
  }
}

// ===============================================
// CONVERSATION FUNCTIONS
// ===============================================

export async function startScenario(scenario: Scenario, persona: Persona): Promise<string> {
  const systemInstruction = `Você é um tutor de alemão amigável e paciente, conversando com um estudante brasileiro de nível A1.
Seu nome é ${persona.name}. Você está interpretando o papel de: "${scenario.persona}".
Sua tarefa é iniciar uma conversa em ALEMÃO para o cenário: "${scenario.title}".
Converse de maneira ${persona.formality === 'formal' ? 'formal (usando "Sie")' : 'informal (usando "du")'}.
Sua primeira mensagem deve ser curta, em alemão, e dar início ao diálogo de forma natural, de acordo com seu personagem.
IMPORTANTE: Varie sua mensagem de abertura toda vez que esta conversa for iniciada para criar diferentes simulações. Não comece sempre da mesma forma.
NUNCA saia do seu papel. Responda APENAS com a sua fala em alemão.`;

  const response = await safeApiCall<GenerateContentResponse>(
    () => ai.models.generateContent({
      model,
      contents: [{role: "user", parts: [{text: "Hallo!"}]}], 
      config: { systemInstruction, temperature: 0.8 }
    }),
    "Error starting scenario:"
  );
  return response.text.trim();
}

export async function continueConversation(messages: Message[], scenario: Scenario, persona: Persona): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const systemInstruction = `Você é ${persona.name}, um tutor de alemão, interpretando o papel de "${scenario.persona}".
  Continue a conversa em ALEMÃO com o aluno de nível A1, com base no histórico.
  Converse de maneira ${persona.formality === 'formal' ? 'formal (usando "Sie")' : 'informal (usando "du")'}.
  Mantenha o diálogo fluindo de forma natural dentro do cenário "${scenario.title}".
  Suas respostas devem ser curtas, apropriadas para um iniciante, e APENAS a sua próxima fala em alemão.`;

  const response = await safeApiCall<GenerateContentResponse>(
    () => ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction, temperature: 0.7 }
    }),
    "Error continuing conversation:"
  );
  return response.text.trim();
}

// ===============================================
// TRANSLATION FUNCTION
// ===============================================

export async function translateText(textToTranslate: string): Promise<string> {
  const systemInstruction = `Você é um assistente de tradução. Traduza o seguinte texto em alemão para o português brasileiro.
  Forneça APENAS o texto traduzido, sem nenhum comentário ou explicação adicional.`;

  const response = await safeApiCall<GenerateContentResponse>(
    () => ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: textToTranslate }] }],
      config: { systemInstruction, temperature: 0 }
    }),
    "Error translating text:"
  );
  return response.text.trim();
}


// ===============================================
// FEEDBACK & SUGGESTION FUNCTIONS
// ===============================================

// FIX: Using `Type` enum for schema definition as per Gemini API guidelines.
const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Um resumo geral de 1 frase em português. Ex: 'Ótima resposta!', 'Quase perfeito, apenas um detalhe.' ou 'Cuidado com a conjugação.'" },
    corrections: {
      type: Type.ARRAY,
      description: "Uma lista de correções específicas. Deixe vazio se não houver erros.",
      items: {
        type: Type.OBJECT,
        properties: {
          erroneous: { type: Type.STRING, description: "A parte exata da frase do aluno que está errada." },
          correct: { type: Type.STRING, description: "A forma correta." },
          explanation: { type: Type.STRING, description: "Uma explicação curta e clara em português sobre o erro." }
        },
        required: ["erroneous", "correct", "explanation"]
      }
    },
    suggestions: {
      type: Type.ARRAY,
      description: "Uma ou duas frases alternativas em alemão que o aluno poderia ter usado para soar mais natural. Deixe vazio se não for aplicável.",
      items: { type: Type.STRING }
    }
  },
  required: ["summary", "corrections", "suggestions"]
};

export async function getInlineFeedback(userInput: string): Promise<Feedback> {
  const systemInstruction = `Você é um professor de alemão avaliando UMA frase de um aluno brasileiro A1.
  Analise a frase: "${userInput}".
  Forneça um feedback claro e conciso em português, seguindo o schema JSON.
  Seja encorajador, mesmo ao corrigir.`;
  
  const response = await safeApiCall<GenerateContentResponse>(
      () => ai.models.generateContent({
          model,
          contents: [{role: "user", parts:[{text:"Por favor, avalie esta frase."}]}],
          config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: feedbackSchema
          }
      }),
      "Error getting inline feedback:"
  );
  
  return JSON.parse(response.text) as Feedback;
}

// FIX: Using `Type` enum for schema definition as per Gemini API guidelines.
const overallFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Um resumo geral e encorajador sobre o desempenho do aluno na conversa, em português (2-3 frases). Comece com uma frase positiva." },
    strengths: { type: Type.STRING, description: "Liste 2-3 pontos fortes que o aluno demonstrou (ex: bom vocabulário, boa estrutura de frase). Se o aluno usou algo acima do nível A1 (ex: um tempo verbal complexo, vocabulário avançado), mencione e elogie isso especificamente. Use markdown de lista." },
    errorPatterns: { type: Type.STRING, description: "Identifique 1 ou 2 padrões de erro recorrentes (ex: declinação de adjetivos, posição do verbo) e explique de forma simples e construtiva em português. Use markdown de lista." },
    tips: { type: Type.STRING, description: "Dê 1 ou 2 dicas práticas e acionáveis em português para o aluno focar na próxima vez. Use markdown de lista." },
    newExpressions: { type: Type.STRING, description: "Liste 2-3 frases ou expressões novas em alemão que o aluno aprendeu ou poderia usar, com a tradução em português ao lado. Ex: '* Ich stimme dir zu - Eu concordo com você'. Use markdown de lista."}
  },
  required: ["summary", "strengths", "errorPatterns", "tips", "newExpressions"]
};

export async function getOverallFeedback(messages: Message[], scenario: Scenario): Promise<OverallFeedback> {
  const conversation = messages.map(m => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.text}`).join('\n');
  const systemInstruction = `Você é um professor de alemão experiente, paciente e muito encorajador, dando um feedback geral sobre uma conversa com um aluno brasileiro de nível A1.
  O cenário da conversa era: "${scenario.title}".
  Analise todo o diálogo abaixo:
  ---
  ${conversation}
  ---
  Sua tarefa é fornecer um feedback que seja ao mesmo tempo sincero e altamente motivador. O tom deve ser de um mentor que acredita no potencial do aluno. Forneça o feedback em português, seguindo o schema JSON. Seja detalhado e claro em suas explicações.
  IMPORTANTE: NÃO use negrito com asteriscos duplos (**) em sua resposta. Use apenas listas com um único asterisco (*).`;

  const response = await safeApiCall<GenerateContentResponse>(
      () => ai.models.generateContent({
          model,
          contents: [{role: "user", parts: [{text: "Por favor, gere o feedback geral da conversa."}]}],
          config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: overallFeedbackSchema
          }
      }),
      "Error getting overall feedback:"
  );

  return JSON.parse(response.text) as OverallFeedback;
}

// FIX: Using `Type` enum for schema definition as per Gemini API guidelines.
const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "Uma lista de 3 frases curtas e simples em alemão que o aluno poderia dizer em seguida.",
            items: { type: Type.STRING }
        }
    },
    required: ["suggestions"]
};

export async function getSuggestion(messages: Message[], scenario: Scenario): Promise<string[]> {
    const conversation = messages.map(m => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.text}`).join('\n');
    const systemInstruction = `Você é um assistente de professor de alemão ajudando um aluno de nível A1 que não sabe o que dizer.
    O cenário da conversa é: "${scenario.title}". O tutor está interpretando: "${scenario.persona}".
    Com base na conversa até agora, gere 3 sugestões CURTAS e SIMPLES em ALEMÃO do que o aluno poderia dizer em seguida para continuar o diálogo.
    As sugestões devem ser apropriadas para um iniciante.
    ---
    ${conversation}
    ---
    Forneça as sugestões no formato JSON.`;
    
    const response = await safeApiCall<GenerateContentResponse>(
        () => ai.models.generateContent({
            model,
            contents: [{role: "user", parts: [{text: "Gere 3 sugestões para o aluno."}]}],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: suggestionSchema
            }
        }),
        "Error getting suggestions:"
    );
    
    const parsed = JSON.parse(response.text);
    return parsed.suggestions || [];
}


// ===============================================
// PRONUNCIATION FEEDBACK FUNCTION
// ===============================================

// FIX: Using `Type` enum for schema definition as per Gemini API guidelines.
const pronunciationFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Uma pontuação geral de 0 a 100 para a pronúncia." },
    feedbackSummary: { type: Type.STRING, description: "Um resumo encorajador de 1-2 frases em português sobre a pronúncia." },
    words: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "A palavra original da frase." },
          score: { type: Type.STRING, description: "A avaliação da pronúncia: 'correct', 'partial', 'incorrect', ou 'unrecognized'." },
          tip: { type: Type.STRING, description: "Uma dica curta e específica em português se a pronúncia não for 'correct'. Ex: 'O som do 'ch' deve ser mais suave.'" }
        },
        required: ["word", "score"]
      }
    }
  },
  required: ["overallScore", "feedbackSummary", "words"]
}

export async function getPronunciationFeedback(originalText: string, userTranscription: string): Promise<PronunciationFeedback> {
  const systemInstruction = `Você é um foneticista e professor de alemão altamente qualificado, especializado em ensinar falantes de português brasileiro. Sua avaliação de pronúncia deve ser extremamente detalhada, encorajadora, gentil e pedagógica.
  A frase que o aluno deveria dizer é: "${originalText}".
  A transcrição do que o aluno disse é: "${userTranscription}".
  
  Sua tarefa é analisar a transcrição para inferir erros de pronúncia e fornecer feedback de alta qualidade em português, seguindo o schema JSON.
  
  **Diretrizes para o feedback (campo 'tip'):**
  
  *   **Para scores 'partial' ou 'incorrect':**
    1.  **Tom:** Comece sempre de forma positiva e gentil (ex: "Ótima tentativa!", "Quase lá! Vamos focar no som do...").
    2.  **Identifique o Som:** Aponte o som específico que precisa de ajuste (ex: a vogal 'ö', o 'ch' suave, o 'r' no final da sílaba).
    3.  **Instrução Clara:** Descreva COMO produzir o som corretamente. Dê dicas práticas sobre a posição da língua e o formato da boca. (ex: "Para o 'ü', faça um bico como se fosse dizer 'u', mas tente dizer 'i' com a língua.").
    4.  **Comparação com Português:** Use analogias com o português para ilustrar a diferença. (ex: "O 'ch' em 'ich' é um sopro suave, diferente do som de 'x' em 'xícara' ou 'tch' em 'tchau'").
    5.  **Exemplo de bom 'tip' para 'möchte' pronunciada como 'mochte':** "Quase perfeito! Atenção à vogal 'ö'. Para produzi-la, forme a boca para dizer 'ê' (como em 'você'), mas arredonde os lábios para frente, como se fosse assobiar. O som do 'ch' aqui é suave, como um sopro."

  *   **Para score 'unrecognized':**
    1.  A transcrição da fala do aluno para esta palavra foi muito diferente do esperado.
    2.  No campo 'tip', escreva uma mensagem clara e gentil, como: "Não consegui reconhecer esta palavra. Tente pronunciá-la mais claramente na próxima vez."
  
  *   **Para score 'correct':**
    1.  O campo 'tip' não é necessário. Deixe-o em branco.

  Seja sempre positivo e construtivo em todo o feedback.`;

  const prompt = `Por favor, avalie a pronúncia com base na transcrição. Original: "${originalText}", Transcrição: "${userTranscription}".`;
  
  const response = await safeApiCall<GenerateContentResponse>(
    () => ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: pronunciationFeedbackSchema
      }
    }),
    "Error getting pronunciation feedback:"
  );

  return JSON.parse(response.text) as PronunciationFeedback;
}


// ===============================================
// AUDIO (TEXT-TO-SPEECH) FUNCTION
// ===============================================

export async function generateAudio(text: string, voiceName: Persona['voice']): Promise<string> {
  const response = await safeApiCall<GenerateContentResponse>(
      () => ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text }] }],
          config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
          },
      }),
      "Error generating audio:"
  );

  const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || "";
}