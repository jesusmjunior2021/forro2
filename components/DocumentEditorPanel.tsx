
import React from 'react';
import { Document } from '../types';

interface DocumentEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeDocument: Document | null;
    onSetDocumentContent: (content: string) => void;
    onEnterCoCreatorMode: (docId: string) => void;
}

const DocumentEditorPanel: React.FC<DocumentEditorPanelProps> = ({
    isOpen,
    onClose,
    activeDocument,
    onSetDocumentContent,
    onEnterCoCreatorMode,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-file-alt mr-3"></i>
                    Editor de Documento
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>
            <div className="flex-1 p-4">
                {activeDocument ? (
                    <div>
                        <h2 className="text-2xl font-bold">{activeDocument.title}</h2>
                        <textarea
                            className="w-full h-96 bg-gray-900 text-white p-2 mt-4"
                            value={activeDocument.content}
                            onChange={(e) => onSetDocumentContent(e.target.value)}
                        />
                        <button onClick={() => onEnterCoCreatorMode(activeDocument.id)}>
                            Entrar no modo Co-Criador
                        </button>
                    </div>
                ) : (
                    <p>Nenhum documento ativo.</p>
                )}
            </div>
        </div>
    );
};

export default DocumentEditorPanel;
