import React, { useState } from 'react';
import { calculateScaffoldingMaterials } from '../utils/calculationUtils';
import { ScaffoldingCalculationResults } from '../types';


interface ScaffoldingCalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScaffoldingCalculatorPanel: React.FC<ScaffoldingCalculatorPanelProps> = ({ isOpen, onClose }) => {
    const [height, setHeight] = useState<number | string>('');
    const [length, setLength] = useState<number | string>('');
    const [width, setWidth] = useState<number | string>('');
    const [results, setResults] = useState<ScaffoldingCalculationResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = () => {
        const h = Number(height);
        const l = Number(length);
        const w = Number(width);

        if (isNaN(h) || isNaN(l) || isNaN(w) || h <= 0 || l <= 0 || w <= 0) {
            setError('Por favor, insira dimensões válidas para o andaime.');
            setResults(null);
            return;
        }
        
        try {
            const newResults = calculateScaffoldingMaterials(h, l, w);
            setResults(newResults);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro de cálculo desconhecido.');
            setResults(null);
        }
    };
    
    const ResultItem: React.FC<{label: string, value: string | number, unit: string, isImportant?: boolean, description?: string}> = ({label, value, unit, isImportant, description}) => (
         <div className="result-item" title={description}>
            <span className={isImportant ? "text-green-300 font-bold" : "text-gray-300"}>{label}</span>
            <span className={isImportant ? "font-bold text-lg text-green-300" : "font-semibold"}>{value} {unit}</span>
        </div>
    );

    return (
        <div className={`slate-panel w-full max-w-lg ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-calculator mr-3"></i>
                    Calculadora de Andaimes
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 space-y-4">
                    <h4 className="font-bold text-gray-200">1. Dimensões do Andaime (em metros)</h4>
                    <div>
                        <label className="text-sm text-gray-400">Altura</label>
                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="Ex: 10" className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Comprimento</label>
                        <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="Ex: 20" className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Largura</label>
                        <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="Ex: 1.5" className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                    </div>
                </div>

                <button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                    <i className="fas fa-magic mr-2"></i> Calcular Componentes
                </button>
                
                {error && <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md text-center">{error}</div>}

                {results && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="result-card">
                            <h4 className="font-bold text-lg text-white mb-2">Componentes de Andaime (Estimativa)</h4>
                            <ResultItem label="Área de Fachada" value={results.totalArea.toFixed(2)} unit="m²" />
                            <ResultItem label="Postes / Quadros" value={results.frames} unit="unidades" isImportant description="Estrutura vertical principal do andaime."/>
                            <ResultItem label="Diagonais (Travessas)" value={results.braces} unit="unidades" isImportant description="Barras diagonais que garantem a estabilidade estrutural." />
                            <ResultItem label="Plataformas / Pisos" value={results.platforms} unit="unidades" description="Superfície de trabalho do andaime." />
                            <ResultItem label="Sapatas / Bases" value={results.baseJacks} unit="unidades" description="Peças de base que nivelam o andaime no solo." />
                            <ResultItem label="Guarda-corpos" value={results.guardRails} unit="unidades" description="Proteção contra quedas no nível de trabalho superior." />
                        </div>
                        
                         <div className="result-card">
                            <h4 className="font-bold text-lg text-white mb-2">Ferramentas e EPIs Recomendados</h4>
                            <ResultItem label="Segurança (EPI)" value="Capacete, Cinto de Segurança, Luvas e Botas" unit="" description="Equipamento de Proteção Individual é obrigatório." />
                            <ResultItem label="Montagem" value="Martelo, Nível e Chaves de aperto" unit="" />
                            <ResultItem label="Isolamento" value="Sinalização de segurança e isolamento da área" unit="" />
                        </div>

                         <p className="text-xs text-gray-500 text-center italic mt-4">
                            *Esta é uma estimativa simplificada para andaimes de fachada. As quantidades podem variar conforme o tipo de andaime e normas técnicas. Consulte sempre um profissional qualificado.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScaffoldingCalculatorPanel;