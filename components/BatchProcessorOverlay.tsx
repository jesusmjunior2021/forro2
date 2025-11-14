import React from 'react';
import { LiveDocument } from '../types';

interface BatchProcessorUIProps {
  queue: LiveDocument[];
  onCancel: () => void;
}

const BatchProcessorOverlay: React.FC<BatchProcessorUIProps> = ({ queue, onCancel }) => {
    if (queue.length === 0) {
        return null;
    }

    const total = queue.length;
    const done = queue.filter(f => f.status === 'done' || f.status === 'error').length;
    const progress = total > 0 ? (done / total) * 100 : 0;
    
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative w-full max-w-2xl p-6 bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Processando Documentos...</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}></div>
                </div>
                <p className="text-sm text-gray-400 text-center mb-4">{`Processado ${done} de ${total}`}</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {queue.map(item => (
                        <div key={item.id} className="flex items-center bg-gray-800 p-2 rounded-md">
                            <img src={item.previewUrl} className="w-10 h-10 rounded-md object-cover mr-3"/>
                            <p className="flex-grow text-sm text-gray-300 truncate">{item.name}</p>
                            {item.status === 'pending' && <span className="text-xs text-gray-500">Pendente</span>}
                            {item.status === 'processing' && <i className="fas fa-spinner fa-spin text-blue-400"></i>}
                            {item.status === 'done' && <i className="fas fa-check-circle text-green-400"></i>}
                            {item.status === 'error' && <i className="fas fa-exclamation-triangle text-red-400" title={item.errorMessage}></i>}
                        </div>
                    ))}
                </div>
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
    );
};

export default BatchProcessorOverlay;
