import React, { useState, useMemo } from 'react';
import { SlateCard } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface CreativeSlatePanelProps {
  cards: SlateCard[];
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
}

const SlateCardComponent: React.FC<{ card: SlateCard; index: number; onDelete: () => void; onCopy: () => void; }> = ({ card, index, onDelete, onCopy }) => {
    const cardColors = ['border-blue-500/50', 'border-purple-500/50', 'border-green-500/50', 'border-yellow-500/50', 'border-pink-500/50'];
    const colorClass = cardColors[index % cardColors.length];

    return (
        <div className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${colorClass} animate-fade-in`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-white">{card.title}</h3>
                    <p className="text-xs text-gray-500">{new Date(card.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onCopy} title="Copiar Conteúdo" className="w-8 h-8 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><i className="fas fa-copy"></i></button>
                    <button onClick={onDelete} title="Apagar Card" className="w-8 h-8 rounded-full text-gray-400 hover:bg-red-800/50 hover:text-red-300"><i className="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 my-3">
                {card.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">{tag}</span>)}
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <MarkdownRenderer content={card.content} searchTerm="" />
            </div>
        </div>
    );
};

const WhiteboardPanel: React.FC<CreativeSlatePanelProps> = ({ cards, onDelete, onCopy }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCards = useMemo(() => {
        if (!searchTerm.trim()) return cards;
        const lowerTerm = searchTerm.toLowerCase();
        return cards.filter(card => 
            card.title.toLowerCase().includes(lowerTerm) ||
            card.content.toLowerCase().includes(lowerTerm) ||
            card.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
        );
    }, [cards, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-gray-800">
            <header className="p-3 border-b border-gray-700/50 flex items-center justify-between shrink-0">
                <div className="flex items-center">
                    <i className="fas fa-stream text-lg text-gray-400 mr-3"></i>
                    <h3 className="font-semibold text-gray-200">Lousa Criativa</h3>
                </div>
                <div className="relative w-1/3">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    <input 
                        type="text" 
                        placeholder="Buscar na lousa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-full text-sm pl-9 pr-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredCards.length > 0 ? (
                    filteredCards.map((card, index) => (
                        <SlateCardComponent 
                            key={card.id} 
                            card={card} 
                            index={cards.length - 1 - cards.indexOf(card)}
                            onDelete={() => onDelete(card.id)} 
                            onCopy={() => onCopy(card.content)}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-500 pt-16">
                        <i className="fas fa-box-open text-4xl mb-4"></i>
                        <p>A Lousa Criativa está vazia.</p>
                        <p className="text-sm">As anotações da IA aparecerão aqui durante as conversas ao vivo.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WhiteboardPanel;