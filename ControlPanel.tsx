import React, { useRef, useEffect } from 'react';
import { ConnectionState, TTSState, RecordingState, InteractionMode, SearchContext, DynamicContext } from '../types';
import StatusIndicator from './StatusIndicator';
import { RECORDING_LIMIT_SECONDS } from '../hooks/useAudioService';


// This component was previously SearchContextToggles
const ToolsBar: React.FC<{
  onToggleScaffoldingCalculator: () => void;
  onToggleForroCalculator: () => void;
  onToggleProductCatalog: () => void;
}> = ({ onToggleScaffoldingCalculator, onToggleForroCalculator, onToggleProductCatalog }) => {
  const tools = [
    { id: 'scaffolding', icon: 'fa-calculator', label: 'Calculadora de Andaimes', action: onToggleScaffoldingCalculator },
    { id: 'ceiling', icon: 'fa-ruler-combined', label: 'Calculadora de Forro', action: onToggleForroCalculator },
    { id: 'catalog', icon: 'fa-book', label: 'Catálogo de Produtos', action: onToggleProductCatalog },
  ];

  return (
    <div className="flex justify-center items-center flex-wrap gap-2">
      {tools.map(({ id, icon, label, action }) => (
        <button
          key={id}
          onClick={action}
          title={label}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2 transition-all duration-200 bg-gray-700/60 text-gray-300 hover:bg-gray-600/80`}
        >
          <i className={`fas ${icon}`}></i>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};


interface UnifiedFooterProps {
  // From old ControlPanel
  connectionState: ConnectionState;
  interactionMode: InteractionMode;
  toggleConversationMode: () => void;
  onInterrupt: () => void;
  setInteractionMode: (mode: InteractionMode) => void;
  isWebSearchForced: boolean;
  onToggleWebSearch: () => void;
  onStartNewConversation: () => void;
  ttsState: TTSState;
  onPlayPauseTTS: () => void;
  onStopTTS: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  toggleSettings: () => void;
  onToggleCollapse: () => void;
  onTogglePersonalityFramework: () => void;
  toggleForroCalculatorPanel: () => void;
  toggleScaffoldingCalculatorPanel: () => void;
  toggleProductCatalogPanel: () => void;
  
  // From old SilentModeInput
  onSendMessage: (message: string) => void;
  isThinking: boolean;
  recordingState: RecordingState;
  startRecording: () => void;
  stopRecording: () => void;
  activeSearchContexts: Set<string>;
  onToggleSearchContext: (context: string) => void;
  dynamicSearchContexts: DynamicContext[];
  text: string;
  onTextChange: (newText: string) => void;
  elapsedTime: number;
  onImageSelected: (file: File) => void;
  imagePreviewUrl: string | null;
  onClearImage: () => void;
  transcriptionProgress: number;
}

const ControlPanel: React.FC<UnifiedFooterProps> = (props) => {
  const {
    connectionState, interactionMode, toggleConversationMode, onInterrupt, setInteractionMode,
    isWebSearchForced, onToggleWebSearch, onStartNewConversation, ttsState, onPlayPauseTTS,
    onStopTTS, volume, onVolumeChange, toggleSettings, onToggleCollapse, onSendMessage, isThinking,
    recordingState, startRecording, stopRecording, activeSearchContexts, onToggleSearchContext,
    dynamicSearchContexts, text, onTextChange, elapsedTime, onImageSelected, imagePreviewUrl,
    onClearImage, transcriptionProgress, onTogglePersonalityFramework, 
    toggleForroCalculatorPanel, toggleScaffoldingCalculatorPanel, toggleProductCatalogPanel
  } = props;
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  // --- LOGIC FROM OLD COMPONENTS ---
  const isLiveMode = interactionMode === 'live';
  const isSessionActive = [ConnectionState.CONNECTED, ConnectionState.THINKING, ConnectionState.SPEAKING, ConnectionState.CONNECTING].includes(connectionState);
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const showInterruptButton = isLiveMode && connectionState === ConnectionState.SPEAKING;


  const displayedConnectionState = interactionMode === 'chat' && (connectionState === ConnectionState.IDLE || connectionState === ConnectionState.SAVING)
    ? connectionState
    : interactionMode === 'chat' ? ConnectionState.SILENT : connectionState;

  const handleCentralMicClick = () => {
     if (interactionMode === 'live') {
        toggleConversationMode();
    } else if (recordingState === 'recording') {
        stopRecording();
    } else if (recordingState === 'idle') {
        startRecording();
    }
  };

  const getCentralMicIcon = () => {
    if (interactionMode === 'live') {
      if (isConnecting) return 'fa-spinner fa-spin';
      return isSessionActive ? 'fa-stop' : 'fa-microphone-alt';
    }
    if (recordingState === 'transcribing') return 'fa-spinner fa-spin';
    if (recordingState === 'recording') return 'fa-stop';
    return 'fa-microphone';
  };

  const getCentralMicTitle = () => {
    if (interactionMode === 'live') {
        return isSessionActive ? 'Parar Conversa ao Vivo' : 'Iniciar Conversa ao Vivo';
    }
    if (recordingState === 'transcribing') return "Transcrevendo...";
    if (recordingState === 'recording') return "Parar Gravação";
    return "Gravar Nota de Voz";
  };
  
  const handleSendMessage = () => {
    if ((text.trim() || imagePreviewUrl) && !isThinking) {
      onSendMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected(file);
    e.target.value = '';
  };

  const getVolumeIcon = () => {
    if (volume === 0) return 'fa-volume-mute';
    if (volume < 0.5) return 'fa-volume-down';
    return 'fa-volume-up';
  };
  
  const SideButton: React.FC<{icon: string, title: string, onClick: () => void, isActive?: boolean, hasPulse?: boolean}> = ({icon, title, onClick, isActive, hasPulse}) => (
      <button onClick={onClick} title={title} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-600'}`}>
          <i className={`fas ${icon} ${hasPulse ? 'animate-pulse' : ''}`}></i>
      </button>
  );

  return (
    <footer className="unified-footer">
      {interactionMode === 'chat' && (
        <div className="flex justify-center items-center mb-3">
             <button
                onClick={onStartNewConversation}
                title="Novo Chat"
                className="px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2 transition-all duration-200 bg-gray-700/60 text-gray-300 hover:bg-blue-600/80 hover:text-white mr-2 flex-shrink-0"
            >
                <i className="fas fa-plus"></i>
            </button>
            <ToolsBar 
                onToggleScaffoldingCalculator={toggleScaffoldingCalculatorPanel}
                onToggleForroCalculator={toggleForroCalculatorPanel}
                onToggleProductCatalog={toggleProductCatalogPanel}
            />
        </div>
      )}
      
      {interactionMode === 'chat' && (
        <div className="footer-input-bar">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
           <button onClick={handleImageUploadClick} disabled={isThinking || !!imagePreviewUrl} className="footer-action-btn secondary ml-1" title="Anexar mídia">
              <i className="fas fa-paperclip"></i>
           </button>
           <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'Digite sua mensagem ou use o botão central para gravar...'}
              disabled={isThinking || recordingState !== 'idle'}
              rows={1}
            />
            <button onClick={handleSendMessage} disabled={isThinking || (!text.trim() && !imagePreviewUrl)} className="footer-action-btn primary mr-1" title="Enviar Mensagem (Enter)">
                {isThinking ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            </button>
        </div>
      )}

      <div className="footer-bottom-bar">
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            <SideButton icon={isLiveMode ? 'fa-keyboard' : 'fa-headset'} title={isLiveMode ? "Mudar para Modo Chat" : "Mudar para Conversa ao Vivo"} onClick={() => setInteractionMode(isLiveMode ? 'chat' : 'live')} isActive={isLiveMode} />
            <SideButton icon="fa-brain" title="Framework de Personalidade" onClick={onTogglePersonalityFramework} />
          </div>
          
          {/* Center Controls */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              {showInterruptButton ? (
                 <button
                    onClick={onInterrupt}
                    className="central-mic-button bg-yellow-600 hover:bg-yellow-700 animate-pulse"
                    title="Interromper IA"
                 >
                    <i className="fas fa-hand-paper text-3xl text-white"></i>
                </button>
              ) : (
                <button
                    onClick={handleCentralMicClick}
                    disabled={isConnecting || (interactionMode !== 'live' && recordingState === 'transcribing')}
                    className={`central-mic-button ${
                        isSessionActive || recordingState === 'recording'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:bg-gray-500`}
                    title={getCentralMicTitle()}
                >
                    <i className={`fas ${getCentralMicIcon()} text-3xl text-white`}></i>
                </button>
              )}
              <div className="mt-16 h-5">
                <StatusIndicator state={displayedConnectionState} />
              </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <SideButton icon="fa-globe" title={isWebSearchForced ? 'Desativar busca forçada na web' : 'Forçar busca na web'} onClick={onToggleWebSearch} isActive={isWebSearchForced} hasPulse={isWebSearchForced}/>
            <div className="flex items-center space-x-2 bg-gray-700/70 p-1 rounded-full">
                <i className={`fas ${getVolumeIcon()} text-gray-400 w-5 text-center px-1`}></i>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => onVolumeChange(parseFloat(e.target.value))} className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" aria-label="Volume"/>
            </div>
            <SideButton icon="fa-sliders-h" title="Abrir Configurações" onClick={toggleSettings} />
            <SideButton icon="fa-chevron-up" title="Recolher Interface" onClick={onToggleCollapse} />
          </div>
      </div>
    </footer>
  );
};

export default ControlPanel;