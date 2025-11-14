import React from 'react';

interface AnalysisPanelProps {
  data: {
    title: string;
    content: string;
    progress: number;
  } | null;
  onClose: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, onClose }) => {
  const isOpen = !!data;

  return (
    <div className={`slate-panel w-full max-w-md ${isOpen ? 'open' : ''} flex flex-col`}>
      {data && (
        <>
          <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
              <i className="fas fa-cogs mr-3"></i>
              {data.title}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </header>
          <div className="p-4 flex-shrink-0">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${data.progress}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">{data.progress}% Completo</p>
          </div>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans bg-black/30 p-3 rounded-md">
              {data.content}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPanel;