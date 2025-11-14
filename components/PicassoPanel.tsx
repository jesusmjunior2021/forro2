import React, { useState, useEffect, useCallback } from 'react';
import { PollinationsState, PollinationImage } from '../types';

interface PicassoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: PollinationsState;
  onGenerateImage: (prompt: string) => void;
  onDeleteImage: (id: string) => void;
  onReusePrompt: (prompt: string) => void;
}

const CooldownTimer: React.FC<{ cooldownUntil: number | null }> = ({ cooldownUntil }) => {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!cooldownUntil) {
            setSecondsLeft(0);
            return;
        }

        const calculateSecondsLeft = () => {
            const now = Date.now();
            const timeLeft = Math.ceil((cooldownUntil - now) / 1000);
            setSecondsLeft(Math.max(0, timeLeft));
        };

        calculateSecondsLeft();
        const interval = setInterval(calculateSecondsLeft, 1000);
        return () => clearInterval(interval);
    }, [cooldownUntil]);

    if (secondsLeft <= 0) {
        return <p className="text-xs text-green-400">Pronto para gerar.</p>;
    }

    return (
        <div className="flex items-center space-x-2 text-xs text-yellow-400">
            <i className="fas fa-hourglass-half fa-spin"></i>
            <span>Aguarde {secondsLeft}s...</span>
        </div>
    );
};


const PicassoPanel: React.FC<PicassoPanelProps> = ({ isOpen, onClose, state, onGenerateImage, onDeleteImage, onReusePrompt }) => {
    const [prompt, setPrompt] = useState('');
    const { isLoading, error, generations, cooldownUntil } = state;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading && (!cooldownUntil || Date.now() > cooldownUntil)) {
            onGenerateImage(prompt);
            setPrompt('');
        }
    };

    const handleReuse = (p: string) => {
        setPrompt(p);
        onReusePrompt(p);
    };

    return (
        <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-palette mr-3 text-blue-400"></i>
                    Estúdio Picasso (Pollinations)
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>
            
            <div className="p-4 shrink-0 border-b border-gray-700/50">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea 
                        placeholder="Descreva a imagem que você quer criar... A IA pode refinar este prompt." 
                        rows={3} 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-3 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center">
                        <CooldownTimer cooldownUntil={cooldownUntil} />
                        <button 
                            type="submit" 
                            disabled={isLoading || (!!cooldownUntil && Date.now() < cooldownUntil)} 
                            className="bg-blue-600 hover:bg-blue-700 font-bold py-2 px-5 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Gerando...</> : 'Gerar Imagem'}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
                </form>
            </div>
            
            <main className="flex-1 overflow-y-auto p-4">
                {generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500">
                        <i className="fas fa-image text-5xl mb-4"></i>
                        <p className="text-lg">Sua galeria está vazia.</p>
                        <p className="mt-1">Crie sua primeira imagem usando o campo acima ou por comando de voz.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {generations.map(gen => (
                            <div key={gen.id} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                <img src={gen.imageUrl} alt={gen.prompt} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                                    <p className="text-[10px] font-mono line-clamp-4">{gen.prompt}</p>
                                    <div className="flex space-x-1 mt-2">
                                        <a href={gen.imageUrl} download={`pollination-${gen.id}.png`} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40" title="Baixar Imagem">
                                            <i className="fas fa-download text-xs"></i>
                                        </a>
                                        <button onClick={() => handleReuse(gen.prompt)} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40" title="Reutilizar Prompt">
                                            <i className="fas fa-redo-alt text-xs"></i>
                                        </button>
                                        <button onClick={() => onDeleteImage(gen.id)} className="w-7 h-7 rounded-full bg-red-500/50 hover:bg-red-500/80" title="Excluir Imagem">
                                            <i className="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PicassoPanel;