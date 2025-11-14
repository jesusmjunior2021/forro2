import React from 'react';
import { UserProfile } from '../types';
import RadarChart from './RadarChart';

interface RadarChartContainerProps {
    data: {
        user: number[];
        ai: number[];
    };
    labels: string[];
}

const RadarChartContainer: React.FC<RadarChartContainerProps> = ({ data, labels }) => {
    const size = 220;
    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                 {/* This container ensures both charts are perfectly overlaid */}
                <div className="absolute top-0 left-0">
                    <RadarChart data={data.user} labels={labels} size={size} color="rgba(59, 130, 246, 0.4)" />
                </div>
                <div className="absolute top-0 left-0">
                    <RadarChart data={data.ai} labels={labels} size={size} color="rgba(167, 139, 250, 0.4)" />
                </div>
            </div>
            <div className="flex space-x-4 mt-3 text-xs">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Seu Perfil</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-violet-400 mr-2"></span>Perfil da IA</div>
            </div>
        </div>
    );
};

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: UserProfile | null;
  isLoading: boolean;
  onUpdateProfile: () => void;
}

const InfoSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
        <h4 className="font-bold text-gray-200 text-sm mb-3 flex items-center">
            <i className={`fas ${icon} mr-2 text-blue-400`}></i>
            {title}
        </h4>
        {children}
    </div>
);

const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ isOpen, onClose, profileData, isLoading, onUpdateProfile }) => {
    
    // Static data for the radar chart example
    const chartData = {
        user: [0.7, 0.8, 0.5, 0.9], // Formal, Objective, Proactive, Brief
        ai:   [0.8, 0.9, 0.8, 0.6],
    };
    const chartLabels = ['Formalidade', 'Objetividade', 'Proatividade', 'Brevidade'];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500">
                    <i className="fas fa-sync-alt fa-spin text-4xl mb-3 text-blue-400"></i>
                    <p className="text-sm">Analisando conversas e atualizando perfil...</p>
                </div>
            );
        }
        
        if (!profileData) {
             return (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500">
                <i className="fas fa-comment-dots text-4xl mb-3"></i>
                <p className="text-sm">O perfil do usuário será gerado aqui após algumas conversas.</p>
                <p className="text-xs mt-1">Inicie ou encerre uma conversa para gerar o primeiro perfil.</p>
              </div>
            );
        }
    
      return (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <InfoSection title="Radar de Comunicação" icon="fa-broadcast-tower">
                <RadarChartContainer data={chartData} labels={chartLabels} />
            </InfoSection>
    
            <InfoSection title="Resumo do Perfil" icon="fa-file-alt">
                <p className="text-xs text-gray-300 leading-relaxed">{profileData.summary}</p>
            </InfoSection>
    
            <InfoSection title="Tópicos de Interesse" icon="fa-tags">
                <div className="flex flex-wrap gap-2">
                    {profileData.keyTopics.map((topic, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-blue-900/70 text-blue-200 rounded-full">
                            {topic}
                        </span>
                    ))}
                </div>
            </InfoSection>
            
            <InfoSection title="Sugestões de Exploração" icon="fa-shoe-prints">
                 <ul className="space-y-2">
                    {profileData.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start">
                            <i className="fas fa-chevron-right text-blue-500 text-[10px] mr-2 mt-1"></i>
                            <span className="text-xs text-gray-300">{step}</span>
                        </li>
                    ))}
                </ul>
            </InfoSection>
        </div>
      );
    }

  return (
    <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
        <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <i className="fas fa-chart-pie mr-3"></i>
                Perfil de Usuário
            </h3>
            <div className="flex items-center space-x-2">
                 <button onClick={onUpdateProfile} disabled={isLoading} className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed" title="Atualizar Perfil Manualmente">
                    <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </header>
        {renderContent()}
    </div>
  );
};

export default UserProfilePanel;