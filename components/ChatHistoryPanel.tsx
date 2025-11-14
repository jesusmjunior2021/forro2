import React from 'react';
import { ChatSession } from '../types';

interface ChatHistoryPanelProps {
    history: ChatSession[];
    onSelectChat: (sessionId: string) => void;
    activeChatId: string | null;
    onDeleteChat: (sessionId: string) => void;
    onClearHistory: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const ChatHistoryItem: React.FC<{ 
    session: ChatSession; 
    onSelect: () => void; 
    onDelete: () => void; 
    isActive: boolean; 
}> = ({ session, onSelect, onDelete, isActive }) => {
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza de que deseja apagar o chat "${session.title}"?`)) {
            onDelete();
        }
    };

    return (
        <div className="relative group">
            <button 
                onClick={onSelect}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 ${isActive ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-gray-900/70 hover:bg-gray-700'}`}
            >
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-gray-200 truncate pr-8">{session.title}</h4>
                    <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(session.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{session.summary}</p>
                <div className="flex flex-wrap gap-1">
                    {session.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">{tag}</span>
                    ))}
                </div>
            </button>
            <button 
                onClick={handleDelete}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-gray-500 hover:bg-red-800/50 hover:text-red-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                title="Apagar chat"
            >
                <i className="fas fa-trash-alt" style={{ fontSize: '0.8rem' }}></i>
            </button>
        </div>
    );
};

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ history, onSelectChat, activeChatId, onDeleteChat, onClearHistory, isOpen, onClose }) => {
    
    const handleClearHistory = () => {
        if (window.confirm('Tem certeza de que deseja apagar TODO o histórico de chats? Esta ação não pode ser desfeita.')) {
            onClearHistory();
        }
    };
    
    return (
        <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-book-open mr-3"></i>
                    Histórico de Chats
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
            {history.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                    <i className="fas fa-history text-4xl mb-3"></i>
                    <p className="text-sm">Nenhum chat salvo.</p>
                    <p className="text-xs mt-1">Sessões encerradas aparecerão aqui.</p>
                 </div>
            ) : (
                <>
                    <ul className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        {history.map(session => (
                            <li key={session.id}>
                                <ChatHistoryItem 
                                    session={session} 
                                    onSelect={() => onSelectChat(session.id)}
                                    onDelete={() => onDeleteChat(session.id)}
                                    isActive={activeChatId === session.id}
                                />
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                        <button
                            onClick={handleClearHistory}
                            className="w-full text-sm bg-red-800/80 hover:bg-red-700 text-red-100 py-2 px-3 rounded-md transition-colors flex items-center justify-center"
                        >
                            <i className="fas fa-trash-alt mr-2"></i>
                            Limpar Histórico
                        </button>
                    </div>
                </>
            )}
            </div>
        </div>
    );
};

export default ChatHistoryPanel;