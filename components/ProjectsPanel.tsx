import React, { useState } from 'react';
import { Project, PersistenceMode } from '../types';

interface ProjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Record<string, Project>;
  activeProjectId: string | null;
  onSetActiveProject: (id: string | null) => void;
  onCreateProject: (name: string, description: string) => void;
  onAddFile: (projectId: string, fileHandle: FileSystemFileHandle) => void;
  onExportProject: (projectId: string) => void;
  storageMode: PersistenceMode;
}

const ProjectCreationForm: React.FC<{
  onCreate: (name: string, description: string) => void;
  onCancel: () => void;
}> = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, description);
    }
  };

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <h4 className="font-bold text-lg mb-3 text-white">Criar Novo Projeto</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Nome do Projeto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <textarea
          placeholder="Breve descrição do projeto"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 font-semibold">
            Criar
          </button>
        </div>
      </form>
    </div>
  );
};

const ProjectDetailView: React.FC<{
    project: Project;
    onAddFile: () => void;
    onExport: () => void;
    storageMode: PersistenceMode;
}> = ({ project, onAddFile, onExport, storageMode }) => {
    const { phase, percentage } = project.progress;
    const phaseConfig = {
        orientation: { color: 'bg-yellow-500', label: 'Orientação' },
        cocreation: { color: 'bg-blue-500', label: 'Co-criação' },
        review: { color: 'bg-green-500', label: 'Revisão' },
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <h4 className="text-lg font-bold text-gray-200">{project.name}</h4>
                <p className="text-xs text-gray-400">{project.description}</p>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-300">{phaseConfig[phase].label}</span>
                    <span className="text-xs font-bold text-white">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={`${phaseConfig[phase].color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>

            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <h5 className="font-semibold text-sm mb-2 text-gray-300">Arquivos de Contexto</h5>
                {project.attachedFiles.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhum arquivo anexado.</p>
                ) : (
                    <ul className="space-y-2">
                        {project.attachedFiles.map(file => (
                            <li key={file.name} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                                <div className="flex items-center overflow-hidden">
                                    <i className={`fas ${file.type === 'pdf' ? 'fa-file-pdf' : 'fa-file-alt'} mr-2 text-red-400`}></i>
                                    <span className="text-xs text-gray-300 truncate">{file.name}</span>
                                </div>
                                {file.summary === 'Analisando...' && <i className="fas fa-spinner fa-spin text-xs text-yellow-400" title="Analisando..."></i>}
                            </li>
                        ))}
                    </ul>
                )}
                 <button
                    onClick={onAddFile}
                    disabled={storageMode === 'demo'}
                    className="w-full mt-3 text-xs bg-blue-800/60 hover:bg-blue-700/60 text-blue-200 py-1.5 px-2 rounded-md transition-colors disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                     <i className="fas fa-plus mr-2"></i>Adicionar Arquivo
                </button>
                {storageMode === 'demo' && <p className="text-[10px] text-gray-600 text-center mt-1">O upload de arquivos está disponível apenas no modo de armazenamento local.</p>}
            </div>

            <button
                onClick={onExport}
                className="w-full text-sm bg-green-800/80 hover:bg-green-700 text-green-100 py-2 px-3 rounded-md transition-colors flex items-center justify-center"
            >
                <i className="fas fa-file-markdown mr-2"></i>Exportar Resumo
            </button>
        </div>
    );
};

const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  isOpen, onClose, projects, activeProjectId, onSetActiveProject,
  onCreateProject, onAddFile, onExportProject, storageMode
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const projectList = Object.values(projects).sort((a: Project, b: Project) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCreateProject = (name: string, description: string) => {
    onCreateProject(name, description);
    setIsCreating(false);
  };
  
  const handleAddFile = async () => {
      if (!activeProjectId) return;
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
            types: [{ description: 'Documentos', accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt', '.md'] } }],
        });
        onAddFile(activeProjectId, fileHandle);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log("Seleção de arquivo cancelada.");
        } else {
          console.error("Erro ao selecionar arquivo:", err);
        }
      }
  };

  return (
    <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-folder mr-3"></i>
          {activeProjectId ? 'Espaço do Projeto' : 'Meus Projetos'}
        </h3>
        {activeProjectId ? (
            <button onClick={() => onSetActiveProject(null)} className="text-sm text-gray-400 hover:text-white flex items-center">
                <i className="fas fa-arrow-left mr-2"></i> Voltar
            </button>
        ) : (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <i className="fas fa-times"></i>
            </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {activeProjectId && projects[activeProjectId] ? (
            <ProjectDetailView project={projects[activeProjectId]} onAddFile={handleAddFile} onExport={() => onExportProject(activeProjectId)} storageMode={storageMode} />
        ) : (
          <div className="p-4 space-y-3">
            {isCreating ? (
              <ProjectCreationForm onCreate={handleCreateProject} onCancel={() => setIsCreating(false)} />
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full text-sm bg-blue-800/80 hover:bg-blue-700 text-white py-2.5 px-3 rounded-md transition-colors flex items-center justify-center font-semibold"
              >
                <i className="fas fa-plus mr-2"></i> Criar Novo Projeto
              </button>
            )}

            {projectList.length === 0 && !isCreating ? (
              <div className="text-center text-gray-500 pt-8">
                <i className="fas fa-box-open text-3xl mb-3"></i>
                <p className="text-sm">Nenhum projeto ainda.</p>
              </div>
            ) : (
              projectList.map((p: Project) => (
                <button
                  key={p.id}
                  onClick={() => onSetActiveProject(p.id)}
                  className="w-full text-left p-3 rounded-lg bg-gray-700/70 hover:bg-gray-600/70 transition-transform duration-200 transform hover:-translate-y-0.5"
                >
                  <p className="font-semibold text-gray-200">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPanel;
