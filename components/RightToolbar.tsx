import React, { useState } from 'react';

// Define a type for the props for better type checking
interface RightToolbarProps {
  toggleSettings: () => void;
  toggleHistory: () => void;
  toggleProjectsPanel: () => void;
  toggleSources: () => void;
  toggleRss: () => void;
  toggleCalendar: () => void;
  onLoadContacts: () => void;
  toggleDocumentEditor: () => void;
  toggleDocumentLibrary: () => void;
  toggleWhiteboard: () => void;
  toggleMap: () => void;
  toggleCarModel: () => void;
  toggleVertexSearch: () => void;
  toggleProjectAssistant: () => void;
  toggleUserProfile: () => void;
  toggleKnowledgeTree: () => void;
  toggleKnowledgeMap: () => void;
  toggleVideoteca: () => void; // Added prop
  toggleLiteraryArchive: () => void;
}

const RightToolbar: React.FC<RightToolbarProps> = ({
  toggleSettings,
  toggleHistory,
  toggleProjectsPanel,
  toggleSources,
  toggleRss,
  toggleCalendar,
  onLoadContacts,
  toggleDocumentEditor,
  toggleDocumentLibrary,
  toggleWhiteboard,
  toggleMap,
  toggleCarModel,
  toggleVertexSearch,
  toggleProjectAssistant,
  toggleUserProfile,
  toggleKnowledgeTree,
  toggleKnowledgeMap,
  toggleVideoteca, // Added prop
  toggleLiteraryArchive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttons = [
    { icon: 'fa-sliders-h', label: 'Configurações', action: toggleSettings },
    { icon: 'fa-chart-pie', label: 'Analisar Perfil', action: toggleUserProfile },
    { icon: 'fa-book-open', label: 'Histórico', action: toggleHistory },
    { icon: 'fa-play-circle', label: 'Videoteca', action: toggleVideoteca },
    { icon: 'fa-book-atlas', label: 'Arquivo Literário', action: toggleLiteraryArchive },
    { icon: 'fa-network-wired', label: 'Árvore de Conhecimento', action: toggleKnowledgeTree },
    { icon: 'fa-sitemap', label: 'Mapa do Conhecimento', action: toggleKnowledgeMap },
    { icon: 'fa-folder', label: 'Projetos', action: toggleProjectsPanel },
    { icon: 'fa-file-alt', label: 'Editor', action: toggleDocumentEditor },
    { icon: 'fa-book-reader', label: 'Biblioteca de Documentos', action: toggleDocumentLibrary },
    { icon: 'fa-newspaper', label: 'Notícias', action: toggleRss },
    { icon: 'fa-calendar-alt', label: 'Calendário', action: toggleCalendar },
    { icon: 'fa-users', label: 'Contatos', action: onLoadContacts },
    { icon: 'fa-chalkboard', label: 'Whiteboard', action: toggleWhiteboard },
    { icon: 'fa-map-marked-alt', label: 'Mapa Interativo', action: toggleMap },
  ];

  return (
    <div
      className={`right-toolbar fixed top-0 right-0 h-full bg-gray-900/60 backdrop-blur-xl border-l border-white/10 flex flex-col items-center py-4 z-30 ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="toolbar-handle">
        <i className={`fas fa-chevron-left transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}></i>
      </div>
      <div className="flex-grow space-y-3 flex flex-col items-start w-full">
        {buttons.map((button) => (
          <button
            key={button.label}
            onClick={button.action}
            className="toolbar-button w-full flex items-center text-gray-300 hover:bg-blue-600/50 hover:text-white transition-all duration-200 py-3 px-5 hover:pl-6"
            title={button.label}
          >
            <i className={`fas ${button.icon} text-lg w-6 text-center`}></i>
            <span className="button-text ml-4 font-semibold">{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RightToolbar;