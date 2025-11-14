import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

interface TranscriptionFlowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getActiveApiKey: () => string | null;
}

const LANGUAGES = [
    { code: 'en', name: 'Inglês' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Alemão' },
    { code: 'ru', name: 'Russo' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Espanhol' },
    { code: 'fr', name: 'Francês' },
    { code: 'ja', name: 'Japonês' },
    { code: 'ko', name: 'Coreano' },
];

const TranscriptionFlowPanel: React.FC<TranscriptionFlowPanelProps> = ({ isOpen, onClose, getActiveApiKey }) => {
    const [originalText, setOriginalText] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('pt');
    const [translatedText, setTranslatedText] = useState('');
    
    const [goalPrompt, setGoalPrompt] = useState('Transforme o texto para orientar uma IA para a criação de revistas eletrônicas.');
    const [pipelineOutput, setPipelineOutput] = useState('');

    const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
    const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTranslate = async () => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            setError('Chave de API não configurada.');
            return;
        }
        if (!originalText.trim()) {
            setError('Por favor, insira o texto da transcrição original.');
            return;
        }
        
        setError(null);
        setIsLoadingTranslation(true);
        setTranslatedText('');

        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Translate the following text from ${LANGUAGES.find(l => l.code === sourceLang)?.name} to ${LANGUAGES.find(l => l.code === targetLang)?.name}. Return only the translated text, without any preamble, explanation, or markdown formatting.\n\nTEXT:\n"""${originalText}"""`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setTranslatedText(response.text);
        } catch (e) {
            console.error("Translation failed:", e);
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido durante a tradução.');
        } finally {
            setIsLoadingTranslation(false);
        }
    };

    const handleGeneratePipeline = async () => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            setError('Chave de API não configurada.');
            return;
        }
        if (!translatedText.trim()) {
            setError('Traduza um texto primeiro antes de gerar o pipeline.');
            return;
        }
        
        setError(null);
        setIsLoadingPipeline(true);
        setPipelineOutput('');

        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `
You are an expert in process synthesis and instructional design. Your task is to convert a large body of text into a logical, structured, and imperative step-by-step guide (a pipeline) that an AI or a person can follow to achieve a specific goal.

**INSTRUCTIONS:**
1.  **Analyze the Global Context:** Read the entire provided text to understand its core concepts, themes, and overall message.
2.  **Identify Key Information:** Extract the most critical points, focusing on verbal and nominal nuclei, thematic axes, and informational clusters.
3.  **Establish Logical Flow:** Determine the logical coordination between subjects and arrange them into a coherent, successive chain of actions.
4.  **Generate a Pipeline:** Based on the user's goal, create a step-by-step guide. Each step must be clear, actionable, and confirmatory. The language must be structured and imperative. The output should be a detailed, refined, object-oriented plan for executing the user's intent.

**USER'S GOAL:**
---
${goalPrompt}
---

**TEXT TO TRANSFORM:**
---
${translatedText}
---

**OUTPUT FORMAT:**
Your response must be in Markdown format, starting with a main title and then numbered steps. Use sub-bullets where necessary for detail. Do not add any preamble or concluding remarks.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro', // Using a more powerful model for this complex task
                contents: prompt,
            });

            setPipelineOutput(response.text);
        } catch (e) {
            console.error("Pipeline generation failed:", e);
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido durante a geração do pipeline.');
        } finally {
            setIsLoadingPipeline(false);
        }
    };
    
    return (
        <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-cogs mr-3 text-blue-400"></i>
                    Fluxo de Transcrição e Transformação
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg">
                        <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                    </div>
                )}
                
                {/* Step 1: Translation */}
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                    <h2 className="text-xl font-bold text-white mb-3">Passo 1: Traduzir Transcrição</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Texto Original</label>
                            <textarea
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                                placeholder="Cole a transcrição do vídeo aqui..."
                                rows={10}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Texto Traduzido</label>
                            <textarea
                                value={translatedText}
                                readOnly
                                placeholder="A tradução aparecerá aqui..."
                                rows={10}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-2"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm">
                            <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                            <i className="fas fa-long-arrow-alt-right text-gray-400"></i>
                            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleTranslate}
                            disabled={isLoadingTranslation}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
                        >
                            {isLoadingTranslation ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-language mr-2"></i>}
                            Traduzir
                        </button>
                    </div>
                </div>

                {/* Step 2: Transformation */}
                <div className={`bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 transition-opacity ${!translatedText && 'opacity-50 pointer-events-none'}`}>
                     <h2 className="text-xl font-bold text-white mb-3">Passo 2: Transformar em Pipeline</h2>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Objetivo da Transformação</label>
                        <textarea
                            value={goalPrompt}
                            onChange={(e) => setGoalPrompt(e.target.value)}
                            rows={2}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mt-3 text-right">
                        <button
                            onClick={handleGeneratePipeline}
                            disabled={isLoadingPipeline || !translatedText}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
                        >
                            {isLoadingPipeline ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-cogs mr-2"></i>}
                            Gerar Pipeline
                        </button>
                    </div>
                     {pipelineOutput && (
                        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-600/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-200 mb-2">Pipeline Gerado</h3>
                            <MarkdownRenderer content={pipelineOutput} searchTerm="" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default TranscriptionFlowPanel;