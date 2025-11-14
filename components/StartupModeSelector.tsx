import React, { useState, useEffect } from 'react';

interface StartupModeSelectorProps {
  onSelectLocal: () => void;
  onSelectDemo: () => void;
}

const StartupModeSelector: React.FC<StartupModeSelectorProps> = ({ onSelectLocal, onSelectDemo }) => {
  const [isApiSupported, setIsApiSupported] = useState(true);

  useEffect(() => {
    const checkApiSupport = () => {
        if (!('showDirectoryPicker' in window)) {
            return false;
        }
        // A simple check for being inside an iframe. The API will throw a cross-origin error if so.
        if (window.self !== window.top) {
            return false;
        }
        return true;
    };
    setIsApiSupported(checkApiSupport());
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="text-center mb-10">
        <i className="fas fa-brain text-6xl text-blue-400"></i>
        <h1 className="text-4xl font-bold text-white mt-4">FORRO</h1>
        <p className="text-lg text-gray-400 mt-2">Escolha como iniciar sua sessão.</p>
      </div>
      
      <div className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Local Storage Card */}
        <div className={`bg-gray-800/50 border ${isApiSupported ? 'border-blue-500/50 hover:border-blue-400' : 'border-gray-600/50'} rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300`}>
          <i className={`fas fa-save text-5xl ${isApiSupported ? 'text-blue-400' : 'text-gray-500'} mb-4`}></i>
          <h2 className="text-2xl font-semibold text-white mb-3">Armazenamento Local</h2>
          <p className="text-gray-400 flex-grow mb-6">
            Sua sessão, histórico e configurações são salvos em uma pasta no seu computador para controle total e persistência dos dados.
          </p>
          <button
            onClick={onSelectLocal}
            disabled={!isApiSupported}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
          >
            <i className="fas fa-folder-open mr-2"></i>
            Selecionar Pasta e Iniciar
          </button>
          {!isApiSupported && (
            <p className="text-xs text-yellow-400 mt-3 bg-yellow-900/30 p-2 rounded-md">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Indisponível neste ambiente (ex: iframe ou navegador incompatível).
            </p>
          )}
        </div>
        
        {/* Demo Mode Card */}
        <div className="bg-gray-800/50 border border-teal-500/50 hover:border-teal-400 rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 transform hover:scale-105">
            <i className="fas fa-flask text-5xl text-teal-400 mb-4"></i>
            <h2 className="text-2xl font-semibold text-white mb-3">Modo de Demonstração</h2>
            <p className="text-gray-400 flex-grow mb-6">
                Inicie uma sessão temporária para explorar todas as funcionalidades. Seus dados serão perdidos quando a página for fechada.
            </p>
            <button
                onClick={onSelectDemo}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
            >
                <i className="fas fa-play-circle mr-2"></i>
                Iniciar Sessão Temporária
            </button>
        </div>
      </div>
      <footer className="absolute bottom-4 text-xs text-gray-600 text-center max-w-xl">
          Nota: O Armazenamento Local usa a API File System Access, que requer um navegador moderno (Chrome, Edge, Opera) e não pode ser executado em um iframe por motivos de segurança.
      </footer>
    </div>
  );
};

export default StartupModeSelector;