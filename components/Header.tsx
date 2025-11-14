import React, { useState, useRef, useEffect } from 'react';
import { PersistenceMode } from '../types';

interface HeaderProps {
  isDbActive: boolean;
  dbStatus: string;
  onInitializeDb: () => void;
  persistenceMode: PersistenceMode;
  activeSearchContexts: Set<string>;
  onToggleSearchContext: (context: string) => void;
  toggleSettings: () => void;
  toggleHistory: () => void;
  toggleUserProfile: () => void;
  toggleCalendar: () => void;
  toggleRss: () => void;
  onLoadContacts: () => void;
  toggleWhiteboard: () => void;
  toggleVideoteca: () => void;
  toggleDocumentEditor: () => void;
  toggleDocumentLibrary: () => void;
  toggleLiteraryArchive: () => void;
  toggleKnowledgeMap: () => void;
  toggleProjectAssistant: () => void;
  toggleSynthesisHub: () => void;
  toggleDeepAnalysis: () => void;
  toggleVertexSearch: () => void;
  togglePostItPanel: () => void;
  toggleImageGeneration: () => void;
  toggleTranscriptionFlow: () => void;
  toggleSpotifyPanel: () => void;
  toggleSerpApiPanel: () => void;
  togglePodcastPanel: () => void;
  toggleTomTomMapPanel: () => void;
  togglePersonalityFramework: () => void;
  toggleMagazinePanel: () => void;
  toggleSpreadsheetPanel: () => void;
  togglePicassoPanel: () => void;
  toggleForroCalculatorPanel: () => void;
  toggleProductCatalogPanel: () => void;
  onToggleCollapse: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { isDbActive, dbStatus, onInitializeDb, persistenceMode } = props;
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSerpActive = props.activeSearchContexts.has('serpApi');

  const getStatusColor = () => {
    if (!isDbActive) return 'bg-gray-500';
    if (dbStatus.toLowerCase().includes('erro')) return 'bg-red-500';
    if (dbStatus.toLowerCase().includes('salvando')) return 'bg-yellow-500 animate-pulse';
    return 'bg-green-500';
  };

  const showDbStatus = persistenceMode === 'local';
  
  const mainButtons: { icon: string; label: string; action: () => void; specialClass?: string }[] = [
    { icon: 'fa-sliders-h', label: 'Configurações', action: props.toggleSettings },
    { icon: 'fa-brain', label: 'Personalidade da IA', action: props.togglePersonalityFramework },
    { icon: 'fa-palette', label: 'Estúdio Picasso', action: props.togglePicassoPanel },
    { icon: 'fa-chart-pie', label: 'Analisar Perfil', action: props.toggleUserProfile },
    { icon: 'fa-book-open', label: 'Histórico', action: props.toggleHistory },
    { icon: 'fa-search-dollar', label: 'Busca Profunda', action: props.toggleSerpApiPanel },
    { icon: 'fa-podcast', label: 'Podcast Hub', action: props.togglePodcastPanel },
    { icon: 'fa-image', label: 'Gerador de Imagem (Replicate)', action: props.toggleImageGeneration },
    { icon: 'fa-file-alt', label: 'Editor', action: props.toggleDocumentEditor },
    { icon: 'fa-file-excel', label: 'Planilhas', action: props.toggleSpreadsheetPanel },
    { icon: 'fa-play-circle', label: 'Videoteca', action: props.toggleVideoteca },
  ];

  const moreMenuItems = [
    { icon: 'fa-book', label: 'Catálogo de Produtos', action: props.toggleProductCatalogPanel },
    { icon: 'fa-ruler-combined', label: 'Calculadora de Forro', action: props.toggleForroCalculatorPanel },
    { icon: 'fa-book-journal-whills', label: 'Revista Eletrônica', action: props.toggleMagazinePanel },
    { icon: 'fab fa-spotify', label: 'Hub de Música', action: props.toggleSpotifyPanel },
    { icon: 'fa-cogs', label: 'Fluxo de Transcrição', action: props.toggleTranscriptionFlow },
    { icon: 'fa-sticky-note', label: 'Notas Rápidas', action: props.togglePostItPanel },
    { icon: 'fa-book-reader', label: 'Biblioteca', action: props.toggleDocumentLibrary },
    { icon: 'fa-search-plus', label: 'Pesquisa IA', action: props.toggleVertexSearch },
    { icon: 'fa-microscope', label: 'Análise Profunda', action: props.toggleDeepAnalysis },
    { icon: 'fa-project-diagram', label: 'Assistente de Projeto', action: props.toggleProjectAssistant },
    { icon: 'fa-lightbulb', label: 'Hub de Síntese', action: props.toggleSynthesisHub },
    { icon: 'fa-calendar-alt', label: 'Calendário', action: props.toggleCalendar },
    { icon: 'fa-newspaper', label: 'Notícias', action: props.toggleRss },
    { icon: 'fa-sitemap', label: 'Mapa do Conhecimento', action: props.toggleKnowledgeMap },
    { icon: 'fa-map-marked-alt', label: 'Mapa TomTom', action: props.toggleTomTomMapPanel },
    { icon: 'fa-book-atlas', label: 'Arquivo Literário', action: props.toggleLiteraryArchive },
    { icon: 'fa-chalkboard', label: 'Whiteboard', action: props.toggleWhiteboard },
    { icon: 'fa-users', label: 'Contatos', action: props.onLoadContacts },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  const HeaderButton: React.FC<{ icon: string; label: string; action: () => void; specialClass?: string, isActive?: boolean }> = ({ icon, label, action, specialClass, isActive }) => (
      <button
        onClick={action}
        title={label}
        className={`w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-blue-600/50 hover:text-white transition-colors duration-200 rounded-lg header-btn ${specialClass || ''} ${isActive ? 'active' : ''}`}
      >
        <i className={`fas ${icon} text-lg`}></i>
      </button>
  );

  return (
    <>
      <header className="w-full bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 shadow-md z-30 shrink-0">
        <div className="p-2 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <i className="fas fa-brain text-xl text-blue-400"></i>
            <h1 className="text-lg font-bold">FORRO</h1>
          </div>

          <div className="flex items-center space-x-2">
              {showDbStatus && (
                <>
                  <button
                    onClick={onInitializeDb}
                    className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors flex items-center"
                    title="Selecione uma pasta para salvar os dados do aplicativo."
                  >
                    <i className="fas fa-database mr-2"></i>
                    Memória
                  </button>
                  <div className="flex items-center space-x-2" title={`Status da base de dados: ${dbStatus}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
                    <span className="text-xs text-gray-400">{dbStatus}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-600/50"></div>
                </>
              )}

              <div className="flex items-center space-x-1">
                  {mainButtons.map(({ icon, label, action, specialClass }) => (
                      <HeaderButton 
                        key={label} 
                        icon={icon} 
                        label={label} 
                        action={action} 
                        specialClass={specialClass} 
                        isActive={label === 'Busca Profunda' && isSerpActive}
                      />
                  ))}
              </div>

              <div className="relative" ref={menuRef}>
                  <button
                      onClick={() => setIsMoreMenuOpen(prev => !prev)}
                      title="Mais Ferramentas"
                      className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-blue-600/50 hover:text-white transition-colors duration-200 rounded-lg"
                  >
                      <i className="fas fa-ellipsis-v text-lg"></i>
                  </button>
                  {isMoreMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 py-2 animate-fade-in">
                          {moreMenuItems.map(({ icon, label, action }) => (
                              <button
                                  key={label}
                                  onClick={() => { action(); setIsMoreMenuOpen(false); }}
                                  className="w-full flex items-center px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-600/50 hover:text-white"
                              >
                                  <i className={`fas ${icon} w-6 text-center mr-3`}></i>
                                  {label}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
              
               <div className="w-px h-6 bg-gray-600/50"></div>
              <button onClick={props.onToggleCollapse} title="Recolher Interface" className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-700/70 hover:text-white rounded-lg">
                <i className="fas fa-chevron-up"></i>
              </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;