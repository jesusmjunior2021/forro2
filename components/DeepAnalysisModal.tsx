import React, { useState, useCallback } from 'react';
import { DeepAnalysisState } from '../types';

interface DeepAnalysisModalProps {
  state: DeepAnalysisState;
  onClose: () => void;
  onAnalyzeFile: (file: File) => void;
  onAction: (actionText: string) => void;
}

const DeepAnalysisModal: React.FC<DeepAnalysisModalProps> = ({ state, onClose, onAnalyzeFile, onAction }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { isOpen, isLoading, progress, statusMessage, fileName, fileDataUrl, error, result } = state;

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAnalyzeFile(e.dataTransfer.files[0]);
    }
  }, [isLoading, onAnalyzeFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAnalyzeFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-400"></i>
          <h3 className="text-xl font-semibold text-white mt-4">{statusMessage}</h3>
          <p className="text-gray-400 mt-1">{fileName}</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm font-semibold text-white mt-1">{progress.toFixed(0)}%</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="text-center">
                <i className="fas fa-exclamation-triangle text-4xl text-red-400"></i>
                <h3 className="text-xl font-semibold text-white mt-4">Erro na Análise</h3>
                <p className="text-red-300 mt-2 bg-red-900/30 p-3 rounded-md">{error}</p>
            </div>
        );
    }
    
    if (result) {
        return (
          <div className="w-full flex flex-col md:flex-row gap-6 animate-fade-in">
            <div className="md:w-1/3 flex-shrink-0">
              <h3 className="text-lg font-bold text-white mb-2">{result.title}</h3>
              {fileDataUrl && (
                  <img src={fileDataUrl} alt="Pré-visualização do documento" className="rounded-lg border border-gray-600 shadow-lg max-h-80 w-full object-contain"/>
              )}
            </div>

            <div className="md:w-2/3 space-y-4 min-w-0">
              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-blue-300 mb-2">Resumo</h4>
                <p className="text-sm text-gray-300">{result.summary}</p>
              </div>

              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-blue-300 mb-2">Dados Extraídos</h4>
                <div className="max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <table className="w-full text-sm">
                    <tbody>
                    {result.extractedData.map((item, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="py-1.5 pr-2 font-semibold text-gray-400 align-top">{item.key}</td>
                        <td className="py-1.5 text-white">{item.value}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-blue-300 mb-2">Ações Sugeridas</h4>
                <div className="flex flex-col space-y-2">
                  {result.suggestedActions.map((action, i) => (
                    <button key={i} onClick={() => onAction(action)} className="w-full text-left p-2 bg-blue-800/60 hover:bg-blue-700/60 text-blue-200 text-sm rounded-md transition-colors flex items-center">
                      <i className="fas fa-bolt mr-3"></i> {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }

    return (
        <label
            htmlFor="deep-analysis-file-input"
            className={`w-full h-64 border-4 ${isDragOver ? 'border-blue-500 bg-blue-900/30' : 'border-dashed border-gray-600 hover:border-gray-500 hover:bg-gray-800/20'} rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300`}
        >
            <i className="fas fa-upload text-5xl text-gray-500 mb-4"></i>
            <h3 className="text-xl font-semibold text-white">Arraste uma imagem de documento ou clique</h3>
            <p className="text-gray-400 mt-1">PNG, JPG, WEBP, PDF</p>
            <input id="deep-analysis-file-input" type="file" className="hidden" onChange={handleFileSelect} accept="image/png,image/jpeg,image/webp,application/pdf" />
        </label>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col z-40 animate-fade-in" onDragEnter={handleDragEnter}>
      <header className="p-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-gray-200 flex items-center">
          <i className="fas fa-microscope mr-3 text-blue-400"></i>
          Análise de Documento
        </h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center" title="Fechar Análise">
          <i className="fas fa-times text-xl"></i>
        </button>
      </header>
      <main
        className="flex-1 overflow-y-auto p-8 flex items-center justify-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-full max-w-4xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DeepAnalysisModal;