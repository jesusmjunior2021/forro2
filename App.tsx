import React, { useState, lazy, Suspense, useEffect, useRef, useMemo } from 'react';
import useNeuralAssistant from './hooks/useNeuralAssistant';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import SplashScreen from './components/SplashScreen';
import StartupModeSelector from './components/StartupModeSelector';
import MediaPlayerModal from './components/MediaPlayerModal';
import LazyLoader from './components/LazyLoader';
import { PersistenceMode, ConnectionState, Transcription, ReportContent, TTSState } from './types';
import VideoSearchResultsGrid from './components/VideoSearchResultsGrid';
import ReminderToast from './components/ReminderToast';
import InformationCardDisplay from './components/InformationCard';
import DeepDiveModal from './components/DeepDiveModal';
import BatchProcessorOverlay from './components/BatchProcessorOverlay';
import LiveConversationView from './components/LiveConversationView';


// Lazy load panels
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const UserProfilePanel = lazy(() => import('./components/UserProfilePanel'));
const ChatHistoryPanel = lazy(() => import('./components/ChatHistoryPanel'));
const VideotecaPanel = lazy(() => import('./components/VideotecaPanel'));
const DocumentLibraryPanel = lazy(() => import('./components/DocumentLibraryPanel'));
const DocumentEditorPanel = lazy(() => import('./components/DocumentEditorPanel'));
const CalendarPanel = lazy(() => import('./components/CalendarPanel'));
const RssFeedPanel = lazy(() => import('./components/RssFeedPanel'));
const WhiteboardPanel = lazy(() => import('./components/WhiteboardPanel'));
const LiteraryArchivePanel = lazy(() => import('./components/LiteraryArchivePanel'));
const KnowledgeMapPanel = lazy(() => import('./components/KnowledgeMapPanel'));
const ProjectAssistantPanel = lazy(() => import('./components/ProjectAssistantPanel'));
const SynthesisHubPanel = lazy(() => import('./components/SynthesisHubPanel'));
const DeepAnalysisModal = lazy(() => import('./components/DeepAnalysisModal'));
const VertexSearchPanel = lazy(() => import('./components/VertexSearchPanel'));
const PostItPanel = lazy(() => import('./components/PostItPanel'));
const CoCreatorView = lazy(() => import('./components/CoCreatorView'));
const ImageGenerationPanel = lazy(() => import('./components/ImageGenerationPanel'));
const TranscriptionFlowPanel = lazy(() => import('./components/TranscriptionFlowPanel'));
const SpotifyPanel = lazy(() => import('./components/SpotifyPanel'));
const SerpApiPanel = lazy(() => import('./components/SerpApiPanel'));
const PodcastPanel = lazy(() => import('./components/PodcastPanel'));
const TomTomMapPanel = lazy(() => import('./components/TomTomMapPanel'));
const PersonalityFramework = lazy(() => import('./components/PersonalityFramework'));
const MagazinePanel = lazy(() => import('./components/MagazinePanel'));
const SpreadsheetPanel = lazy(() => import('./components/SpreadsheetPanel'));
const PicassoPanel = lazy(() => import('./components/PicassoPanel'));
const ForroCalculatorPanel = lazy(() => import('./components/ForroCalculatorPanel'));
const ProductCatalogPanel = lazy(() => import('./components/ProductCatalogPanel'));


interface NoApiKeyPromptProps {
  onOpenSettings: () => void;
}

const NoApiKeyPrompt: React.FC<NoApiKeyPromptProps> = ({ onOpenSettings }) => {
  return (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-40 text-center p-8">
      <i className="fas fa-key text-5xl text-yellow-400 mb-4"></i>
      <h2 className="text-2xl font-bold text-white">Nenhuma Chave de API Encontrada</h2>
      <p className="text-md text-gray-400 mt-2 max-w-md">
        Para começar a usar o assistente, por favor, adicione uma chave de API do Google AI Studio no painel de configurações.
      </p>
      <button
        onClick={onOpenSettings}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
      >
        <i className="fas fa-sliders-h"></i>
        <span>Abrir Configurações</span>
      </button>
    </div>
  );
};

const FONT_COLOR_CLASSES = [
    'text-gray-200', // Default
    'text-white',
    'text-yellow-200',
    'text-cyan-200',
    'text-lime-200'
];

const App: React.FC = () => {
    const [initialMode, setInitialMode] = useState<PersistenceMode>('inactive');
    const [showStartupSelector, setShowStartupSelector] = useState(true);
    const [isInitializingDb, setIsInitializingDb] = useState(false);
    const hasInitAttempted = useRef(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [reportFontSize, setReportFontSize] = useState(17);
    const [reportFontColorClass, setReportFontColorClass] = useState(FONT_COLOR_CLASSES[0]);

    const assistant = useNeuralAssistant(initialMode);
    
    const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
        setReportFontSize(prev => {
            const newSize = direction === 'increase' ? prev + 1 : prev - 1;
            return Math.max(12, Math.min(32, newSize)); // Clamp font size
        });
    };

    const cycleFontColor = () => {
        setReportFontColorClass(prev => {
            const currentIndex = FONT_COLOR_CLASSES.indexOf(prev);
            const nextIndex = (currentIndex + 1) % FONT_COLOR_CLASSES.length;
            return FONT_COLOR_CLASSES[nextIndex];
        });
    };


    useEffect(() => {
      // Set theme on body
      if (assistant.settingsPanelProps.settings.theme) {
          document.body.dataset.theme = assistant.settingsPanelProps.settings.theme;
      } else {
          delete document.body.dataset.theme;
      }
    }, [assistant.settingsPanelProps.settings.theme]);
    
    useEffect(() => {
      if (initialMode === 'local' && !hasInitAttempted.current) {
        hasInitAttempted.current = true;
        const init = async () => {
            setIsInitializingDb(true);
            const success = await assistant.initializePersistence();
            setIsInitializingDb(false);
            if (!success) {
                // If user cancels or it fails, go back to the selector screen
                setShowStartupSelector(true);
                setInitialMode('inactive');
                hasInitAttempted.current = false; // Allow trying again
            }
        };
        init();
      }
    }, [initialMode, assistant]);

    const handleSelectMode = (mode: PersistenceMode) => {
        setInitialMode(mode);
        setShowStartupSelector(false);
    };
    
    if (showStartupSelector) {
        return <StartupModeSelector onSelectLocal={() => handleSelectMode('local')} onSelectDemo={() => handleSelectMode('demo')} />;
    }

    if (isInitializingDb) {
        return <SplashScreen />;
    }
    
    const renderMainContent = () => {
        if (assistant.interactionMode === 'cocreator') {
            return (
                <Suspense fallback={<LazyLoader />}>
                    <CoCreatorView 
                        connectionState={assistant.connectionState}
                        documentEditorProps={assistant.documentEditorPanelProps}
                        specialization={assistant.coCreatorSpecialization}
                        onSpecializationChange={assistant.setCoCreatorSpecialization}
                        onToggleConversation={assistant.toggleConversationMode}
                    />
                </Suspense>
            );
        }
       
        if (assistant.videoSearchResults.length > 0) {
            return <VideoSearchResultsGrid videos={assistant.videoSearchResults} onClear={assistant.clearVideoSearchResults} onPlayVideo={assistant.onPlayVideo} />;
        }

        if (assistant.interactionMode === 'live') {
            return (
                <LiveConversationView 
                    connectionState={assistant.connectionState}
                    liveTranscript={assistant.liveTranscript}
                    transcriptionHistory={assistant.liveModeTranscriptions}
                />
            );
        }
        
        // Fallback to chat mode
        return (
            <TranscriptionDisplay 
                transcriptions={assistant.transcriptions}
                interactionMode={assistant.interactionMode}
                onPlayPauseTTS={assistant.onPlayPauseTTS}
                onStopTTS={assistant.onStopTTS}
                playingTTSId={assistant.ttsState.playingId}
                isTTSPaused={assistant.ttsState.isPaused}
                onPlayVideo={assistant.onPlayVideo}
                onLoadLocalContext={assistant.onLoadLocalContext}
                onAddVideoToLibrary={assistant.onAddVideoToLibrary}
                onAddResourceToArchive={assistant.onAddResourceToArchive}
                onCopyToClipboard={assistant.onCopyToClipboard}
                onCopyTagsToClipboard={assistant.onCopyTagsToClipboard}
                onSaveToMagazine={assistant.onSaveToMagazine}
                justSavedIds={assistant.justSavedIds}
                justCopiedId={assistant.justCopiedId}
                justCopiedTagsId={assistant.justCopiedTagsId}
                videos={assistant.videos}
                onOpenDeepDive={assistant.onOpenDeepDive}
                reportFontSize={reportFontSize}
                reportFontColorClass={reportFontColorClass}
                onFontSizeChange={handleFontSizeChange}
                onCycleFontColor={cycleFontColor}
                onImageSelected={assistant.onImageSelected}
            />
        );
    }
    
    return (
        <div className="h-screen w-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">
            {!isCollapsed && <Header 
                isDbActive={assistant.isDbActive}
                dbStatus={assistant.dbStatus}
                onInitializeDb={assistant.initializePersistence}
                persistenceMode={assistant.persistenceMode}
                activeSearchContexts={assistant.activeSearchContexts}
                onToggleSearchContext={assistant.onToggleSearchContext}
                toggleSettings={() => assistant.togglePanel('settings')}
                toggleHistory={() => assistant.togglePanel('history')}
                toggleUserProfile={() => assistant.togglePanel('userProfile')}
                toggleCalendar={() => assistant.togglePanel('calendar')}
                toggleRss={() => assistant.togglePanel('rss')}
                onLoadContacts={assistant.onLoadContacts}
                toggleWhiteboard={() => assistant.togglePanel('whiteboard')}
                toggleVideoteca={() => assistant.togglePanel('videoteca')}
                toggleDocumentEditor={() => assistant.togglePanel('documentEditor')}
                toggleDocumentLibrary={() => assistant.togglePanel('documentLibrary')}
                toggleLiteraryArchive={() => assistant.togglePanel('literaryArchive')}
                toggleKnowledgeMap={() => assistant.togglePanel('knowledgeMap')}
                toggleProjectAssistant={() => assistant.togglePanel('projectAssistant')}
                toggleSynthesisHub={() => assistant.togglePanel('synthesisHub')}
                toggleDeepAnalysis={() => assistant.togglePanel('deepAnalysis')}
                toggleVertexSearch={() => assistant.togglePanel('vertexSearch')}
                togglePostItPanel={() => assistant.togglePanel('postIt')}
                toggleImageGeneration={() => assistant.togglePanel('imageGeneration')}
                toggleTranscriptionFlow={() => assistant.togglePanel('transcriptionFlow')}
                toggleSpotifyPanel={() => assistant.togglePanel('spotify')}
                toggleSerpApiPanel={() => assistant.togglePanel('serpApi')}
                togglePodcastPanel={() => assistant.togglePanel('podcast')}
                toggleTomTomMapPanel={() => assistant.togglePanel('tomTomMap')}
                togglePersonalityFramework={() => assistant.togglePanel('personalityFramework')}
                toggleMagazinePanel={() => assistant.togglePanel('magazine')}
                toggleSpreadsheetPanel={() => assistant.togglePanel('spreadsheet')}
                togglePicassoPanel={() => assistant.togglePanel('picasso')}
                toggleForroCalculatorPanel={() => assistant.togglePanel('forroCalculator')}
                toggleProductCatalogPanel={() => assistant.togglePanel('productCatalog')}
                onToggleCollapse={() => setIsCollapsed(prev => !prev)}
            />}
            
            <main className="flex-1 flex flex-col min-h-0 relative pb-40"> {/* Add padding to bottom to avoid overlap */}
                {assistant.apiKeys.length === 0 && assistant.persistenceMode !== 'inactive' && <NoApiKeyPrompt onOpenSettings={() => assistant.togglePanel('settings')} />}
                {renderMainContent()}
            </main>
            
            <div className={`transition-transform duration-300 ${isCollapsed ? 'translate-y-full' : 'translate-y-0'}`}>
                <ControlPanel
                    // Props from old ControlPanel
                    connectionState={assistant.connectionState}
                    interactionMode={assistant.interactionMode}
                    toggleConversationMode={assistant.toggleConversationMode}
                    onInterrupt={assistant.interruptAssistant}
                    setInteractionMode={assistant.setInteractionMode}
                    isWebSearchForced={assistant.isWebSearchForced}
                    onToggleWebSearch={assistant.toggleWebSearch}
                    onStartNewConversation={assistant.onStartNewConversation}
                    ttsState={assistant.ttsState}
                    onPlayPauseTTS={() => assistant.onPlayPauseTTS()}
                    onStopTTS={assistant.onStopTTS}
                    volume={assistant.volume}
                    onVolumeChange={assistant.onVolumeChange}
                    toggleSettings={() => assistant.togglePanel('settings')}
                    onToggleCollapse={() => setIsCollapsed(prev => !prev)}
                    onTogglePersonalityFramework={() => assistant.togglePanel('personalityFramework')}
                    toggleForroCalculatorPanel={() => assistant.togglePanel('forroCalculator')}
                    toggleScaffoldingCalculatorPanel={() => assistant.togglePanel('scaffoldingCalculator')}
                    toggleProductCatalogPanel={() => assistant.togglePanel('productCatalog')}
                    
                    // Props from old SilentModeInput
                    onSendMessage={assistant.onSendMessage}
                    isThinking={assistant.connectionState === ConnectionState.THINKING}
                    recordingState={assistant.recordingState}
                    startRecording={assistant.startRecording}
                    stopRecording={assistant.stopRecording}
                    activeSearchContexts={assistant.activeSearchContexts}
                    onToggleSearchContext={assistant.onToggleSearchContext}
                    dynamicSearchContexts={assistant.dynamicSearchContexts}
                    text={assistant.textInput}
                    onTextChange={assistant.setTextInput}
                    elapsedTime={assistant.elapsedTime}
                    onImageSelected={assistant.onImageSelected}
                    imagePreviewUrl={assistant.imagePreviewUrl}
                    onClearImage={assistant.onClearImage}
                    transcriptionProgress={assistant.transcriptionProgress}
                />
            </div>
            {isCollapsed && (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full text-white flex items-center justify-center z-50 shadow-lg"
                    title="Restaurar Interface"
                >
                    <i className="fas fa-eye"></i>
                </button>
            )}


            <InformationCardDisplay cards={assistant.informationCards} onDismiss={assistant.onDismissInfoCard} />
            
            <BatchProcessorOverlay queue={assistant.processingQueue} onCancel={assistant.cancelBatchProcessing} />

            <Suspense fallback={<LazyLoader />}>
                 {assistant.activePanels.productCatalog && (
                    <ProductCatalogPanel 
                        isOpen={assistant.activePanels.productCatalog}
                        onClose={() => assistant.togglePanel('productCatalog')}
                        products={assistant.productCatalog}
                    />
                )}
                 {assistant.activePanels.forroCalculator && (
                    <ForroCalculatorPanel 
                        isOpen={assistant.activePanels.forroCalculator}
                        onClose={() => assistant.togglePanel('forroCalculator')}
                        products={assistant.productCatalog}
                    />
                )}
                {assistant.activePanels.picasso && (
                    <PicassoPanel {...assistant.picassoPanelProps} />
                )}
                {assistant.activePanels.spreadsheet && (
                    <SpreadsheetPanel {...assistant.spreadsheetPanelProps} />
                )}
                {assistant.activePanels.magazine && (
                    <MagazinePanel 
                        isOpen={assistant.activePanels.magazine}
                        onClose={() => assistant.togglePanel('magazine')}
                        articles={assistant.magazine}
                        onCopyToClipboard={assistant.onCopyToClipboard}
                        onCopyTagsToClipboard={assistant.onCopyTagsToClipboard}
                        onPlayPauseTTS={assistant.onPlayPauseTTS}
                        onStopTTS={assistant.onStopTTS}
                        ttsState={assistant.ttsState}
                        justCopiedId={assistant.justCopiedId}
                        justCopiedTagsId={assistant.justCopiedTagsId}
                    />
                )}
                {assistant.activePanels.personalityFramework && (
                    <PersonalityFramework
                        isOpen={assistant.activePanels.personalityFramework}
                        onClose={() => assistant.togglePanel('personalityFramework')}
                        data={assistant.personalityFrameworkData}
                        onProcessWhiteboard={assistant.processWhiteboardForPersonality}
                        isProcessing={assistant.isProcessingPersonality}
                    />
                )}
                {assistant.activePanels.podcast && <PodcastPanel {...assistant.podcastPanelProps} />}
                {assistant.activePanels.imageGeneration && <ImageGenerationPanel {...assistant.imageGenerationPanelProps} />}
                {assistant.activePanels.settings && <SettingsPanel {...assistant.settingsPanelProps} />}
                {assistant.activePanels.userProfile && <UserProfilePanel {...assistant.userProfilePanelProps} />}
                {assistant.activePanels.history && <ChatHistoryPanel {...assistant.chatHistoryPanelProps} />}
                {assistant.activePanels.deepAnalysis && <DeepAnalysisModal state={assistant.deepAnalysisState} onClose={() => assistant.togglePanel('deepAnalysis')} onAnalyzeFile={assistant.onAnalyzeFile} onAction={assistant.handleAnalysisAction} />}
                {assistant.activePanels.rss && <RssFeedPanel {...assistant.rssPanelProps} />}
                {assistant.activePanels.documentLibrary && <DocumentLibraryPanel {...assistant.documentLibraryPanelProps} />}
                {assistant.activePanels.documentEditor && assistant.interactionMode !== 'cocreator' && <DocumentEditorPanel {...assistant.documentEditorPanelProps} />}
                {assistant.activePanels.vertexSearch && <VertexSearchPanel isOpen={assistant.activePanels.vertexSearch} onClose={() => assistant.togglePanel('vertexSearch')} searchState={assistant.groundedSearchState} onPerformSearch={assistant.onPerformGroundedSearch} />}
                {assistant.activePanels.synthesisHub && <SynthesisHubPanel {...assistant.synthesisHubPanelProps} />}
                {assistant.activePanels.calendar && <CalendarPanel {...assistant.calendarPanelProps} />}
                {assistant.activePanels.videoteca && <VideotecaPanel {...assistant.videotecaPanelProps} />}
                {assistant.activePanels.literaryArchive && <LiteraryArchivePanel {...assistant.literaryArchivePanelProps} />}
                {assistant.activePanels.postIt && <PostItPanel {...assistant.postItPanelProps} />}
                {assistant.activePanels.transcriptionFlow && (
                    <TranscriptionFlowPanel
                        isOpen={assistant.activePanels.transcriptionFlow}
                        onClose={() => assistant.togglePanel('transcriptionFlow')}
                        getActiveApiKey={assistant.getActiveApiKey}
                    />
                )}
                {assistant.activePanels.spotify && <SpotifyPanel {...assistant.spotifyPanelProps} />}
                {assistant.activePanels.serpApi && <SerpApiPanel {...assistant.serpApiPanelProps} />}
                {assistant.activePanels.tomTomMap && <TomTomMapPanel {...assistant.tomTomMapPanelProps} />}
                 {assistant.activePanels.whiteboard && (
                    <WhiteboardPanel
                        cards={assistant.creativeSlate}
                        onDelete={assistant.onDeleteSlateCard}
                        onCopy={assistant.onCopySlateCardContent}
                    />
                 )}
            </Suspense>

            <div className="fixed top-20 right-4 z-50 space-y-3">
                {assistant.activeReminders.map(reminder => (
                    <ReminderToast 
                        key={reminder.id} 
                        reminder={reminder} 
                        onClose={() => assistant.onDismissReminder(reminder.id)} 
                    />
                ))}
            </div>
            
            {assistant.deepDiveResources && (
                <DeepDiveModal
                    resources={assistant.deepDiveResources}
                    onClose={assistant.onCloseDeepDive}
                    onPlayVideo={assistant.onPlayVideo}
                    onSaveToVideoteca={assistant.onAddVideoToLibrary}
                    onSaveToArchive={assistant.onAddResourceToArchive}
                />
            )}

            {assistant.mediaPlayerUrl && (
                <MediaPlayerModal videoUrl={assistant.mediaPlayerUrl} onClose={assistant.closeMediaPlayer} />
            )}
        </div>
    );
};

export default App;