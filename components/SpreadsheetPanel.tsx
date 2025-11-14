import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpreadsheetState, ConnectionState, Cell, SpreadsheetCommand, SpreadsheetVersion, Anomaly } from '../types';
import StatusIndicator from './StatusIndicator';
import MarkdownRenderer from './MarkdownRenderer';

const indexToColLetter = (index: number): string => {
    let temp, letter = '';
    while (index >= 0) {
        temp = index % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
};

interface ResizableTableProps {
    title: string;
    data: string[][] | Cell[][];
    zoom: number;
    onZoom: (direction: 'in' | 'out' | 'reset') => void;
    selectedRows: Set<number>;
    onRowHeaderClick: (rowIndex: number, event: React.MouseEvent) => void;
    onCopyData: () => void;
    justCopied: boolean;
}

const ResizableTable: React.FC<ResizableTableProps> = ({ title, data, zoom, onZoom, selectedRows, onRowHeaderClick, onCopyData, justCopied }) => {
    const rowCount = data.length > 0 ? data.length - 1 : 0;

    const headers = data[0] || [];
    const body = data.slice(1);

    const getCellStyle = (cell: Cell | string) => {
      if (typeof cell === 'object' && cell !== null && 'style' in cell) {
        return cell.style || {};
      }
      return {};
    }

    const getCellValue = (cell: Cell | string) => {
       if (typeof cell === 'object' && cell !== null && 'value' in cell) {
        return cell.value;
      }
      return cell as string;
    }

    return (
        <div className="bg-[var(--sp-bg-secondary)] p-3 rounded-lg border border-[var(--sp-border-primary)] flex-1 flex flex-col min-h-0 h-full">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-[var(--sp-text-primary)]">{title}</h3>
                    {rowCount > 0 && <p className="text-xs text-[var(--sp-text-secondary)]">({rowCount} linhas)</p>}
                </div>
                <div className="flex items-center space-x-1 text-[var(--sp-text-primary)]">
                    <button onClick={onCopyData} className="w-7 h-7 rounded-full hover:bg-[var(--sp-bg-hover)]" title="Copiar Dados da Tabela">
                        <i className={`fas ${justCopied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                    </button>
                    <div className="w-px h-4 bg-[var(--sp-border-secondary)]"></div>
                    <button onClick={() => onZoom('out')} className="w-6 h-6 rounded-full hover:bg-[var(--sp-bg-hover)]"><i className="fas fa-search-minus"></i></button>
                    <button onClick={() => onZoom('reset')} className="text-xs font-semibold px-2" title="Resetar Zoom">{Math.round(zoom * 100)}%</button>
                    <button onClick={() => onZoom('in')} className="w-6 h-6 rounded-full hover:bg-[var(--sp-bg-hover)]"><i className="fas fa-search-plus"></i></button>
                </div>
            </div>
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
                    <table className="w-full text-xs text-left text-[var(--sp-text-primary)] border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-[var(--sp-bg-tertiary)] z-10">
                            <tr>
                                <th className="p-2 border-b border-r border-[var(--sp-border-secondary)] w-12 text-center sticky left-0 bg-[var(--sp-bg-tertiary)] z-20"></th>
                                {headers.map((_, index) => (
                                    <th key={index} className="p-1 text-center font-mono text-xs text-[var(--sp-text-secondary)] border-b border-r border-[var(--sp-border-secondary)]">
                                        {indexToColLetter(index)}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                <th className="p-2 border-b border-r border-[var(--sp-border-secondary)] w-12 text-center sticky left-0 bg-[var(--sp-bg-tertiary)] z-20">#</th>
                                {headers.map((header, index) => {
                                    const headerValue = getCellValue(header);
                                    const headerStyle = getCellStyle(header);
                                    return <th key={index} style={headerStyle} className="p-2 border-b border-r border-[var(--sp-border-secondary)]">{headerValue}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {body.map((row, rowIndex) => {
                                const isSelected = selectedRows.has(rowIndex);
                                return (
                                <tr key={rowIndex} className={`transition-colors ${isSelected ? 'bg-[var(--sp-bg-selected)]' : 'hover:bg-[var(--sp-bg-hover)]'}`}>
                                    <td 
                                        className={`p-2 text-center sticky left-0 cursor-pointer select-none border-b border-r border-[var(--sp-border-primary)] ${isSelected ? 'bg-[var(--sp-bg-selected)]' : 'bg-[var(--sp-bg-tertiary)]'}`}
                                        onClick={(e) => onRowHeaderClick(rowIndex, e)}
                                    >
                                        {rowIndex + 1}
                                    </td>
                                    {(row as (Cell | string)[]).map((cell, cellIndex) => {
                                        const cellValue = getCellValue(cell);
                                        const cellStyle = getCellStyle(cell);
                                        return (
                                            <td key={cellIndex} className="p-2 truncate border-b border-r border-[var(--sp-border-primary)]" title={cellValue} style={cellStyle}>
                                                {cellValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


interface SpreadsheetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetState: SpreadsheetState;
  onFileChange: (file: File) => void;
  onDownload: () => void;
  onEject: () => void;
  toggleConversationMode: () => void;
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;
  onUndo: () => void;
  onRevertToVersion: (index: number) => void;
  onCommandFeedback: (commandId: string, feedback: 'liked' | 'disliked') => void;
}

const SpreadsheetPanel: React.FC<SpreadsheetPanelProps> = (props) => {
    const { 
        isOpen, onClose, spreadsheetState, onFileChange, onDownload, onEject, 
        toggleConversationMode, connectionState, isLoading, error,
        onUndo, onRevertToVersion, onCommandFeedback
    } = props;

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [justCopied, setJustCopied] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { fileName, originalData, processedData, assistantOutput, commandHistory = [], versionHistory = [] } = spreadsheetState;
    const isSessionActive = connectionState !== ConnectionState.IDLE && connectionState !== ConnectionState.ERROR;

    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const lastClickedRow = useRef<number | null>(null);
    const [zoom, setZoom] = useState(1);
    
    const handleCopyData = useCallback(() => {
        if (!processedData || processedData.length === 0) return;
    
        // Create a tab-separated values (TSV) string.
        // This format is universally understood by spreadsheet software (Excel, Google Sheets) and text editors,
        // preserving the table structure upon pasting.
        const tsvContent = processedData.map(row =>
            (row as Cell[]).map(cell => {
                // Get the clean value, and replace any newlines or tabs within the cell's data
                // to prevent breaking the table structure on paste.
                const cellValue = (cell?.value ?? '').replace(/\r?\n|\t/g, ' ');
                return cellValue;
            }).join('\t') // Join cells with a TAB character
        ).join('\n'); // Join rows with a NEWLINE character
    
        navigator.clipboard.writeText(tsvContent).then(() => {
            setJustCopied(true);
            setTimeout(() => setJustCopied(false), 2000);
        }).catch(err => {
            console.error("Falha ao copiar dados para a área de transferência:", err);
            alert("Falha ao copiar dados. Verifique as permissões do navegador.");
        });
    }, [processedData]);

    const handleRowHeaderClick = useCallback((rowIndex: number, event: React.MouseEvent) => {
        if (event.shiftKey && lastClickedRow.current !== null) {
            const start = Math.min(lastClickedRow.current, rowIndex);
            const end = Math.max(lastClickedRow.current, rowIndex);
            const rangeSelection = new Set<number>();
            for (let i = start; i <= end; i++) {
                rangeSelection.add(i);
            }
            setSelectedRows(rangeSelection);
        } else if (event.metaKey || event.ctrlKey) {
            const newSelectedRows = new Set(selectedRows);
            if (newSelectedRows.has(rowIndex)) {
                newSelectedRows.delete(rowIndex);
            } else {
                newSelectedRows.add(rowIndex);
            }
            setSelectedRows(newSelectedRows);
            lastClickedRow.current = rowIndex;
        } else {
            const newSelectedRows = new Set<number>();
            if (!(selectedRows.has(rowIndex) && selectedRows.size === 1)) {
                newSelectedRows.add(rowIndex);
            }
            setSelectedRows(newSelectedRows);
            lastClickedRow.current = rowIndex;
        }
    }, [selectedRows]);

    const handleFile = (file: File) => {
        if (file && file.type === 'text/csv') {
            setSelectedRows(new Set());
            lastClickedRow.current = null;
            onFileChange(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };
    
    const handleZoom = (direction: 'in' | 'out' | 'reset') => {
        if (direction === 'in') setZoom(z => Math.min(2, z + 0.1));
        else if (direction === 'out') setZoom(z => Math.max(0.5, z - 0.1));
        else setZoom(1);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 backdrop-blur-sm flex flex-col z-40 animate-fade-in spreadsheet-panel-${theme} bg-[var(--sp-bg-primary)] text-[var(--sp-text-primary)]`}>
            <header className="p-4 flex justify-between items-center border-b border-[var(--sp-border-primary)] shrink-0">
                <h3 className="text-lg font-semibold flex items-center">
                    <i className="fas fa-file-excel mr-3"></i> Processador de Planilhas (CSV)
                </h3>
                <div className="flex items-center space-x-2">
                     <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-8 h-8 flex items-center justify-center text-[var(--sp-text-secondary)] hover:bg-[var(--sp-bg-hover)] rounded-lg" title="Alternar Tema">
                        <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    {originalData.length > 0 && (
                        <>
                            <button onClick={onUndo} disabled={versionHistory.length === 0} className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed" title="Desfazer última ação">
                                <i className="fas fa-undo mr-2"></i> Desfazer
                            </button>
                             <div className="w-px h-6 bg-gray-600"></div>
                            <button onClick={onEject} className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-md transition-colors" title="Ejetar planilha e carregar nova">
                                <i className="fas fa-eject mr-2"></i> Ejetar
                            </button>
                            <button onClick={onDownload} disabled={isLoading || processedData.length === 0} className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-500">
                                <i className="fas fa-download mr-2"></i> Baixar
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </header>
            
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                {originalData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center" onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }} onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}>
                        <div onClick={() => fileInputRef.current?.click()} className={`p-10 border-4 ${isDragOver ? 'border-blue-500 bg-blue-900/20' : 'border-dashed border-[var(--sp-border-secondary)]'} rounded-2xl text-center cursor-pointer transition-colors`}>
                            <i className="fas fa-upload text-5xl text-[var(--sp-text-secondary)] mb-4"></i>
                            <p className="text-[var(--sp-text-primary)] font-semibold">Arraste e solte um arquivo .csv aqui</p>
                            <p className="text-[var(--sp-text-secondary)] text-sm">ou clique para selecionar</p>
                            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".csv" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Main Data View */}
                        <ResizableTable 
                            title={`Dados Processados: ${fileName}`} 
                            data={processedData} 
                            zoom={zoom} 
                            onZoom={handleZoom} 
                            selectedRows={selectedRows}
                            onRowHeaderClick={handleRowHeaderClick}
                            onCopyData={handleCopyData}
                            justCopied={justCopied}
                        />

                        {/* Control Deck */}
                        <div className="shrink-0 h-48 bg-[var(--sp-bg-secondary)] p-3 rounded-lg border border-[var(--sp-border-primary)] flex gap-4">
                            {/* Left Side: Mic & Status */}
                            <div className="w-1/4 flex flex-col items-center justify-center text-center p-2">
                                <button onClick={toggleConversationMode} disabled={connectionState === ConnectionState.CONNECTING} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${isSessionActive ? 'bg-red-600' : 'bg-blue-600 shadow-lg shadow-blue-500/50'} disabled:bg-gray-500 disabled:shadow-none`} title={isSessionActive ? 'Parar Sessão de Voz' : 'Iniciar Sessão de Voz'}>
                                    <i className={`fas ${connectionState === ConnectionState.CONNECTING ? 'fa-spinner fa-spin' : isSessionActive ? 'fa-stop' : 'fa-microphone-alt'} text-3xl text-white`}></i>
                                </button>
                                <div className="mt-2 h-5">
                                    <StatusIndicator state={isLoading ? ConnectionState.THINKING : connectionState} />
                                    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                                </div>
                            </div>
                            <div className="w-px bg-[var(--sp-border-primary)] h-full"></div>

                            {/* Right Side: Analysis & History */}
                            <div className="flex-1 flex gap-4 min-w-0">
                                <div className="w-1/2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-2">
                                     <h4 className="text-sm font-bold text-blue-300 mb-2 sticky top-0 bg-[var(--sp-bg-secondary)] backdrop-blur-sm pb-1">Análise da IA / Relatório</h4>
                                     {assistantOutput ? (
                                        typeof assistantOutput === 'string' ? (
                                            <MarkdownRenderer content={assistantOutput} searchTerm="" className="text-xs"/>
                                        ) : (
                                            <div className="space-y-2 text-xs">
                                                {assistantOutput.map((anomaly, i) => (
                                                    <div key={i} className="p-1.5 rounded-md bg-yellow-900/30">
                                                        <p className="font-semibold text-yellow-300">
                                                            {anomaly.issue} em '{anomaly.column}'
                                                        </p>
                                                        <p className="text-gray-400">Linha {anomaly.row}: {anomaly.value}</p>
                                                        {anomaly.suggestion && <p className="text-gray-500 italic text-[10px] mt-1">Sugestão: {anomaly.suggestion}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                     ) : <p className="text-xs text-[var(--sp-text-secondary)] italic">A análise inicial da IA aparecerá aqui.</p>}
                                </div>
                                <div className="w-1/2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-2">
                                    <h4 className="text-sm font-bold text-blue-300 mb-2 sticky top-0 bg-[var(--sp-bg-secondary)] backdrop-blur-sm pb-1">Histórico de Comandos</h4>
                                    {commandHistory.length === 0 ? <p className="text-xs text-[var(--sp-text-secondary)] italic">As ações realizadas aparecerão aqui.</p> : (
                                        <div className="space-y-2 text-xs">
                                            {commandHistory.map(cmd => (
                                                <div key={cmd.id} className={`p-1.5 rounded-md ${cmd.status === 'error' ? 'bg-red-900/30' : 'bg-[var(--sp-bg-tertiary)]'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-grow min-w-0">
                                                            <p className="font-semibold text-[var(--sp-text-primary)] truncate" title={cmd.command}>“{cmd.command}”</p>
                                                            {cmd.toolCalls.map((tc, i) => <p key={i} className="text-[var(--sp-text-secondary)] font-mono text-[10px] truncate ml-2"><i className="fas fa-cogs mr-1"></i>{tc.name}</p>)}
                                                            {cmd.status === 'error' && <p className="text-red-400 text-[10px] ml-2 mt-0.5">Erro: {cmd.errorMessage}</p>}
                                                        </div>
                                                        <div className="flex space-x-1 flex-shrink-0 ml-1">
                                                            <button onClick={() => onCommandFeedback(cmd.id, 'liked')} className={`w-5 h-5 rounded text-xs ${cmd.feedback === 'liked' ? 'text-green-400 bg-green-900/50' : 'text-gray-500 hover:text-green-400'}`} title="Gostei"><i className="fas fa-thumbs-up"></i></button>
                                                            <button onClick={() => onCommandFeedback(cmd.id, 'disliked')} className={`w-5 h-5 rounded text-xs ${cmd.feedback === 'disliked' ? 'text-red-400 bg-red-900/50' : 'text-gray-500 hover:text-red-400'}`} title="Não Gostei"><i className="fas fa-thumbs-down"></i></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SpreadsheetPanel;