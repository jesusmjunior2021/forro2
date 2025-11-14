import React from 'react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4 border border-gray-700 flex flex-col text-center p-8"
                onClick={e => e.stopPropagation()}
            >
                <i className="fas fa-brain text-5xl text-blue-400 mx-auto mb-4"></i>
                <h2 className="text-2xl font-bold text-white mb-2">Assistente Neural</h2>
                <p className="text-sm text-gray-400 mb-6">Versão 2.5</p>
                
                <p className="text-gray-300 leading-relaxed">
                    Esta aplicação é uma interface de conversação avançada construída com a API Gemini Live, projetada para fornecer uma interação fluida e inteligente em tempo real.
                </p>

                <div className="my-6 border-t border-gray-700"></div>

                <p className="text-sm text-gray-400">Desenvolvido por:</p>
                <p className="text-lg font-semibold text-white">Jesus Martins</p>

                <button 
                    onClick={onClose} 
                    className="mt-8 w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default AboutModal;
