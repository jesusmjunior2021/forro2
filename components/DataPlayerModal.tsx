import React from 'react';
import { DataPlayerState } from '../types';

const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  switch (trend) {
    case 'up':
      return <i className="fas fa-arrow-trend-up text-green-400"></i>;
    case 'down':
      return <i className="fas fa-arrow-trend-down text-red-400"></i>;
    case 'stable':
      return <i className="fas fa-minus text-gray-400"></i>;
    default:
      return null;
  }
};

const SimpleBarChart: React.FC<{ data: DataPlayerState['chartData'] }> = ({ data }) => {
  if (!data || data.type !== 'bar' || !data.datasets || data.datasets.length === 0) return null;

  const maxValue = Math.max(...data.datasets.flatMap(ds => ds.data));
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
      <h4 className="text-md font-semibold text-gray-200 mb-4 text-center">{data.title}</h4>
      <div className="flex justify-around items-end h-48 border-l border-b border-blue-600/30 pl-2 pb-2">
        {data.labels.map((label, index) => (
          <div key={index} className="flex flex-col items-center justify-end h-full w-full px-1">
            <div className="flex items-end h-full w-full justify-center space-x-1">
              {data.datasets.map((dataset, dsIndex) => (
                 <div
                    key={dsIndex}
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${(dataset.data[index] / maxValue) * 100}%`,
                      backgroundColor: colors[dsIndex % colors.length],
                    }}
                    title={`${dataset.label}: ${dataset.data[index]}`}
                 ></div>
              ))}
            </div>
            <span className="text-xs text-gray-400 mt-2 transform -rotate-45">{label}</span>
          </div>
        ))}
      </div>
       <div className="flex justify-center mt-4 space-x-4">
            {data.datasets.map((dataset, dsIndex) => (
                <div key={dsIndex} className="flex items-center text-xs text-gray-300">
                    <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: colors[dsIndex % colors.length] }}></span>
                    {dataset.label}
                </div>
            ))}
        </div>
    </div>
  );
};


const DataPlayerModal: React.FC<{ state: DataPlayerState; onClose: () => void; }> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl m-4 border border-blue-600/30 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-gray-700/50 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-blue-300 flex items-center">
            <i className="fas fa-chart-pie mr-4"></i>
            Dashboard de Análise: <span className="text-white ml-2">{state.title}</span>
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </header>

        {state.isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <i className="fas fa-spinner fa-spin text-5xl text-blue-400"></i>
            <p className="mt-4 text-gray-400">Analisando dados e construindo dashboard...</p>
          </div>
        ) : (
          <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Summary & Metrics */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Resumo Executivo</h3>
                <p className="text-sm text-gray-400">{state.summary}</p>
              </div>
              <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Métricas Chave</h3>
                <div className="space-y-3">
                  {state.keyMetrics.map(metric => (
                    <div key={metric.label} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                      <span className="text-sm text-gray-300">{metric.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{metric.value}</span>
                        <TrendIcon trend={metric.trend} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 2: Chart & Timeline */}
            <div className="md:col-span-2 space-y-6">
              {state.chartData && <SimpleBarChart data={state.chartData} />}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                 <h3 className="text-lg font-semibold text-gray-200 mb-3">Linha do Tempo</h3>
                 <div className="relative border-l-2 border-gray-600/50 ml-3">
                    {state.timeline.map((item, index) => (
                        <div key={index} className="mb-4 ml-6">
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-900 rounded-full -left-3 ring-8 ring-gray-900/80">
                                <i className="fas fa-calendar-alt text-blue-300 text-xs"></i>
                            </span>
                            <h4 className="font-semibold text-blue-300">{item.date}</h4>
                            <p className="text-sm text-gray-400">{item.event}</p>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
            
            {/* Full width row at bottom: Pros/Cons */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-3"><i className="fas fa-plus-circle mr-2"></i>Pontos Positivos</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {state.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
               </div>
               <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-400 mb-3"><i className="fas fa-minus-circle mr-2"></i>Pontos a Considerar</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {state.cons.map((con, i) => <li key={i}>{con}</li>)}
                </ul>
               </div>
            </div>

          </main>
        )}
      </div>
    </div>
  );
};

export default DataPlayerModal;