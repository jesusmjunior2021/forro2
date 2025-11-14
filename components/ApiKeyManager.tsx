import React, { useState } from 'react';
import { ApiKey } from '../types';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKey[];
  activeApiKeyId: string | null;
  onAddApiKey: (key: { name: string; value: string }) => void;
  onDeleteApiKey: (id: string) => void;
  onSetActiveApiKey: (id: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
    isOpen, onClose, apiKeys, activeApiKeyId, 
    onAddApiKey, onDeleteApiKey, onSetActiveApiKey 
}) => {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAddKey = () => {
        if (!newKeyName.trim() || !newKeyValue.trim()) {
            setError('O nome e o valor da chave são obrigatórios.');
            return;
        }
        if (!newKeyValue.trim().startsWith('AIza')) {
            setError('Parece que a chave de API é inválida. Ela deve começar com "AIza".');
            return;
        }
        setError('');
        onAddApiKey({ name: newKeyName, value: newKeyValue });
        setNewKeyName('');
        setNewKeyValue('');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja apagar esta chave de API?")) {
            onDeleteApiKey(id);
        }
    };
    
    const obfuscateKey = (key: string) => {
        if (key.length < 8) return '****';
        return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-300 flex items-center">
                        <i className="fas fa-key mr-3"></i>
                        Gerenciador de Chaves de API
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-md font-semibold text-gray-200 mb-3">Chaves Salvas</h3>
                        {apiKeys.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhuma chave de API salva.</p>
                        ) : (
                            <div className="space-y-2">
                                {apiKeys.map(key => (
                                    <div 
                                        key={key.id} 
                                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${activeApiKeyId === key.id ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-gray-700/70 hover:bg-gray-600/70'}`}
                                        onClick={() => onSetActiveApiKey(key.id)}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${activeApiKeyId === key.id ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                            <div>
                                                <p className="font-semibold text-gray-200">{key.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{obfuscateKey(key.value)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(e, key.id)}
                                            className="w-8 h-8 rounded-full text-gray-400 hover:bg-red-800/50 hover:text-red-300 flex items-center justify-center transition-colors"
                                            title="Apagar Chave"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="p-6 bg-gray-900/50 border-t border-gray-700 rounded-b-2xl">
                    <h3 className="text-md font-semibold text-gray-200 mb-3">Adicionar Nova Chave</h3>
                     {error && <p className="text-red-400 text-sm mb-2 bg-red-900/50 p-2 rounded-md">{error}</p>}
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Nome (Ex: Pessoal)"
                            value={newKeyName}
                            onChange={e => setNewKeyName(e.target.value)}
                            className="w-1/3 bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            type="password"
                            placeholder="Cole sua chave de API aqui"
                            value={newKeyValue}
                            onChange={e => setNewKeyValue(e.target.value)}
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                            onClick={handleAddKey}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                        >
                            Salvar
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ApiKeyManager;