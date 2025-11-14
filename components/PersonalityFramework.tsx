import React from 'react';
import RadarChart from './RadarChart';
import { PersonalityFrameworkData } from '../types';

interface PersonalityFrameworkProps {
    isOpen: boolean;
    onClose: () => void;
    data: PersonalityFrameworkData;
    onProcessWhiteboard: () => void;
    isProcessing: boolean;
}

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col items-center">
        {children}
        <h3 className="text-xs font-bold text-gray-300 mt-1">{title}</h3>
    </div>
);

const PersonalityFramework: React.FC<PersonalityFrameworkProps> = ({ isOpen, onClose, data, onProcessWhiteboard, isProcessing }) => {
    if (!isOpen) return null;

    const personalityLabels = ['Colérico', 'Melancólico', 'Sanguíneo', 'Fleumático', 'Cognitivo'];
    const contentLabels = ['Factual', 'Criativo', 'Técnico', 'Dialógico', 'Sintético'];
    const interactivityLabels = ['Imperativo', 'Exploratório', 'Colaborativo', 'Passivo', 'Socrático'];

    return (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-3xl z-30 animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-600/30 p-4">
                <header className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-blue-300 flex items-center">
                        <i className="fas fa-brain mr-3"></i> Framework de Personalidade da IA
                    </h2>
                     <div className="flex items-center space-x-2">
                        <button 
                            onClick={onProcessWhiteboard} 
                            disabled={isProcessing}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:text-gray-500" 
                            title="Processar Lousa Criativa para atualizar perfil"
                        >
                            <i className={`fas fa-sync-alt ${isProcessing ? 'fa-spin' : ''}`}></i>
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </header>
                <main className="flex justify-around items-center">
                    <ChartWrapper title="Perfil de Personalidade">
                        <RadarChart data={data.personality} labels={personalityLabels} color="rgba(236, 72, 153, 0.4)" />
                    </ChartWrapper>
                    <ChartWrapper title="Eixo de Conteúdo">
                        <RadarChart data={data.content} labels={contentLabels} color="rgba(34, 197, 94, 0.4)" />
                    </ChartWrapper>
                    <ChartWrapper title="Eixo de Interatividade">
                        <RadarChart data={data.interactivity} labels={interactivityLabels} color="rgba(250, 204, 21, 0.4)" />
                    </ChartWrapper>
                </main>
            </div>
        </div>
    );
};

export default PersonalityFramework;