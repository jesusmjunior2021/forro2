
import React from 'react';
import { ConnectionState } from '../types';
// Fix: Correct import path for a component in the same directory.
import DocumentEditorPanel from './DocumentEditorPanel';
import StatusIndicator from './StatusIndicator';

// Re-using the LiveAura from LiveConversationView might be a good idea if it's extracted.
// For now, a simplified version.
const CoCreatorLiveStatus: React.FC<{
    connectionState: ConnectionState,
    onToggleConversation: () => void,
}> = ({ connectionState, onToggleConversation }) => {
    const isSessionActive = [ConnectionState.CONNECTED, ConnectionState.THINKING, ConnectionState.SPEAKING, ConnectionState.CONNECTING].includes(connectionState);
    const isConnecting = connectionState === ConnectionState.CONNECTING;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-900/50">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Sessão Co-criador</h3>
            <button
              onClick={onToggleConversation}
              disabled={isConnecting}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                isSessionActive
                  ? 'bg-red-600 hover:bg-red-700 live-glow'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
              } disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed`}
              title={isSessionActive ? 'Parar Sessão' : 'Iniciar Sessão'}
            >
              <i className={`fas ${isConnecting ? 'fa-spinner fa-spin' : isSessionActive ? 'fa-stop' : 'fa-microphone-alt'} text-3xl`}></i>
            </button>
            <div className="mt-4 h-5">
                <StatusIndicator state={connectionState} />
            </div>
        </div>
    );
}

interface CoCreatorViewProps {
    connectionState: ConnectionState;
    documentEditorProps: any; // Simplified for brevity, pass all editor props
    specialization: string;
    onSpecializationChange: (spec: string) => void;
    onToggleConversation: () => void;
}

const CoCreatorView: React.FC<CoCreatorViewProps> = ({
    connectionState,
    documentEditorProps,
    specialization,
    onSpecializationChange,
    onToggleConversation
}) => {
    // We need to override the onClose for the DocumentEditorPanel to exit CoCreator mode
    const editorPropsWithOverride = {
        ...documentEditorProps,
        isOpen: true, // Force open in this view
        onClose: () => {
            // In co-creator view, "close" might mean something else,
            // for now, we pass the original onClose which should just toggle the panel state
            // A better implementation might have a dedicated exitCoCreatorMode function
             documentEditorProps.onClose();
        }
    };

    return (
        <div className="flex-1 flex min-h-0">
            <div className="w-2/3 h-full flex flex-col">
                {/* The DocumentEditorPanel expects to be a slate-panel, we might need to adjust styles or wrap it */}
                <div className="relative w-full h-full">
                     <DocumentEditorPanel {...editorPropsWithOverride} />
                </div>
            </div>
            <div className="w-1/3 h-full border-l border-gray-700/50 flex flex-col bg-gray-800">
                <CoCreatorLiveStatus 
                    connectionState={connectionState}
                    onToggleConversation={onToggleConversation}
                />
                <div className="p-4 border-t border-gray-700/50">
                     <label className="block text-sm font-medium text-gray-400 mb-2">Especialização da IA</label>
                     <div className="relative">
                        <i className="fas fa-user-tie absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input 
                            type="text"
                            placeholder="Ex: Revisor de Artigos Científicos"
                            value={specialization}
                            onChange={(e) => onSpecializationChange(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm pl-9"
                        />
                    </div>
                </div>
                <div className="p-4 text-xs text-gray-500 border-t border-gray-700/50 flex-grow">
                   <h4 className="font-bold text-gray-400 mb-2">Como usar:</h4>
                   <ol className="list-decimal list-inside space-y-1">
                        <li>Defina a especialização da IA acima.</li>
                        <li>Clique no botão central para iniciar a conversa por voz.</li>
                        <li>Fale com a IA para discutir e editar o documento em tempo real.</li>
                        <li>Exemplos: "Leia o primeiro parágrafo", "Reescreva a introdução para ser mais impactante", "Coloque o título em negrito".</li>
                   </ol>
                </div>
            </div>
        </div>
    );
};

export default CoCreatorView;
