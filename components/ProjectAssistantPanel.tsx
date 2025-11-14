import React from 'react';
import { ProjectAssistantState } from '../types';

interface ProjectAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assistantState: ProjectAssistantState;
  onStateChange: (newState: ProjectAssistantState) => void;
  onDefineProject: (goal: string, tech: string, ideas: string) => void;
  isModeActive: boolean;
  onToggleMode: () => void;
}

const ProjectAssistantPanel: React.FC<ProjectAssistantPanelProps> = ({
  isOpen,
  onClose,
  assistantState,
  onStateChange,
  onDefineProject,
  isModeActive,
  onToggleMode,
}) => {
  const { userGoal, userTech, userIdeas, generatedPlan, isLoading, error } = assistantState;

  const handleDefineProject = () => {
    onDefineProject(userGoal, userTech, userIdeas);
  };

  const ResultDisplay = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 p-8">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-blue-400"></i>
          <p className="font-semibold">Analisando sua ideia...</p>
          <p className="text-sm">Buscando as melhores tecnologias e montando seu plano de projeto.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-red-400 p-8">
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p className="font-semibold">Ocorreu um Erro</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }
    
    if (!generatedPlan) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 p-8">
                <i className="fas fa-lightbulb text-5xl mb-4"></i>
                <p className="text-lg">Pronto para transformar sua ideia em um projeto.</p>
                <p className="mt-1">Preencha os campos acima e clique em "Definir Projeto".</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 animate-fade-in">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-bold text-gray-200 mb-2">Resumo do Projeto</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{generatedPlan.projectSummary}</p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-bold text-gray-200 mb-3">Stack de Tecnologia Recomendada</h4>
                <div className="space-y-3">
                    {generatedPlan.techStack.map(tech => (
                        <div key={tech.category}>
                            <p className="font-semibold text-blue-300">{tech.category}: <span className="font-normal text-white">{tech.recommendation}</span></p>
                            <p className="text-xs text-gray-400 pl-4 border-l-2 border-gray-600 ml-2 mt-1">{tech.reason}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-bold text-gray-200 mb-3">Plano de Ação (Passo a Passo)</h4>
                <ul className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    {generatedPlan.stepByStepPlan.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-bold text-gray-200 mb-3">Insights Proativos</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {generatedPlan.proactiveInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                </ul>
            </div>
        </div>
    )
  };

  return (
    <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-project-diagram mr-3 text-blue-400"></i>
          Assistente de Projeto
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <div className="p-4 shrink-0 border-b border-gray-700/50 bg-gray-800/20">
        <div className="flex items-center justify-between">
            <label htmlFor="assistant-mode-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" id="assistant-mode-toggle" className="sr-only" checked={isModeActive} onChange={onToggleMode} />
                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isModeActive ? 'transform translate-x-full bg-blue-400' : ''}`}></div>
                </div>
                <div className="ml-3 text-white font-semibold">
                    {isModeActive ? 'Modo Assistente Ativo' : 'Modo Assistente Inativo'}
                </div>
            </label>
            <p className="text-xs text-gray-500 max-w-sm text-right">Quando ativo, a IA focará exclusivamente em ajudar com o desenvolvimento do seu projeto em todas as interações.</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Input Section */}
        <div className="w-full md:w-1/3 p-4 flex flex-col space-y-4 border-b md:border-r md:border-b-0 border-gray-700/50 overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">1. Qual o objetivo do projeto?</label>
                <textarea 
                    placeholder="Ex: Criar um aplicativo web para gerenciar tarefas de uma pequena equipe."
                    rows={4}
                    value={userGoal}
                    onChange={e => onStateChange({...assistantState, userGoal: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">2. Quais tecnologias você conhece ou quer usar?</label>
                <textarea 
                    placeholder="Ex: Já tenho experiência com Python e gostaria de usar React no frontend."
                    rows={4}
                    value={userTech}
                    onChange={e => onStateChange({...assistantState, userTech: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">3. Quais são suas ideias iniciais?</label>
                <textarea 
                    placeholder="Ex: Pensei em ter um painel kanban e autenticação de usuários com o Google."
                    rows={4}
                    value={userIdeas}
                    onChange={e => onStateChange({...assistantState, userIdeas: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 text-gray-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
            </div>
            <button
                onClick={handleDefineProject}
                disabled={!userGoal.trim() || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Analisando...</> : <><i className="fas fa-cogs mr-2"></i>Definir Projeto</>}
            </button>
        </div>

        {/* Output Section */}
        <div className="w-full md:w-2/3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <ResultDisplay />
        </div>
      </div>
    </div>
  );
};

export default ProjectAssistantPanel;
