import React, { useState } from 'react';
import InstallationGuideModal from './InstallationGuideModal';
import { calculateCeilingMaterials } from '../utils/calculationUtils';
import { CalculationResults, OptimizationResult, CeilingType, Product } from '../types';


declare const jspdf: any;
declare const XLSX: any;

interface ForroCalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const ForroCalculatorPanel: React.FC<ForroCalculatorPanelProps> = ({ isOpen, onClose, products }) => {
    const [length, setLength] = useState<number | string>('');
    const [width, setWidth] = useState<number | string>('');
    const [ceilingType, setCeilingType] = useState<CeilingType | null>(null);
    
    // States for optimization
    const [panelLength, setPanelLength] = useState<number | string>(1.80);
    const [panelWidth, setPanelWidth] = useState<number | string>(1.20);
    const [wastePercentage, setWastePercentage] = useState<number | string>(10);

    const [results, setResults] = useState<CalculationResults | null>(null);
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const handleCalculate = () => {
        const l = Number(length);
        const w = Number(width);
        const pL = Number(panelLength);
        const pW = Number(panelWidth);
        const waste = Number(wastePercentage);

        if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
            setError('Por favor, insira o comprimento e a largura válidos.');
            setResults(null);
            setOptimizationResult(null);
            return;
        }
        if (!ceilingType) {
            setError('Por favor, selecione um tipo de forro.');
            setResults(null);
            setOptimizationResult(null);
            return;
        }
        if (ceilingType === 'drywall' && (isNaN(pL) || isNaN(pW) || pL <= 0 || pW <= 0 || isNaN(waste) || waste < 0)) {
            setError('Por favor, insira dimensões de placa e porcentagem de perda válidas.');
            setOptimizationResult(null);
            return;
        }
        
        try {
            // Fix: Pass the 'products' array to the calculateCeilingMaterials function to satisfy its signature.
            const { results: newResults, optimizationResult: newOptimizationResult } = calculateCeilingMaterials(
                l, w, ceilingType, { panelLength: pL, panelWidth: pW, wastePercentage: waste }, products
            );
            setResults(newResults);
            setOptimizationResult(newOptimizationResult);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro de cálculo desconhecido.');
            setResults(null);
            setOptimizationResult(null);
        }
    };
    
    const handleGeneratePDF = () => {
        if (!results || !length || !width || !ceilingType) return;

        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('pt-BR');
        
        doc.setFontSize(18);
        doc.text("Orçamento de Materiais para Forro", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Data: ${today}`, 14, 29);

        doc.setFontSize(12);
        doc.text("Parâmetros do Cálculo:", 14, 40);
        doc.setFontSize(10);
        doc.text(`- Comprimento: ${length} m`, 14, 46);
        doc.text(`- Largura: ${width} m`, 14, 52);
        doc.text(`- Tipo de Forro: ${ceilingType}`, 14, 58);
        doc.text(`- Área Total: ${results.area} m²`, 14, 64);
        
        let y = 74;
        if (optimizationResult) {
            doc.text(`- Margem de Perda: ${optimizationResult.wastePercentage}%`, 14, y);
            y += 10;
        }

        doc.setFontSize(12);
        doc.text("Lista de Materiais Estimados:", 14, y + 6);
        y += 14;
        
        const addLine = (label: string, value: number, unit: string) => {
            if (value > 0) {
                doc.setFontSize(10);
                doc.text(`- ${label}:`, 14, y);
                doc.text(`${value} ${unit}`, 100, y);
                y += 7;
            }
        };

        addLine(results.panels.description, results.panels.count, "unidades");
        addLine(results.mainStructure.description, results.mainStructure.count, "unidades");
        if (results.secondaryStructure) addLine(results.secondaryStructure.description, results.secondaryStructure.count, "unidades");
        addLine(results.finishingProfiles.description, results.finishingProfiles.count, "unidades");
        if (results.hangers) addLine("Tirantes/Pendurais", results.hangers, "unidades");
        addLine("Parafusos (aprox.)", results.screws, "unidades");
        addLine("Cantoneiras de Canto", results.corners, "unidades");
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        const disclaimer = "*Esta é uma estimativa e não substitui o projeto de um profissional. As quantidades podem variar\nconforme o método de instalação e especificidades do local. Considere uma margem de 10% para perdas.";
        doc.text(disclaimer, 14, y + 10);
        
        doc.save("orcamento-forro.pdf");
    };

    const handleGenerateXLS = () => {
        if (!results || !length || !width || !ceilingType) return;

        const data: (string | number)[][] = [
            ["Orçamento de Materiais para Forro"], [],
            ["Parâmetros do Cálculo"],
            ["Comprimento", `${length} m`], ["Largura", `${width} m`], ["Tipo de Forro", ceilingType], ["Área Total", `${results.area} m²`]
        ];
        if (optimizationResult) data.push(["Margem de Perda", `${optimizationResult.wastePercentage}%`]);
        data.push([], ["Lista de Materiais Estimados"], ["Item", "Quantidade", "Unidade"]);


        const addRow = (label: string, value: number, unit: string) => {
            if (value > 0) data.push([label, value, unit]);
        };

        addRow(results.panels.description, results.panels.count, "unidades");
        addRow(results.mainStructure.description, results.mainStructure.count, "unidades");
        if (results.secondaryStructure) addRow(results.secondaryStructure.description, results.secondaryStructure.count, "unidades");
        addRow(results.finishingProfiles.description, results.finishingProfiles.count, "unidades");
        if (results.hangers) addRow("Tirantes/Pendurais", results.hangers, "unidades");
        addRow("Parafusos (aprox.)", results.screws, "unidades");
        addRow("Cantoneiras de Canto", results.corners, "unidades");

        data.push([]);
        data.push(["*Esta é uma estimativa e não substitui o projeto de um profissional."]);

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orçamento Forro");
        XLSX.writeFile(wb, "orcamento-forro.xlsx");
    };

    const ResultItem: React.FC<{label: string, value: string | number, unit: string, isImportant?: boolean, description?: string}> = ({label, value, unit, isImportant, description}) => (
         <div className="result-item" title={description}>
            <span className={isImportant ? "text-cyan-300 font-bold" : "text-gray-300"}>{label}</span>
            <span className={isImportant ? "font-bold text-lg text-cyan-300" : "font-semibold"}>{value} {unit}</span>
        </div>
    );
    
    return (
        <>
            <div className={`slate-panel w-full max-w-2xl ${isOpen ? 'open' : ''} flex flex-col`}>
                <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                        <i className="fas fa-ruler-combined mr-3"></i>
                        Calculadora de Materiais para Forro
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                        <h4 className="font-bold text-gray-200 text-center mb-2">1. Dimensões do Ambiente (em metros)</h4>
                        <div className="room-dimension-input-wrapper">
                            <div className="room-dimension-input width">
                                <label className="text-xs text-gray-400">Largura</label>
                                <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="Ex: 4.5" className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-2 py-1 mt-1 text-center" />
                            </div>
                            <div className="room-schematic">Vista Superior</div>
                            <div className="room-dimension-input length">
                                <label className="text-xs text-gray-400">Comprimento</label>
                                <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="Ex: 6.0" className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-2 py-1 mt-1 text-center" />
                            </div>
                        </div>
                        
                        <h4 className="font-bold text-gray-200 text-center mt-8 mb-4">2. Tipo de Forro</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <button onClick={() => setCeilingType('drywall')} className={`ceiling-type-card p-4 border-2 rounded-lg text-center ${ceilingType === 'drywall' ? 'selected' : 'border-gray-600 hover:border-blue-500'}`}>
                                <i className="fas fa-layer-group text-3xl mb-2"></i>
                                <h5 className="font-bold">Drywall (Gesso)</h5>
                                <p className="text-xs text-gray-400">Estrutura com perfis F530 e canaletas.</p>
                            </button>
                            <button onClick={() => setCeilingType('pvc-liso')} className={`ceiling-type-card p-4 border-2 rounded-lg text-center ${ceilingType === 'pvc-liso' ? 'selected' : 'border-gray-600 hover:border-blue-500'}`}>
                                <i className="fas fa-grip-lines text-3xl mb-2"></i>
                                <h5 className="font-bold">PVC Liso (Branco)</h5>
                                <p className="text-xs text-gray-400">Estrutura com metalons para réguas.</p>
                            </button>
                        </div>

                        {ceilingType === 'drywall' && (
                            <div className="mt-6 pt-4 border-t border-gray-700/50 animate-fade-in">
                                <h4 className="font-bold text-gray-200 text-center mb-4">3. Configurações da Placa (Drywall)</h4>
                                <div className="flex justify-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-400">Comprimento da Placa (m)</label>
                                        <input type="number" value={panelLength} onChange={e => setPanelLength(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-400">Largura da Placa (m)</label>
                                        <input type="number" value={panelWidth} onChange={e => setPanelWidth(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                                    </div>
                                     <div className="flex-1">
                                        <label className="text-sm text-gray-400">Margem de Perda (%)</label>
                                        <input type="number" value={wastePercentage} onChange={e => setWastePercentage(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                        <i className="fas fa-calculator mr-2"></i> Calcular Materiais
                    </button>
                    
                    {error && <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md text-center">{error}</div>}

                    {results && (
                        <div className="space-y-4 animate-fade-in">
                            {optimizationResult && (
                                <div className="result-card bg-gray-900/50 border-cyan-500">
                                    <h4 className="font-bold text-lg text-white mb-3">Plano de Corte Otimizado (Drywall)</h4>
                                    <p className="text-sm text-cyan-300 mb-3"><i className="fas fa-lightbulb mr-2"></i>{optimizationResult.description}</p>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-1/3">
                                            <div className="aspect-square bg-gray-800 border-2 border-gray-600 rounded grid p-1 gap-1" style={{gridTemplateColumns: `repeat(${optimizationResult.schematic.cols}, 1fr)`}}>
                                                {Array.from({length: optimizationResult.totalPanelsNoWaste}).map((_, i) => <div key={i} className="bg-cyan-600/50 rounded-sm"></div>)}
                                            </div>
                                        </div>
                                        <div className="w-2/3 space-y-2 text-sm">
                                            <div className="flex justify-between"><span>Placas Inteiras:</span><span className="font-semibold">{optimizationResult.fullPanels}</span></div>
                                            <div className="flex justify-between"><span>Placas com Recorte:</span><span className="font-semibold">{optimizationResult.cutPanels}</span></div>
                                            <div className="flex justify-between border-t border-gray-700 pt-2"><span>Total (sem perda):</span><span className="font-semibold">{optimizationResult.totalPanelsNoWaste}</span></div>
                                            <div className="flex justify-between"><span>Margem de Perda:</span><span className="font-semibold">{optimizationResult.wastePercentage}%</span></div>
                                            <div className="flex justify-between text-lg font-bold text-cyan-300 border-t-2 border-cyan-500/50 pt-2"><span>TOTAL A COMPRAR:</span><span>{optimizationResult.totalPanelsWithWaste}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="result-card">
                                <h4 className="font-bold text-lg text-white mb-2">Estimativa de Materiais</h4>
                                <ResultItem label="Área Total do Forro" value={results.area} unit="m²" />
                                <ResultItem label={results.panels.description} value={results.panels.count} unit="unidades" isImportant />
                                <ResultItem label={results.mainStructure.description} value={results.mainStructure.count} unit="unidades" isImportant />
                                {results.secondaryStructure && <ResultItem label={results.secondaryStructure.description} value={results.secondaryStructure.count} unit="unidades" isImportant />}
                                <ResultItem label={results.finishingProfiles.description} value={results.finishingProfiles.count} unit="unidades" />
                                {results.hangers !== undefined && <ResultItem label="Tirantes/Pendurais" value={results.hangers} unit="unidades" description="Para sustentação da estrutura na laje." />}
                                <ResultItem label="Parafusos (aprox.)" value={results.screws} unit="unidades" description="Estimativa para fixação da estrutura e das placas/réguas." />
                                <ResultItem label="Cantoneiras de Canto" value={results.corners} unit="unidades" description="Estimativa para 4 cantos internos." />
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                <button onClick={handleGeneratePDF} className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                                    <i className="fas fa-file-pdf mr-2"></i> Gerar Orçamento PDF
                                </button>
                                <button onClick={handleGenerateXLS} className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                                    <i className="fas fa-file-excel mr-2"></i> Gerar Orçamento XLS
                                </button>
                                {ceilingType === 'pvc-liso' && (
                                     <button onClick={() => setIsGuideOpen(true)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                                        <i className="fas fa-book-open mr-2"></i> Ver Guia de Instalação
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 text-center italic mt-4">
                                *Esta é uma estimativa e não substitui o projeto de um profissional. As quantidades podem variar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {isGuideOpen && <InstallationGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />}
        </>
    );
};

export default ForroCalculatorPanel;