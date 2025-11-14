import React, { useState } from 'react';

interface PromptCartridgeFormProps {
    onSave: (cartridge: { title: string; prompt: string }) => void;
    onClose: () => void;
}

const PromptCartridgeForm: React.FC<PromptCartridgeFormProps> = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!title.trim() || !prompt.trim()) {
            setError('O título e a prompt não podem estar vazios.');
            return;
        }
        onSave({ title, prompt });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-gray-200">Novo Cartucho de Prompt</h3>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="cartridge-title">Título do Cartucho</label>
                        <input
                            id="cartridge-title"
                            type="text"
                            placeholder="Ex: Construtor de Prompts"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="cartridge-prompt">Corpo da Prompt</label>
                        <textarea
                            id="cartridge-prompt"
                            placeholder="Insira a prompt completa aqui..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={15}
                            className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        />
                    </div>
                     {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <div className="flex justify-end space-x-3 p-4 bg-gray-900/50 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">Salvar Cartucho</button>
                </div>
            </div>
        </div>
    );
};

export default PromptCartridgeForm;
