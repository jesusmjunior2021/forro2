import React, { useState, useEffect, useMemo } from 'react';
import { RssArticle } from '../types';
import { findBestVoice } from '../utils/audioUtils';

interface ArticleDetailModalProps {
  article: RssArticle;
  onClose: () => void;
  selectedVoiceName: string;
  speechRate: number;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose, selectedVoiceName, speechRate }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utterance = useMemo(() => new SpeechSynthesisUtterance(), []);

    // Carrega as vozes disponíveis do navegador
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        // As vozes são carregadas de forma assíncrona
        loadVoices(); // Chamada inicial
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Limpeza ao desmontar o componente
        return () => {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const cleanTextForSpeech = (htmlContent: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        // Adiciona pontos após títulos e parágrafos para criar pausas
        tempDiv.querySelectorAll('h1, h2, h3, p').forEach(el => {
            if (el.textContent && !el.textContent.trim().endsWith('.')) {
                el.innerHTML += '.';
            }
        });
        
        let text = tempDiv.textContent || '';

        // Remove markdown links, keeping the link text
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        // Remove bold, italics, strikethrough, code
        text = text.replace(/(\*\*|__|\*|_|~~|`)/g, '');
        // Remove headings
        text = text.replace(/^#+\s+/gm, '');
        // Remove list items
        text = text.replace(/^\s*[-*+]\s+/gm, '');
        // Remove blockquotes
        text = text.replace(/^>\s+/gm, '');
        // Replace horizontal rules
        text = text.replace(/^-{3,}\s*$/gm, '');
        // Replace ellipses with commas for a slight pause
        text = text.replace(/\.\.\./g, ',');
        // Collapse multiple spaces
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    };

    const handleToggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const textToSpeak = cleanTextForSpeech(article.content);
            utterance.text = textToSpeak;
            utterance.lang = 'pt-BR';
            utterance.rate = speechRate;
            
            const bestVoice = findBestVoice(voices, selectedVoiceName);
            if (bestVoice) {
                utterance.voice = bestVoice;
            }
            
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error("Erro na síntese de voz:", e);
                setIsSpeaking(false);
            };
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };
    
    // Função para lidar com o fechamento do modal, garantindo que a fala seja interrompida.
    const handleClose = () => {
        window.speechSynthesis.cancel();
        onClose();
    };

    if (!article) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" 
        onClick={handleClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl m-4 border border-gray-700 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-blue-300">{article.title}</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Fonte: {article.source} | {new Date(article.pubDate).toLocaleString('pt-BR')}
                </p>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0">
              <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto prose prose-invert prose-sm max-w-none text-gray-300">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        <div className="p-4 bg-gray-900/50 mt-auto border-t border-gray-700 flex justify-between items-center">
            <button
                onClick={handleToggleSpeech}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${isSpeaking ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
            >
                <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-play-circle'} mr-2`}></i>
                {isSpeaking ? 'Parar Leitura' : 'Ler em Voz Alta'}
            </button>
            <a 
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center"
            >
                <i className="fas fa-external-link-alt mr-2"></i>
                Acessar a Fonte Original
            </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailModal;