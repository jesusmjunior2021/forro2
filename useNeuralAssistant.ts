import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
    ConnectionState, Transcription, AssistantSettings, ChatSession, Personality, 
    ResponseMode, InteractionMode, TTSState, RecordingState, ResourceLink, 
    LiveDocument, LiveDocumentStatus, PersistenceMode, Video, LocalContextLink, 
    InformationCard, MapState, DeepAnalysisState, DeepAnalysisResult, GroundedSearchState,
    ProjectAssistantState, ProjectPlan, Project, PostItNote, CalendarEvent, Reminder,
    MagazineResource,
    ArchivedLink,
    ReportContent,
    ImageGenerationState,
    ImageGeneration,
    SpotifyState,
    SerpApiState,
    SerpMagazineResult,
    ResourceCategory,
    SerpCardResult,
    PodcastShow,
    PodcastEpisode
} from '../types';
import { usePersistence } from './usePersistence';
import { useLiveConversation } from './useLiveConversation';
import { useAudioService } from './useAudioService';
import { findBestVoice } from '../utils/audioUtils';
import { getThumbnailUrl, categorizeUrl, cleanTextForTTS } from '../utils/resourceUtils';
import { useRssReader } from './useRssReader';
import { useGoogleDrive } from './useGoogleDrive';
import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type } from '@google/genai';
import { useTextToSpeech } from './useTextToSpeech';

const CORS_PROXY_URL = 'https://corsproxy.io/?';

const sanitizeJsonResponse = (responseText: string): string => {
    const trimmedText = responseText.trim();
    const match = trimmedText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return trimmedText;
};

const mockPodcasts = [
    {
        show: {
            id: 'flow-podcast',
            title: 'Flow Podcast',
            description: 'O Flow Podcast é uma conversa livre, como um papo de boteco, com convidados das mais diversas áreas.',
            artworkUrl: 'https://i1.sndcdn.com/avatars-000621443475-151z6w-t500x500.jpg',
            rssUrl: 'https://flowpodcast.com.br/feed/',
            author: 'Estúdios Flow',
            categories: ['Conversa', 'Comédia'],
            isSubscribed: true,
        },
        episodes: [
            { id: 'flow-ep1', showId: 'flow-podcast', title: 'Episódio com especialista em IA', description: 'Uma conversa profunda sobre o futuro da inteligência artificial.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', releaseDate: new Date().toISOString(), duration: 165 },
            { id: 'flow-ep2', showId: 'flow-podcast', title: 'Debate sobre exploração espacial', description: 'Elon Musk vs Jeff Bezos, quem vencerá a corrida espacial?', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', releaseDate: new Date(Date.now() - 86400000).toISOString(), duration: 165 },
        ]
    },
    {
        show: {
            id: 'podpah-podcast',
            title: 'Podpah',
            description: 'Igão e Mítico recebem convidados para uma conversa descontraída sobre os mais variados assuntos.',
            artworkUrl: 'https://pbcdn.podbean.com/imglogo/image-logo/9844973/podpah_-_logo_y93d-p3.jpg',
            rssUrl: 'https://podpah.com.br/feed/',
            author: 'Podpah',
            categories: ['Comédia', 'Entrevistas'],
            isSubscribed: true,
        },
        episodes: [
            { id: 'podpah-ep1', showId: 'podpah-podcast', title: 'Histórias do Futebol', description: 'Um ex-jogador conta os bastidores do futebol brasileiro.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', releaseDate: new Date(Date.now() - 172800000).toISOString(), duration: 165 },
        ]
    }
]

const useNeuralAssistant = (initialMode: PersistenceMode) => {
    const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>(initialMode);
    const [appState, setAppState, isDbActive, dbStatus, initializePersistence] = usePersistence(setPersistenceMode);
    
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
    const [interactionMode, _setInteractionMode] = useState<InteractionMode>('chat');
    const [textInput, setTextInput] = useState('');
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const imageBase64Ref = useRef<string | null>(null);

    // Panels State
    const [activePanels, setActivePanels] = useState<Record<string, boolean>>({});
    
    // Live Conversation State
    const [liveTranscript, setLiveTranscript] = useState({ user: '', assistant: '' });
    const [liveModeTranscriptions, setLiveModeTranscriptions] = useState<Transcription[]>([]);
    const [liveDocuments, setLiveDocuments] = useState<LiveDocument[]>([]);
    const [needsContextRefresh, setNeedsContextRefresh] = useState(false);
    const [coCreatorSpecialization, setCoCreatorSpecialization] = useState('Editor Especialista');
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    
    // ... other state variables
    const [volume, setVolume] = useState(0.7);
    const [activeSearchContexts, setActiveSearchContexts] = useState<Set<string>>(new Set(['web']));
    const [dynamicSearchContexts, setDynamicSearchContexts] = useState<any[]>([]);
    const [isWebSearchForced, setIsWebSearchForced] = useState(false);
    const [videoSearchResults, setVideoSearchResults] = useState<Video[]>([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [mediaPlayerUrl, setMediaPlayerUrl] = useState<string | null>(null);
    const [informationCards, setInformationCards] = useState<InformationCard[]>([]);
    const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
    const [firedReminders, setFiredReminders] = useState<Set<string>>(new Set());
    const [deepAnalysisState, setDeepAnalysisState] = useState<DeepAnalysisState>({ isOpen: false, isLoading: false, progress: 0, statusMessage: '', fileName: null, fileDataUrl: null, error: null, result: null});
    const [groundedSearchState, setGroundedSearchState] = useState<GroundedSearchState>({isLoading: false, error: null, result: null });
    const [projectAssistantState, setProjectAssistantState] = useState<ProjectAssistantState>({ userGoal: '', userTech: '', userIdeas: '', generatedPlan: null, isLoading: false, error: null });
    const [isProjectAssistantModeActive, setIsProjectAssistantModeActive] = useState(false);
    const [deepDiveResources, setDeepDiveResources] = useState<MagazineResource[] | null>(null);
    const [imageGenerationState, setImageGenerationState] = useState<ImageGenerationState>({ 
        isLoading: false, 
        error: null, 
        generations: [],
        mode: 'generate',
        imageToEdit: null,
    });
    const [replicateApiStatus, setReplicateApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [spotifyState, setSpotifyState] = useState<SpotifyState>({
        isLoading: false,
        error: null,
        topTracks: [],
        createdPlaylistId: null,
        statusMessage: '',
    });
    const [spotifyTokenStatus, setSpotifyTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [serpApiState, setSerpApiState] = useState<SerpApiState>({ isLoading: false, error: null, query: '', magazineResult: null, cardResult: null });
    const [serpApiStatus, setSerpApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');


    // Services and Hooks
    const chatRef = useRef<Chat | null>(null);
    const googleDrive = useGoogleDrive();
    const { play: playTTS, pause: pauseTTS, resume: resumeTTS, stop: stopTTS, ttsState } = useTextToSpeech({
        selectedBrowserVoice: appState.settings.selectedBrowserVoice,
        speechRate: appState.settings.speechRate,
        volume: appState.settings.volume,
    });

    const coCreatorTools: FunctionDeclaration[] = [
      {
        name: 'replace_text',
        description: 'Substitui um trecho de texto no documento por um novo texto. Use para correções, reescritas ou adições.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            text_to_replace: {
              type: Type.STRING,
              description: 'O trecho exato do texto a ser substituído. Deve ser uma correspondência exata de uma parte do documento.'
            },
            new_text: {
              type: Type.STRING,
              description: 'O novo texto que substituirá o antigo.'
            }
          },
          required: ['text_to_replace', 'new_text']
        }
      },
      {
        name: 'apply_format',
        description: "Aplica formatação de negrito ('bold') ou itálico ('italic') a um trecho de texto no documento.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            text_to_format: {
              type: Type.STRING,
              description: 'O trecho exato do texto a ser formatado.'
            },
            format_type: {
              type: Type.STRING,
              description: "O tipo de formatação a ser aplicado, deve ser 'bold' ou 'italic'."
            }
          },
          required: ['text_to_format', 'format_type']
        }
      }
    ];

    const onSetDocumentContent = (docId: string, content: string) => {
        setAppState(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === docId ? { ...d, content, lastModified: new Date().toISOString() } : d)
        }));
    };

    const handleLiveTranscriptionUpdate = useCallback(({ user, assistant }: { user?: string, assistant?: string }) => {
        setLiveTranscript(prev => ({
            user: user === undefined ? prev.user : user,
            assistant: assistant === undefined ? prev.assistant : assistant,
        }));
    }, []);

    const handleTurnComplete = useCallback((transcription: Transcription) => {
        if (interactionMode === 'live' || interactionMode === 'cocreator') {
            setLiveModeTranscriptions(prev => [...prev, transcription]);
        }
        setLiveTranscript({ user: '', assistant: '' });
    }, [interactionMode]);
    
    const handleFunctionCall = useCallback((name: string, args: any, id: string) => {
        const doc = appState.documents.find(d => d.id === activeDocumentId);
        if (!doc) {
            sendToolResponse(id, name, { success: false, error: 'Nenhum documento ativo.' });
            return;
        }

        let newContent = doc.content;
        let success = false;
        let errorMessage = 'O texto especificado não foi encontrado no documento.';

        try {
            if (name === 'replace_text') {
                const { text_to_replace, new_text } = args;
                if (newContent.includes(text_to_replace)) {
                    newContent = newContent.replace(text_to_replace, new_text);
                    success = true;
                }
            } else if (name === 'apply_format') {
                const { text_to_format, format_type } = args;
                if (newContent.includes(text_to_format)) {
                    const marker = format_type === 'bold' ? '**' : '*';
                    newContent = newContent.replace(text_to_format, `${marker}${text_to_format}${marker}`);
                    success = true;
                }
            }
        } catch(e) {
            console.error('Erro ao executar a função:', e);
            errorMessage = `Erro ao executar a ferramenta: ${e instanceof Error ? e.message : 'Erro desconhecido'}`;
            success = false;
        }


        if (success && activeDocumentId) {
            onSetDocumentContent(activeDocumentId, newContent);
            sendToolResponse(id, name, { success: true, message: 'Documento atualizado.' });
        } else {
            sendToolResponse(id, name, { success: false, error: errorMessage });
        }
    }, [activeDocumentId, appState.documents]);

    const getSystemInstruction = useCallback(() => {
        let baseInstruction: string;
        if (interactionMode === 'cocreator') {
            baseInstruction = `Você é um ${coCreatorSpecialization}. O usuário irá conversar com você por voz para editar um documento de texto. Você pode usar as ferramentas 'replace_text' e 'apply_format' para modificar o documento. Seja proativo e colaborativo. Responda apenas com a voz. Não transcreva suas ações.`;
        } else {
            baseInstruction = "Você é um assistente prestativo. Responda apenas com a voz, sem transcrição de texto.";
        }
    
        if (appState.settings.sarcasticHumorEnabled) {
            const humorPipeline = `Quando solicitado a gerar humor, siga este pipeline:
*   Analise variáveis de contexto e clusterize informações para identificar "plot twists".
*   Estruture a narrativa com início, clímax e uma conclusão que pode conter uma reviravolta.
*   Utilize pontos de cadência, contenção emocional e pausas estratégicas.
*   Decida sobre a visualização sensorial (sinestesia): foco visual (prólogo) ou auditivo (prelúdio).
*   Mantenha um limiar ético, usando apenas fontes fidedignas e evitando contradições com a realidade.
*   Aplique humor leve, com acidez e sarcasmo, frequentemente pela inversão de fatos ou destaque da incredibilidade/dualidade.
*   Incorpore recursos retóricos como aliteração, termos "basais literais", reviravoltas e inversões rítmicas.
*   Fundamente todo o conteúdo em pesquisa profunda.`;
            
            baseInstruction += `\n\n${humorPipeline}`;
        }
        
        return baseInstruction;
    }, [interactionMode, coCreatorSpecialization, appState.settings.sarcasticHumorEnabled]);

    const getTools = useCallback(() => {
        if (interactionMode === 'cocreator' && coCreatorTools.length > 0) {
            return [{ functionDeclarations: coCreatorTools }];
        }
        if (interactionMode === 'live' && (isWebSearchForced || activeSearchContexts.has('web'))) {
            return [{ googleSearch: {} }];
        }
        return [];
    }, [interactionMode, isWebSearchForced, activeSearchContexts]);

    const getActiveApiKey = () => appState.apiKeys.find(k => k.id === appState.settings.activeApiKeyId)?.value || null;

    const {
        connectionState: liveConnectionState,
        startConversation,
        stopConversation,
        stopAudioPlayback,
        sendToolResponse,
        sendMedia,
        sendText,
    } = useLiveConversation(
        getActiveApiKey(),
        appState.settings.selectedVoice,
        getSystemInstruction(),
        true, // Ativa a transcrição para a conversa ao vivo
        handleLiveTranscriptionUpdate,
        handleTurnComplete,
        handleFunctionCall,
        getTools()
    );
    
    const setInteractionMode = (mode: InteractionMode) => {
        if (mode === 'live' && interactionMode !== 'live') {
            setLiveModeTranscriptions([]);
        }
        if (mode !== 'live' && interactionMode === 'live' && liveConnectionState !== ConnectionState.IDLE) {
            stopConversation();
        }
        _setInteractionMode(mode);
    };

    useEffect(() => {
        if (interactionMode === 'live' || interactionMode === 'cocreator') {
            setConnectionState(liveConnectionState);
        } else if (connectionState !== ConnectionState.THINKING && connectionState !== ConnectionState.SAVING) {
            setConnectionState(ConnectionState.IDLE);
        }
    }, [liveConnectionState, interactionMode, connectionState]);

    useEffect(() => {
        if (interactionMode === 'cocreator' && liveConnectionState === ConnectionState.CONNECTED) {
            const doc = appState.documents.find(d => d.id === activeDocumentId);
            if (doc) {
                const contextMessage = `Vamos colaborar neste documento. O seu papel é '${coCreatorSpecialization}'. Eu darei comandos de voz e você usará as ferramentas disponíveis para editar o texto. Aqui está o conteúdo atual do documento para seu contexto:\n\n---\n\n${doc.content}`;
                sendText(contextMessage);
            }
        }
    }, [interactionMode, liveConnectionState, activeDocumentId, coCreatorSpecialization, appState.documents, sendText]);

    const onTranscriptionComplete = (text: string) => {
        setTextInput(prev => prev ? `${prev}\n${text}` : text);
    };

    const { recordingState, startRecording, stopRecording, elapsedTime, transcriptionProgress } = useAudioService(onTranscriptionComplete, getActiveApiKey());

    // PostItPanel Handlers
    const onAddPostItNote = (noteData: Omit<PostItNote, 'id' | 'tags' | 'createdAt'>) => {
        const tags = noteData.content.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
        const newNote: PostItNote = {
            ...noteData,
            id: uuidv4(),
            tags,
            createdAt: new Date().toISOString(),
        };
        setAppState(prev => ({ ...prev, postItNotes: [...prev.postItNotes, newNote] }));
    };

    const onUpdatePostItNote = (id: string, updates: Partial<PostItNote>) => {
        setAppState(prev => ({
            ...prev,
            postItNotes: prev.postItNotes.map(note => {
                if (note.id === id) {
                    const updatedNote = { ...note, ...updates };
                    if (updates.content) {
                        updatedNote.tags = updates.content.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
                    }
                    return updatedNote;
                }
                return note;
            })
        }));
    };

    const onDeletePostItNote = (id: string) => {
        setAppState(prev => ({
            ...prev,
            postItNotes: prev.postItNotes.filter(note => note.id !== id)
        }));
    };

    const onProcessPostItText = async (text: string, mode: 'correct' | 'transform'): Promise<string> => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            alert("API Key not configured.");
            return text;
        }

        const prompt = mode === 'correct'
            ? `Corrija a gramática e a ortografia do seguinte texto, mantendo o significado original. Retorne apenas o texto corrigido:\n\n"${text}"`
            : `Transforme o seguinte texto em uma lista de tarefas acionáveis ou um resumo conciso, extraindo a intenção principal. Formate como markdown simples. Retorne apenas o texto transformado:\n\n"${text}"`;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error("Error processing text:", error);
            return text;
        }
    };

    const onPlayPostItTTS = (id: string, text: string) => {
        if (ttsState.playingId === id) {
            if (ttsState.isPaused) resumeTTS();
            else pauseTTS();
        } else {
            playTTS(cleanTextForTTS(text), id);
        }
    };

    // --- CALENDAR FUNCTIONS --- //
    const onScheduleEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'status'>) => {
        const newEvent: CalendarEvent = {
            ...eventData,
            prerequisites: eventData.prerequisites || [],
            executionSteps: eventData.executionSteps || [],
            id: uuidv4(),
            status: 'pending',
        };
        setAppState(prev => ({
            ...prev,
            calendarEvents: [...prev.calendarEvents, newEvent]
        }));
        return `Evento "${newEvent.title}" agendado com sucesso para ${new Date(newEvent.date + 'T' + newEvent.time).toLocaleString('pt-BR')}.`;
    }, []);

    const onEditEvent = useCallback((eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.map(e => e.id === eventId ? { ...e, ...updates } : e)
        }));
    }, []);

    const onDeleteEvent = useCallback((eventId: string) => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.filter(e => e.id !== eventId)
        }));
    }, []);

    const onUpdateEventStatus = useCallback((eventIdOrTitle: string, newStatus?: 'pending' | 'completed') => {
        let confirmationMessage = `Evento "${eventIdOrTitle}" não encontrado.`;
        setAppState(prev => {
            const newEvents = prev.calendarEvents.map(event => {
                if (event.id === eventIdOrTitle || event.title.toLowerCase() === eventIdOrTitle.toLowerCase()) {
                    const finalStatus = newStatus !== undefined ? newStatus : (event.status === 'pending' ? 'completed' : 'pending');
                    if(event.status !== finalStatus) {
                        confirmationMessage = `Evento "${event.title}" marcado como ${finalStatus === 'completed' ? 'concluído' : 'pendente'}.`;
                    }
                    return { ...event, status: finalStatus };
                }
                return event;
            });
            return { ...prev, calendarEvents: newEvents };
        });
        return confirmationMessage;
    }, []);
    
    // --- REMINDER LOGIC --- //
    useEffect(() => {
        const REMINDER_INTERVALS = [
            { minutes: 1440, label: '1d' },  // 1 dia
            { minutes: 360, label: '6h' },   // 6 horas
            { minutes: 60, label: '1h' },    // 1 hora
            { minutes: 30, label: '30m' },
            { minutes: 15, label: '15m' },
        ];
    
        const checkReminders = () => {
            const now = Date.now();
            const newActiveReminders: Reminder[] = [];
    
            appState.calendarEvents.forEach(event => {
                if (event.status !== 'pending') return;
    
                try {
                    const eventTime = new Date(`${event.date}T${event.time}`).getTime();
                    if (isNaN(eventTime) || eventTime < now) return;
    
                    REMINDER_INTERVALS.forEach(interval => {
                        const reminderKey = `${event.id}-${interval.label}`;
                        if (firedReminders.has(reminderKey)) return;
    
                        const reminderTime = eventTime - (interval.minutes * 60 * 1000);
                        
                        if (now >= reminderTime && !activeReminders.some(r => r.id === reminderKey)) {
                            newActiveReminders.push({
                                id: reminderKey,
                                eventId: event.id,
                                eventTitle: event.title,
                                eventTime: event.time,
                                remindAt: eventTime,
                            });
                            setFiredReminders(prev => new Set(prev).add(reminderKey));
                        }
                    });
                } catch (e) {
                    console.error("Erro ao processar evento para lembretes:", event, e);
                }
            });
    
            if (newActiveReminders.length > 0) {
                setActiveReminders(prev => [...prev, ...newActiveReminders]);
            }
        };
    
        const intervalId = setInterval(checkReminders, 30000); // Verifica a cada 30 segundos
        return () => clearInterval(intervalId);
    }, [appState.calendarEvents, activeReminders, firedReminders]);

    const parseMarkdownToReport = (markdown: string): ReportContent | null => {
        try {
            const titleMatch = markdown.match(/^#\s*(.*)/);
            const imageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
            const summaryMatch = markdown.match(/^>\s*(.*)/m);
    
            if (!titleMatch || !summaryMatch) {
                console.warn("Markdown para Relatório: Título ou resumo não encontrado.");
                return null;
            }
    
            const title = titleMatch[1].trim();
            const imageUrl = imageMatch ? imageMatch[1].trim() : '';
            const summary = summaryMatch[1].trim();
    
            const sections: { heading: string, content: string, videoUrl?: string, podcastUrl?: string, imageUrl?: string }[] = [];
            const sectionRegex = /##\s*(.*?)\n([\s\S]*?)(?=(##\s*|$))/g;
            let sectionMatch;
            
            const regex = new RegExp(sectionRegex);
            while ((sectionMatch = regex.exec(markdown)) !== null) {
                const heading = sectionMatch[1].trim();
                let content = sectionMatch[2].trim();
                
                const videoMatch = content.match(/\[video\]\((.*?)\)/);
                let videoUrl: string | undefined = undefined;
    
                if (videoMatch) {
                    videoUrl = videoMatch[1].trim();
                    content = content.replace(/\[video\]\((.*?)\)\n?/, '').trim();
                }

                const podcastMatch = content.match(/\[podcast\]\((.*?)\)/);
                let podcastUrl: string | undefined = undefined;
                if (podcastMatch) {
                    podcastUrl = podcastMatch[1].trim();
                    content = content.replace(/\[podcast\]\((.*?)\)\n?/, '').trim();
                }
        
                const imageSectionMatch = content.match(/!\[.*?\]\((.*?)\)/);
                let imageUrlSection: string | undefined = undefined;
                if (imageSectionMatch) {
                    imageUrlSection = imageSectionMatch[1].trim();
                    content = content.replace(/!\[.*?\]\((.*?)\)\n?/, '').trim();
                }
        
                sections.push({ heading, content, videoUrl, podcastUrl, imageUrl: imageUrlSection });
            }
    
            if (sections.length === 0) {
                const mainContent = markdown.split(/^>\s*.*/m)[1]?.trim();
                if(mainContent) {
                    sections.push({ heading: "Visão Geral", content: mainContent });
                } else {
                   console.warn("Markdown para Relatório: Nenhuma seção encontrada.");
                   return null;
                }
            }
    
            return { title, imageUrl, summary, sections };
        } catch (e) {
            console.error("Falha ao analisar relatório em markdown:", e);
            return null;
        }
    };
    
    const onPerformSerpSearch = useCallback(async (query: string) => {
        const serpApiKey = appState.settings.serpApiKey;
        const geminiApiKey = getActiveApiKey();
    
        if (!serpApiKey || !geminiApiKey) {
            setSerpApiState(prev => ({ ...prev, isLoading: false, error: 'Chave da SERP API ou da Google AI não configurada.' }));
            return;
        }
    
        setSerpApiState({ isLoading: true, error: null, query, cardResult: null, magazineResult: null });
        
        const engines = ['google', 'google_scholar', 'youtube', 'google_news'];
        setAppState(prev => ({ ...prev, settings: { ...prev.settings, serpApiRequestCount: prev.settings.serpApiRequestCount + engines.length } }));
    
        try {
            const searchPromises = engines.map(engine => 
                fetch(`${CORS_PROXY_URL}https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=${engine}`)
                    .then(res => res.ok ? res.json() : Promise.reject(`SERP API (${engine}) Error: ${res.statusText}`))
                    .then(data => ({ engine, data }))
            );
    
            const results = await Promise.allSettled(searchPromises);
    
            const curatedResults: any = {};
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { engine, data } = result.value;
                    if (engine === 'google' && data.organic_results) curatedResults.organic_results = data.organic_results.slice(0, 10).map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet }));
                    if (engine === 'google_scholar' && data.organic_results) curatedResults.scholar_articles = data.organic_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, publication_info: r.publication_info?.summary, snippet: r.snippet }));
                    if (engine === 'youtube' && data.video_results) curatedResults.youtube_videos = data.video_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, channel: r.channel?.name, published_date: r.published_date }));
                    if (engine === 'google_news' && data.news_results) curatedResults.news_articles = data.news_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, source: r.source, date: r.date, snippet: r.snippet }));
                }
            });
    
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            
            const prompt = `
                Com base nos seguintes resultados de pesquisa de múltiplas fontes para a consulta "${query}", crie um cartão de resultado abrangente e bem organizado.

                REGRAS:
                1. Crie um título claro e direto para o cartão que resuma o tópico da pesquisa.
                2. Escreva um resumo informativo e denso, sintetizando os insights mais importantes de TODAS as fontes (resultados orgânicos, acadêmicos, vídeos e notícias).
                3. Selecione os 10 recursos mais importantes e diversos de todas as fontes. Para cada recurso, forneça um título claro e o URI. Priorize a diversidade de fontes (artigos, vídeos, notícias, etc.).

                DADOS DA PESQUISA:
                ${JSON.stringify(curatedResults)}

                Sua saída DEVE ser um objeto JSON válido que corresponda estritamente ao esquema fornecido. Não inclua texto ou explicações fora do objeto JSON.
            `;
    
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Um título abrangente para a consulta de pesquisa." },
                    summary: { type: Type.STRING, description: "Um resumo denso sintetizando todas as fontes." },
                    resources: {
                        type: Type.ARRAY,
                        description: "Os 10 recursos mais relevantes de todas as fontes.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                uri: { type: Type.STRING, description: "O URL do recurso." },
                            },
                            required: ['title', 'uri']
                        }
                    }
                },
                required: ['title', 'summary', 'resources']
            };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                }
            });
            
            const resultJson = JSON.parse(sanitizeJsonResponse(response.text)) as SerpCardResult;
            
            setSerpApiState(prev => ({ ...prev, isLoading: false, cardResult: resultJson }));

        } catch (error: any) {
            console.error("SERP API search failed:", error);
            setSerpApiState(prev => ({ ...prev, isLoading: false, error: `Erro na busca profunda: ${error.message}` }));
        }
    }, [appState.settings.serpApiKey, getActiveApiKey, setAppState]);

    const onPerformMagazineSerpSearch = useCallback(async (query: string) => {
        const serpApiKey = appState.settings.serpApiKey;
        const geminiApiKey = getActiveApiKey();
    
        if (!serpApiKey || !geminiApiKey) {
            const errorMsg = 'Chave da SERP API ou da Google AI não configurada.';
             const errorMessage: Transcription = { id: uuidv4(), speaker: 'system', text: errorMsg, timestamp: Date.now() };
            setTranscriptions(prev => [...prev, errorMessage]);
            setConnectionState(ConnectionState.IDLE);
            return;
        }
    
        setActiveSearchContexts(prev => {
            const next = new Set(prev);
            next.delete('serpApi');
            return next;
        });
    
        const engines = ['google', 'google_scholar', 'youtube', 'google_news'];
        setAppState(prev => ({ ...prev, settings: { ...prev.settings, serpApiRequestCount: prev.settings.serpApiRequestCount + engines.length } }));
    
        try {
            const searchPromises = engines.map(engine => 
                fetch(`${CORS_PROXY_URL}https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=${engine}`)
                    .then(res => res.ok ? res.json() : Promise.reject(`SERP API (${engine}) Error: ${res.statusText}`))
                    .then(data => ({ engine, data }))
            );
    
            const results = await Promise.allSettled(searchPromises);
    
            const curatedResults: any = {};
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { engine, data } = result.value;
                    if (engine === 'google' && data.organic_results) curatedResults.organic_results = data.organic_results.slice(0, 10).map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet }));
                    if (engine === 'google_scholar' && data.organic_results) curatedResults.scholar_articles = data.organic_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, publication_info: r.publication_info?.summary, snippet: r.snippet }));
                    if (engine === 'youtube' && data.video_results) curatedResults.youtube_videos = data.video_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, channel: r.channel?.name, published_date: r.published_date }));
                    if (engine === 'google_news' && data.news_results) curatedResults.news_articles = data.news_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, source: r.source, date: r.date, snippet: r.snippet }));
                }
            });
    
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const prompt = `Você é um pesquisador investigativo de elite. Sua missão é sintetizar os dados de pesquisa de múltiplas fontes fornecidos em um relatório abrangente e aprofundado, no estilo de uma revista, sobre a consulta do usuário: "${query}".

**INSTRUÇÕES CRÍTICAS:**
1.  **MERGULHO PROFUNDO:** Seu objetivo principal é encontrar recursos completos e detalhados. A partir dos dados de pesquisa, identifique e priorize ativamente links para **artigos acadêmicos (de Google Scholar), livros completos, documentários ou filmes, e monografias técnicas detalhadas**. Não se limite aos resultados óbvios.
2.  **SINTETIZE, NÃO LISTE:** Não apenas liste os resultados da pesquisa. Construa uma narrativa coerente, conectando as informações das diferentes fontes para responder à consulta do usuário de forma completa.
3.  **ESTRUTURA:** Sua saída DEVE ser um objeto JSON válido que corresponda estritamente ao esquema fornecido. Não inclua texto ou explicações fora do objeto JSON.

**CONSULTA DO USUÁRIO:** "${query}"

**DADOS DE PESQUISA AGREGADOS:**
${JSON.stringify(curatedResults)}
`;
    
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    mainSummary: { type: Type.STRING, description: "Um resumo conciso e informativo que responde diretamente à consulta, com base nas informações fornecidas." },
                    topics: {
                        type: Type.ARRAY,
                        description: "Uma lista de 4 a 5 subtópicos chave identificados a partir dos resultados da pesquisa.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "O título do subtópico." },
                                summary: { type: Type.STRING, description: "Um breve resumo do subtópico." },
                                resources: {
                                    type: Type.ARRAY,
                                    description: "Os recursos mais relevantes de TODAS as fontes de dados para este tópico.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING, enum: ['video', 'podcast', 'audio', 'book', 'article', 'web-search', 'generic', 'report', 'movie', 'series', 'audiobook', 'academic', 'shopping'] },
                                            title: { type: Type.STRING },
                                            url: { type: Type.STRING },
                                            summary: { type: Type.STRING },
                                            source: { type: Type.STRING, description: "O nome do site ou publicação de origem." },
                                            thumbnailUrl: { type: Type.STRING, description: "URL para uma imagem de thumbnail, se disponível." },
                                        },
                                        required: ['type', 'title', 'url', 'summary', 'source']
                                    }
                                }
                            },
                            required: ['title', 'summary', 'resources']
                        }
                    }
                },
                required: ['mainSummary', 'topics']
            };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                }
            });
            
            const resultJson = JSON.parse(sanitizeJsonResponse(response.text)) as SerpMagazineResult;
            
            const assistantMessage: Transcription = {
                id: uuidv4(),
                speaker: 'assistant',
                text: resultJson.mainSummary,
                structuredContent: resultJson as any,
                timestamp: Date.now(),
            };
            setTranscriptions(prev => [...prev, assistantMessage]);

        } catch (error: any) {
            console.error("SERP API magazine search failed:", error);
            const errorMessage: Transcription = { id: uuidv4(), speaker: 'system', text: `Erro na busca profunda: ${error.message}`, timestamp: Date.now() };
            setTranscriptions(prev => [...prev, errorMessage]);
        } finally {
            setConnectionState(ConnectionState.IDLE);
        }
    }, [appState.settings.serpApiKey, getActiveApiKey, setAppState]);

    const onSendMessage = useCallback(async (message: string) => {
        if (!getActiveApiKey()) {
            alert("Por favor, adicione e ative uma chave de API nas configurações.");
            setActivePanels(prev => ({ ...prev, settings: true }));
            return;
        }
    
        const userMessage: Transcription = {
            id: uuidv4(),
            speaker: 'user',
            text: message,
            timestamp: Date.now(),
            image: imagePreviewUrl ? { name: 'anexada', data: imagePreviewUrl } : undefined,
        };
        setTranscriptions(prev => [...prev, userMessage]);
        setTextInput('');
        setImagePreviewUrl(null);
        const imageBase64 = imageBase64Ref.current;
        imageBase64Ref.current = null;
        setConnectionState(ConnectionState.THINKING);

        if (activeSearchContexts.has('serpApi')) {
            onPerformMagazineSerpSearch(message);
            return;
        }
    
        try {
            const ai = new GoogleGenAI({ apiKey: getActiveApiKey()! });
            let model = 'gemini-2.5-flash';
            
            const useWebSearch = isWebSearchForced || activeSearchContexts.has('web');
            const config: any = {};
            let tools: any[] = [];
            let finalPrompt = message;

            if (appState.settings.sarcasticHumorEnabled) {
                config.systemInstruction = `Quando solicitado a gerar humor, siga este pipeline:
*   Analise variáveis de contexto e clusterize informações para identificar "plot twists".
*   Estruture a narrativa com início, clímax e uma conclusão que pode conter uma reviravolta.
*   Utilize pontos de cadência, contenção emocional e pausas estratégicas.
*   Decida sobre a visualização sensorial (sinestesia): foco visual (prólogo) ou auditivo (prelúdio).
*   Mantenha um limiar ético, usando apenas fontes fidedignas e evitando contradições com a realidade.
*   Aplique humor leve, com acidez e sarcasmo, frequentemente pela inversão de fatos ou destaque da incredibilidade/dualidade.
*   Incorpore recursos retóricos como aliteração, termos "basais literais", reviravoltas e inversões rítmicas.
*   Fundamente todo o conteúdo em pesquisa profunda.`;
            }
    
            if (useWebSearch) {
                model = 'gemini-2.5-pro';
                tools.push({ googleSearch: {} });
                 finalPrompt = `Você é um repórter investigativo de elite encarregado de criar uma reportagem estilo revista, detalhada e abrangente sobre a consulta do usuário.

**REGRAS DE FONTE E CONTEÚDO (MUITO IMPORTANTE):**
1.  **Qualidade da Fonte:** Baseie-se EXCLUSIVAMENTE em fontes de alta qualidade, autoridade e ranking (notícias, artigos acadêmicos, documentação oficial). DESCONSIDERE blogs, fóruns (como Reddit) e fontes de baixa credibilidade.
2.  **Seleção:** Filtre e selecione as 10 fontes mais relevantes que ofereçam informações factuais e resolutivas. Priorize fontes recentes e em alta, mas APENAS se o conteúdo for substancial.
3.  **Factualidade:** Seja estritamente factual. TODA informação deve ser baseada nas fontes. É PROIBIDO inventar informações, detalhes ou "alucinar".
4.  **Citações:** Ao redigir o conteúdo das seções, mescle sua escrita com citações diretas das fontes, usando o formato de blockquote do markdown (> texto citado).

**ESTRUTURA DA REPORTAGEM (OBRIGATÓRIO):**
Sua resposta DEVE ser em markdown e seguir esta estrutura ESTRITA:

# [Título Criativo e Relevante para a Matéria]
![Alt text para a imagem](URL_de_uma_imagem_genérica_relevante_de_biblioteca_gratuita)
> [Resumo da matéria em um parágrafo conciso e informativo]

## [Título da Seção 1]
(Opcional: ![Alt text para a imagem da seção](URL_da_imagem_da_seção))
[Conteúdo detalhado da seção 1. Desenvolva o tópico com base nas fontes e inclua citações.]
(Opcional: [video](URL_de_um_video_do_YouTube_PÚBLICO_E_INCORPORÁVEL))
(Opcional: [podcast](URL_de_um_podcast_em_MP3_ou_plataforma_de_streaming))

## [Título da Seção 2]
(Opcional: ![Alt text para a imagem da seção 2](URL_da_imagem_da_seção_2))
[Conteúdo detalhado da seção 2. Continue o desenvolvimento com base nas fontes e inclua citações.]
(Opcional: [video](URL_de_um_video_do_YouTube_PÚBLICO_E_INCORPORÁVEL_2))
(Opcional: [podcast](URL_de_um_podcast_em_MP3_ou_plataforma_de_streaming_2))

... (adicione mais seções conforme necessário para uma cobertura completa) ...

**CONSULTA DO USUÁRIO:**
"${message}"`;
            } else {
                const calendarTools: FunctionDeclaration[] = [
                    { name: 'schedule_event', description: 'Agenda um novo evento, compromisso ou tarefa no calendário.', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING, description: 'Formato AAAA-MM-DD' }, time: { type: Type.STRING, description: 'Formato HH:MM' }, description: { type: Type.STRING } }, required: ['title', 'date', 'time']}},
                    { name: 'mark_event_as_completed', description: 'Marca um evento como concluído.', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING } }, required: ['title']}},
                    { name: 'list_events', description: 'Lista os eventos para uma data específica.', parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: 'Formato AAAA-MM-DD. Padrão: hoje.' } }}},
                ];
                if (calendarTools.length > 0) {
                  tools.push({ functionDeclarations: calendarTools });
                }
                if (!appState.settings.sarcasticHumorEnabled) {
                    config.systemInstruction = "Você é um assistente prestativo e direto.";
                }
            }
            if (tools.length > 0) {
                config.tools = tools;
            }

            const contentParts: any[] = [{ text: finalPrompt }];
            if (imageBase64) contentParts.unshift({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
            
            if (activeSearchContexts.has('drive')) {
                 const driveFiles = await googleDrive.searchFiles(message);
                 if(driveFiles.length > 0) {
                    const driveContext = "Responda com base no contexto do Google Drive e na pergunta do usuário.\nContexto do Google Drive:\n" + driveFiles.map(f => `- ${f.name} (link: ${f.webViewLink})`).join('\n') + `\n\n`;
                    let userTextPart = contentParts.find(p => p.text);
                    if(userTextPart) userTextPart.text = driveContext + userTextPart.text;
                 }
            }
            
            const contents = { parts: contentParts };

            const genaiResponse = await ai.models.generateContent({ model, contents, config });

            let assistantText = genaiResponse.text;
            let reportContent: ReportContent | undefined = undefined;
            const functionCalls = genaiResponse.functionCalls;
            let resourceLinks: ResourceLink[] = [];

            if (useWebSearch) {
                reportContent = parseMarkdownToReport(assistantText) || undefined;
                if (reportContent) {
                    assistantText = reportContent.summary;
                }
            }
            else if (functionCalls && functionCalls.length > 0) {
                const toolUseTranscription: Transcription = { id: uuidv4(), speaker: 'system', text: `Usando ferramenta: ${functionCalls.map(fc => fc.name).join(', ')}...`, timestamp: Date.now() };
                setTranscriptions(prev => [...prev, toolUseTranscription]);

                const functionResponses = [];
                for (const fc of functionCalls) {
                    let result: any;
                    switch(fc.name) {
                        case 'schedule_event':
                            result = onScheduleEvent(fc.args as any);
                            break;
                        case 'mark_event_as_completed':
                            result = onUpdateEventStatus(fc.args.title, 'completed');
                            break;
                        case 'list_events':
                            const targetDate = fc.args.date || new Date().toISOString().split('T')[0];
                            const events = appState.calendarEvents.filter(e => e.date === targetDate).sort((a,b) => a.time.localeCompare(b.time));
                            result = events.length > 0 
                                ? `Eventos para ${new Date(targetDate+'T00:00:00').toLocaleDateString('pt-BR')}: ` + events.map(e => `${e.time} - ${e.title} (${e.status})`).join('; ')
                                : `Nenhum evento para ${new Date(targetDate+'T00:00:00').toLocaleDateString('pt-BR')}.`;
                            break;
                        default:
                            result = { error: 'Função desconhecida.' };
                    }
                     functionResponses.push({ id: fc.id, name: fc.name, response: { result } });
                }

                const secondResponse = await ai.models.generateContent({
                    model,
                    contents: { parts: [ ...contentParts, { toolCall: { functionCalls } }, { toolResponse: { functionResponses } } ]},
                    config
                });
                assistantText = secondResponse.text;
            }

            const groundingMetadata = genaiResponse.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                resourceLinks = groundingMetadata.groundingChunks
                    .map((chunk: any) => (chunk.web) ? ({ uri: chunk.web.uri, title: chunk.web.title || 'Fonte' }) : null)
                    .filter(Boolean);
            }
    
            const assistantMessage: Transcription = {
                id: uuidv4(),
                speaker: 'assistant',
                text: assistantText,
                timestamp: Date.now(),
                reportContent: reportContent,
                resourceLinks: resourceLinks.length > 0 ? resourceLinks : undefined,
            };
            setTranscriptions(prev => [...prev, assistantMessage]);
    
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Transcription = {
                id: uuidv4(),
                speaker: 'system',
                text: `Ocorreu um erro: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: Date.now(),
            };
            setTranscriptions(prev => [...prev, errorMessage]);
        } finally {
            setConnectionState(ConnectionState.IDLE);
        }
    }, [
        appState.settings.activeApiKeyId,
        appState.apiKeys,
        appState.calendarEvents,
        imagePreviewUrl,
        activeSearchContexts,
        isWebSearchForced,
        googleDrive,
        onScheduleEvent,
        onUpdateEventStatus,
        appState.settings.sarcasticHumorEnabled,
        onPerformMagazineSerpSearch,
    ]);
    
    const toggleConversationMode = () => {
        const isLive = interactionMode === 'live' || interactionMode === 'cocreator';
        if (isLive) {
            if (liveConnectionState !== ConnectionState.IDLE) {
                stopConversation();
            } else {
                startConversation();
            }
        }
    };
    
    const onEnterCoCreatorMode = (docId: string) => {
        const doc = appState.documents.find(d => d.id === docId);
        if (doc) {
            setActiveDocumentId(doc.id);
            setInteractionMode('cocreator');
        } else {
            console.error("Documento não encontrado para o modo co-criador");
        }
    };

    const togglePanel = (panel: string) => {
        setActivePanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const handleSettingsChange = (newSettings: AssistantSettings) => {
        setAppState(prev => ({ ...prev, settings: newSettings }));
    };
    
    const validateReplicateApiKey = useCallback(async (key: string | null) => {
        if (!key) {
            setReplicateApiStatus('idle');
            return;
        }
        setReplicateApiStatus('checking');
        try {
            const response = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro`, {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (response.ok) {
                setReplicateApiStatus('valid');
            } else {
                setReplicateApiStatus('invalid');
            }
        } catch (error) {
            console.error('Replicate API validation failed:', error);
            setReplicateApiStatus('invalid');
        }
    }, []);

    const handleReplicateApiKeyChange = (newKey: string) => {
        handleSettingsChange({ ...appState.settings, replicateApiKey: newKey });
        validateReplicateApiKey(newKey);
    };

    useEffect(() => {
        validateReplicateApiKey(appState.settings.replicateApiKey);
    }, [appState.settings.replicateApiKey, validateReplicateApiKey]);

    const fetchWebApi = useCallback(async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
        const token = appState.settings.spotifyToken;
        if (!token) {
            throw new Error('Token do Spotify não configurado.');
        }
        const res = await fetch(`https://api.spotify.com/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message || `Spotify API Error: ${res.statusText}`);
        }
        if (res.status === 201 || res.status === 204) {
             return res.status === 201 ? await res.json() : true;
        }
        return await res.json();
    }, [appState.settings.spotifyToken]);

    const validateSpotifyToken = useCallback(async (token: string | null) => {
        if (!token) {
            setSpotifyTokenStatus('idle');
            return;
        }
        setSpotifyTokenStatus('checking');
        try {
            await fetchWebApi('v1/me', 'GET');
            setSpotifyTokenStatus('valid');
        } catch (error) {
            console.error('Validação do token do Spotify falhou:', error);
            setSpotifyTokenStatus('invalid');
        }
    }, [fetchWebApi]);

    useEffect(() => {
        validateSpotifyToken(appState.settings.spotifyToken);
    }, [appState.settings.spotifyToken, validateSpotifyToken]);

    const handleSpotifyTokenChange = (newToken: string) => {
        handleSettingsChange({ ...appState.settings, spotifyToken: newToken });
        validateSpotifyToken(newToken);
    };

    const fetchTopTracks = useCallback(async () => {
        setSpotifyState(prev => ({ ...prev, isLoading: true, error: null, statusMessage: 'Buscando suas músicas mais tocadas...' }));
        try {
            const result = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
            setSpotifyState(prev => ({ ...prev, isLoading: false, topTracks: result.items, statusMessage: 'Top 5 músicas carregadas!' }));
        } catch (error: any) {
            setSpotifyState(prev => ({ ...prev, isLoading: false, error: error.message, statusMessage: 'Falha ao buscar músicas.' }));
        }
    }, [fetchWebApi]);

    const createSpotifyPlaylist = useCallback(async () => {
        if (spotifyState.topTracks.length === 0) return;
        setSpotifyState(prev => ({ ...prev, isLoading: true, error: null, statusMessage: 'Criando sua playlist...' }));

        try {
            const { id: user_id } = await fetchWebApi('v1/me', 'GET');
            
            const playlist = await fetchWebApi(`v1/users/${user_id}/playlists`, 'POST', {
                "name": "Meu Top 5 Músicas (Gerado por IA)",
                "description": "Playlist com suas músicas mais tocadas, criada pelo Assistente Neural.",
                "public": false
            });

            setSpotifyState(prev => ({ ...prev, statusMessage: 'Adicionando músicas à playlist...' }));

            const tracksUri = spotifyState.topTracks.map(track => track.uri);
            await fetchWebApi(`v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`, 'POST');

            setSpotifyState(prev => ({ ...prev, isLoading: false, createdPlaylistId: playlist.id, statusMessage: 'Playlist criada com sucesso!' }));

        } catch (error: any) {
            setSpotifyState(prev => ({ ...prev, isLoading: false, error: error.message, statusMessage: 'Falha ao criar a playlist.' }));
        }
    }, [fetchWebApi, spotifyState.topTracks]);
    
    const validateSerpApiKey = useCallback(async (key: string | null) => {
        if (!key) {
            setSerpApiStatus('idle');
            return;
        }
        setSerpApiStatus('checking');
        try {
            const response = await fetch(`${CORS_PROXY_URL}https://serpapi.com/locations.json`);
            if (response.ok) {
                setSerpApiStatus('valid');
            } else {
                 const errorBody = await response.json();
                 if (errorBody?.error?.includes("invalid API key")) {
                    setSerpApiStatus('invalid');
                 } else {
                    setSerpApiStatus('valid'); 
                 }
            }
        } catch (error) {
            console.error('SERP API validation failed:', error);
            setSerpApiStatus('invalid');
        }
    }, []);

    const handleSerpApiKeyChange = (newKey: string) => {
        handleSettingsChange({ ...appState.settings, serpApiKey: newKey });
        validateSerpApiKey(newKey);
    };

    useEffect(() => {
        validateSerpApiKey(appState.settings.serpApiKey);
    }, [appState.settings.serpApiKey, validateSerpApiKey]);

    const onPlayPauseTTS = (id?: string) => {
        const targetId = id || ttsState.playingId;
        if (!targetId) return;

        if (ttsState.playingId === targetId) {
            if (ttsState.isPaused) resumeTTS();
            else pauseTTS();
        } else {
            const transcriptionToPlay = transcriptions.find(t => t.id === targetId);
            if (transcriptionToPlay) {
                let textToSpeak = transcriptionToPlay.text;
                if (transcriptionToPlay.reportContent) {
                    const report = transcriptionToPlay.reportContent;
                    const sectionsText = report.sections.map(s => `${s.heading}. ${s.content}`).join('\n\n');
                    textToSpeak = `${report.title}. ${report.summary}. ${sectionsText}`;
                }
                playTTS(cleanTextForTTS(textToSpeak), targetId);
            }
        }
    };
    
    const onSetImageGenerationMode = (mode: 'generate' | 'edit') => {
        setImageGenerationState(prev => ({ ...prev, mode, imageToEdit: mode === 'generate' ? null : prev.imageToEdit, error: null }));
    };

    const onSelectImageToEdit = (image: ImageGeneration | null) => {
        setImageGenerationState(prev => ({
            ...prev,
            mode: image ? 'edit' : 'generate',
            imageToEdit: image,
            error: null,
        }));
    };

    const urlToDataUri = async (url: string): Promise<string> => {
        const response = await fetch(`${CORS_PROXY_URL}${url}`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar imagem para edição: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const onEditImage = useCallback(async (prompt: string) => {
        const REPLICATE_API_TOKEN = appState.settings.replicateApiKey;
        if (!REPLICATE_API_TOKEN) {
            setImageGenerationState(prev => ({ ...prev, error: "Chave da API do Replicate não configurada nas Configurações." }));
            return;
        }
    
        if (!imageGenerationState.imageToEdit) {
            setImageGenerationState(prev => ({ ...prev, error: "Nenhuma imagem selecionada para editar." }));
            return;
        }
    
        setImageGenerationState(prev => ({ ...prev, isLoading: true, error: null }));
    
        try {
            const imageUrl = imageGenerationState.imageToEdit.imageUrl;
            const imageDataUri = imageUrl.startsWith('data:') ? imageUrl : await urlToDataUri(imageUrl);

            const createResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "version": "c1f78818f3e583151950d2681557d9045763595f4e153e36e4f323a6331e840a",
                    "input": { prompt, image: imageDataUri }
                })
            });
    
            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(errorBody.detail || `Falha ao criar predição de edição: ${createResponse.statusText}`);
            }
    
            let prediction = await createResponse.json();
    
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const getResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
                });
                if (!getResponse.ok) {
                    const errorBody = await getResponse.json();
                    throw new Error(errorBody.detail || `Falha ao obter o status da predição: ${getResponse.statusText}`);
                }
                prediction = await getResponse.json();
            }
    
            if (prediction.status === 'failed') {
                throw new Error(`A edição da imagem falhou: ${prediction.error}`);
            }
    
            const newImageUrl = prediction.output[0];
            const newGeneration: ImageGeneration = {
                id: uuidv4(),
                prompt,
                imageUrl: newImageUrl,
                aspectRatio: imageGenerationState.imageToEdit!.aspectRatio,
                createdAt: new Date().toISOString()
            };
            setImageGenerationState(prev => ({
                ...prev,
                generations: [newGeneration, ...prev.generations],
                mode: 'generate',
                imageToEdit: null,
            }));
    
        } catch (error: any) {
            console.error('Erro na edição de imagem:', error);
            setImageGenerationState(prev => ({ ...prev, error: error.message }));
        } finally {
            setImageGenerationState(prev => ({ ...prev, isLoading: false }));
        }
    }, [imageGenerationState.imageToEdit, appState.settings.replicateApiKey]);
    
    const onGenerateImage = useCallback(async (prompt: string, aspectRatio: string) => {
        const REPLICATE_API_TOKEN = appState.settings.replicateApiKey;
        if (!REPLICATE_API_TOKEN) {
            setImageGenerationState(prev => ({ ...prev, error: "Chave da API do Replicate não configurada nas Configurações." }));
            return;
        }
    
        setImageGenerationState(prev => ({ ...prev, isLoading: true, error: null }));
    
        try {
            const createResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "version": "f77983347a61476b36d0774a3501a4099955776d52f9547d7b0f69a35e69e48f",
                    "input": {
                        prompt: prompt,
                        aspect_ratio: aspectRatio,
                        output_format: "webp",
                        output_quality: 90,
                    }
                })
            });
    
            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(errorBody.detail || `Falha ao criar predição: ${createResponse.statusText}`);
            }
    
            let prediction = await createResponse.json();
    
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const getResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
                });
                
                if (!getResponse.ok) {
                    const errorBody = await getResponse.json();
                    throw new Error(errorBody.detail || `Falha ao obter o status da predição: ${getResponse.statusText}`);
                }
                
                prediction = await getResponse.json();
            }
    
            if (prediction.status === 'failed') {
                throw new Error(`A geração da imagem falhou: ${prediction.error}`);
            }
    
            const imageUrl = prediction.output[0];
            const newGeneration: ImageGeneration = {
                id: uuidv4(),
                prompt,
                imageUrl,
                aspectRatio,
                createdAt: new Date().toISOString()
            };
            setImageGenerationState(prev => ({
                ...prev,
                generations: [newGeneration, ...prev.generations]
            }));
    
        } catch (error: any) {
            console.error('Erro na geração de imagem:', error);
            setImageGenerationState(prev => ({ ...prev, error: error.message }));
        } finally {
            setImageGenerationState(prev => ({ ...prev, isLoading: false }));
        }
    }, [appState.settings.replicateApiKey]);

    const interruptAssistant = () => {
        setConnectionState(ConnectionState.IDLE);
    };

    const toggleWebSearch = () => setIsWebSearchForced(prev => !prev);
    
    const onStartNewConversation = async () => {
        if (transcriptions.length === 0 && liveModeTranscriptions.length === 0) {
            chatRef.current = null;
            return;
        }
    
        const currentTranscriptions = interactionMode === 'live' ? liveModeTranscriptions : transcriptions;
    
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            console.error("Não é possível salvar a sessão de chat sem uma chave de API.");
            setTranscriptions([]);
            setLiveModeTranscriptions([]);
            chatRef.current = null;
            return;
        }
    
        setConnectionState(ConnectionState.SAVING);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const conversationText = currentTranscriptions.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
    
            const prompt = `
                Com base na transcrição da conversa a seguir, gere um título conciso, um resumo de um parágrafo e até 5 tags relevantes.
    
                CONVERSA:
                ---
                ${conversationText}
                ---
    
                Sua resposta DEVE ser um objeto JSON válido com a seguinte estrutura:
                {
                  "title": "Um título curto e descritivo para a conversa.",
                  "summary": "Um único parágrafo resumindo os pontos-chave da conversa.",
                  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
                }
            `;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['title', 'summary', 'tags'],
                    }
                }
            });
    
            const result = JSON.parse(sanitizeJsonResponse(response.text));
    
            const newSession: ChatSession = {
                id: uuidv4(),
                title: result.title,
                summary: result.summary,
                tags: result.tags,
                timestamp: new Date().toISOString(),
                transcriptions: [...currentTranscriptions]
            };
    
            setAppState(prev => ({
                ...prev,
                chatHistory: [newSession, ...prev.chatHistory]
            }));
    
        } catch (error) {
            console.error("Falha ao gerar resumo do chat e salvar sessão:", error);
            const fallbackSession: ChatSession = {
                id: uuidv4(),
                title: `Chat de ${new Date().toLocaleString('pt-BR')}`,
                summary: 'Não foi possível gerar um resumo para esta sessão.',
                tags: ['sem-resumo'],
                timestamp: new Date().toISOString(),
                transcriptions: [...currentTranscriptions]
            };
             setAppState(prev => ({
                ...prev,
                chatHistory: [fallbackSession, ...prev.chatHistory]
            }));
        } finally {
            setTranscriptions([]);
            setLiveModeTranscriptions([]);
            chatRef.current = null;
            setConnectionState(ConnectionState.IDLE);
        }
    };
    
    const onImageSelected = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result?.toString().split(',')[1];
            if (base64String) {
                imageBase64Ref.current = base64String;
                setImagePreviewUrl(URL.createObjectURL(file));
            }
        };
        reader.readAsDataURL(file);
    };

    const onClearImage = () => {
        setImagePreviewUrl(null);
        imageBase64Ref.current = null;
    };
    const onPlayVideo = (url: string) => setMediaPlayerUrl(url);
    const closeMediaPlayer = () => setMediaPlayerUrl(null);
    const onLoadLocalContext = (link: LocalContextLink) => console.log('Load local context:', link);
    const onAddVideoToLibrary = (resource: ResourceLink) => {
        const newVideo: Video = { id: uuidv4(), videoUrl: resource.uri, title: resource.title, thumbnailUrl: resource.thumbnailUrl || '', summary: 'Analisando...', tags: [], isProcessing: true };
        setAppState(prev => ({ ...prev, videos: [...prev.videos, newVideo] }));
        setTimeout(() => {
            setAppState(prev => ({
                ...prev,
                videos: prev.videos.map(v => v.id === newVideo.id ? { ...v, summary: `Resumo do vídeo sobre ${v.title}.`, tags: ['tag1', 'tag2'], isProcessing: false } : v)
            }));
        }, 3000);
    };
    const onAddResourceToArchive = (resource: ResourceLink) => {
      setAppState(prev => ({
        ...prev,
        archivedLinks: [
          ...prev.archivedLinks,
          { prefillUrl: JSON.stringify(resource) } as any
        ]
      }));
      togglePanel('literaryArchive');
    };
    const clearVideoSearchResults = () => setVideoSearchResults([]);
    const onIngestUrl = (url: string) => console.log('Ingest URL:', url);
    const onLoadDocumentToEditor = (docId: string) => { 
        setActiveDocumentId(docId);
        togglePanel('documentEditor'); 
    };
    const onDismissInfoCard = (id: string) => setInformationCards(prev => prev.filter(c => c.id !== id));
    const onDismissReminder = (reminderId: string) => {
        setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
    };
    const onOpenDeepDive = useCallback((resources: MagazineResource[]) => {
        setDeepDiveResources(resources);
    }, []);
    const onCloseDeepDive = useCallback(() => {
        setDeepDiveResources(null);
    }, []);
    const onAnalyzeFile = (file: File) => console.log('Analyze file:', file);
    const handleAnalysisAction = (action: string) => console.log('Analysis action:', action);
    const onPerformGroundedSearch = (query: string) => {
        setGroundedSearchState({isLoading: true, error: null, result: null });
        setTimeout(() => {
            setGroundedSearchState({
                isLoading: false,
                error: null,
                result: {
                    summary: `Esta é uma resposta simulada para a busca: "${query}".`,
                    sources: [{ title: 'Fonte 1', uri: 'https://example.com' }]
                }
            })
        }, 2000);
    };
    const onLoadContacts = () => console.log('Load contacts');


    // --- PODCAST HUB LOGIC ---
    const onSearchAndAddPodcast = useCallback(async (query: string) => {
        setAppState(prev => ({ ...prev, podcastState: { ...prev.podcastState, isLoading: true, error: null } }));
        // Simulação de busca
        await new Promise(res => setTimeout(res, 1500));
        
        const queryLower = query.toLowerCase();
        const foundPodcast = mockPodcasts.find(p => p.show.title.toLowerCase().includes(queryLower));

        if (foundPodcast) {
             setAppState(prev => {
                const alreadyExists = prev.podcastState.shows.some(s => s.id === foundPodcast.show.id);
                if (alreadyExists) {
                    return { ...prev, podcastState: { ...prev.podcastState, isLoading: false, error: "Este podcast já está na sua biblioteca." }};
                }
                
                const newShows = [...prev.podcastState.shows, foundPodcast.show];
                const newEpisodes = { ...prev.podcastState.episodes, [foundPodcast.show.id]: foundPodcast.episodes };
                
                return { ...prev, podcastState: { ...prev.podcastState, shows: newShows, episodes: newEpisodes, isLoading: false, error: null }};
            });
        } else {
            setAppState(prev => ({ ...prev, podcastState: { ...prev.podcastState, isLoading: false, error: `Nenhum podcast encontrado para "${query}".` } }));
        }
    }, [setAppState]);

    const onAddPodcastByUrl = useCallback(async (url: string) => {
        // Implementação futura com parsing de feed RSS
    }, []);

    const onPlayEpisode = useCallback((showId: string, episodeId: string) => {
        setAppState(prev => ({
            ...prev,
            podcastState: {
                ...prev.podcastState,
                nowPlaying: { showId, episodeId },
                playerStatus: 'playing',
            }
        }));
    }, [setAppState]);

    const onPlayerAction = useCallback((action: 'play' | 'pause' | 'stop') => {
        setAppState(prev => {
             if (action === 'play' && prev.podcastState.nowPlaying) {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'playing' } };
             }
             if (action === 'pause' && prev.podcastState.nowPlaying) {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'paused' } };
             }
             if (action === 'stop') {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'stopped' } };
             }
             return prev;
        });
    }, [setAppState]);

    const onUpdateEpisodeState = useCallback((episodeId: string, state: { playbackPosition?: number; listened?: boolean }) => {
        setAppState(prev => {
            const currentEpisodeState = prev.podcastState.episodeStates[episodeId] || { playbackPosition: 0, listened: false };
            return {
                ...prev,
                podcastState: {
                    ...prev.podcastState,
                    episodeStates: {
                        ...prev.podcastState.episodeStates,
                        [episodeId]: {
                            ...currentEpisodeState,
                            ...state,
                        }
                    }
                }
            }
        });
    }, [setAppState]);

    const onAddToQueue = useCallback((episodeId: string) => {
        setAppState(prev => ({
            ...prev,
            podcastState: {
                ...prev.podcastState,
                playbackQueue: [...prev.podcastState.playbackQueue.filter(id => id !== episodeId), episodeId],
            }
        }));
    }, [setAppState]);

    const onPlayNextInQueue = useCallback(() => {
        setAppState(prev => {
            const { playbackQueue, episodes } = prev.podcastState;
            if (playbackQueue.length === 0) {
                return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'stopped', nowPlaying: null } };
            }
            const nextEpisodeId = playbackQueue[0];
            const remainingQueue = playbackQueue.slice(1);
            
            // Encontrar o showId do próximo episódio
            let showId: string | null = null;
            for (const sId in episodes) {
                if (episodes[sId].some(e => e.id === nextEpisodeId)) {
                    showId = sId;
                    break;
                }
            }
            
            if (showId) {
                return { ...prev, podcastState: { ...prev.podcastState, playbackQueue: remainingQueue, nowPlaying: { showId, episodeId: nextEpisodeId }, playerStatus: 'playing' } };
            }

            // Se não encontrar o show (improvável), apenas limpa a fila e para
            return { ...prev, podcastState: { ...prev.podcastState, playbackQueue: [], playerStatus: 'stopped', nowPlaying: null } };
        });
    }, [setAppState]);

    const podcastPanelProps = {
        isOpen: !!activePanels.podcast,
        onClose: () => togglePanel('podcast'),
        podcastState: appState.podcastState,
        onSearchAndAddPodcast,
        onAddPodcastByUrl,
        onPlayEpisode,
        onPlayerAction,
        onUpdateEpisodeState,
        onAddToQueue,
        onPlayNextInQueue,
    };
    
    // Props
    const settingsPanelProps = { settings: appState.settings, onSettingsChange: handleSettingsChange, onReplicateApiKeyChange: handleReplicateApiKeyChange, replicateApiStatus: replicateApiStatus, onSpotifyTokenChange: handleSpotifyTokenChange, spotifyTokenStatus: spotifyTokenStatus, onSerpApiKeyChange: handleSerpApiKeyChange, serpApiStatus, onTomTomApiKeyChange: (key: string) => handleSettingsChange({ ...appState.settings, tomTomApiKey: key }), onOpenAboutModal: () => {}, isOpen: !!activePanels.settings, onClose: () => togglePanel('settings'), promptCartridges: [], activeCartridgeId: null, onAddPromptCartridge: () => {}, onDeletePromptCartridge: () => {}, onSetActivePromptCartridge: () => {}, apiKeys: appState.apiKeys, activeApiKeyId: appState.settings.activeApiKeyId, onAddApiKey: (key: { name: string; value: string }) => setAppState(prev => ({...prev, apiKeys: [...prev.apiKeys, { ...key, id: uuidv4() }]})), onDeleteApiKey: (id: string) => setAppState(prev => ({...prev, apiKeys: prev.apiKeys.filter(k => k.id !== id)})), onSetActiveApiKey: (id: string) => setAppState(prev => ({...prev, settings: {...prev.settings, activeApiKeyId: id }})) };
    const userProfilePanelProps = { isOpen: !!activePanels.userProfile, onClose: () => togglePanel('userProfile'), profileData: appState.userProfileData, isLoading: false, onUpdateProfile: () => {} };
    const chatHistoryPanelProps = { isOpen: !!activePanels.history, onClose: () => togglePanel('history'), history: appState.chatHistory, onSelectChat: () => {}, activeChatId: null, onDeleteChat: () => {}, onClearHistory: () => {} };
    const calendarPanelProps = { isOpen: !!activePanels.calendar, onClose: () => togglePanel('calendar'), events: appState.calendarEvents, onScheduleEvent, onEditEvent, onDeleteEvent, onUpdateEventStatus };
    const rssPanelProps = { isOpen: !!activePanels.rss, onClose: () => togglePanel('rss'), articles: [], isLoading: false, error: null, onRefresh: () => {}, selectedVoiceName: appState.settings.selectedBrowserVoice, speechRate: appState.settings.speechRate };
    const documentLibraryPanelProps = { isOpen: !!activePanels.documentLibrary, onClose: () => togglePanel('documentLibrary'), documents: [], onLoadDocument: () => {}, onCreateNewDocument: () => {}, onDeleteDocument: () => {}, onUpdateDocumentTags: () => {} };
    const documentEditorPanelProps = { isOpen: !!activePanels.documentEditor, onClose: () => { if (interactionMode === 'cocreator') { setInteractionMode('chat'); stopConversation(); } togglePanel('documentEditor'); }, activeDocument: appState.documents.find(d => d.id === activeDocumentId) || null, onSetDocumentContent: (content: string) => activeDocumentId && onSetDocumentContent(activeDocumentId, content), onEnterCoCreatorMode: onEnterCoCreatorMode, highlights: [], modifiedRanges: [], isComparing: false, originalContentForComparison: '', improvementBlocks: [], activeImprovementBlockId: null, isAnalyzingText: false, isEditorChatOpen: false, editorChatHistory: [], isEditorChatLoading: false, editorSpecialization: '', onSetDocumentTitle: () => {}, onSaveActiveDocument: () => {}, isDocumentHistoryOpen: false, onToggleDocumentHistory: () => {}, onRevertToVersion: () => {}, onRequestAnalysis: () => {}, onRewriteSelectionAndSuggest: () => {}, onRequestImprovements: () => {}, onApplyImprovement: () => {}, onApplyAllImprovements: () => {}, onExitComparisonView: () => {}, onToggleEditorChat: () => {}, onSendEditorChatMessage: () => {}, onApplyEditorAction: () => {}, onRejectEditorAction: () => {}, onSetEditorSpecialization: () => {}, onCreateNewDocument: () => {}, onExportDocument: () => {} };
    const synthesisHubPanelProps = { state: appState.synthesisHub, onClose: () => togglePanel('synthesisHub'), documents: [], videos: [], onToggleSource: () => {}, onSynthesize: () => {}, onClear: () => {} };
    const videotecaPanelProps = { isOpen: !!activePanels.videoteca, onClose: () => togglePanel('videoteca'), videos: appState.videos, onAddVideoByUrl: onAddVideoToLibrary, onDeleteVideo: (id: string) => setAppState(prev => ({...prev, videos: prev.videos.filter(v => v.id !== id)})), isProcessing: isIngesting };
    const literaryArchivePanelProps = { isOpen: !!activePanels.literaryArchive, onClose: () => togglePanel('literaryArchive'), library: appState.archivedLinks, onAddLink: (link: Omit<ArchivedLink, 'id'>) => setAppState(prev => ({...prev, archivedLinks: [...prev.archivedLinks.filter(l => !l.prefillUrl), {...link, id: uuidv4()}]})), onUpdateLink: (id: string, updates: Partial<ArchivedLink>) => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.map(l => l.id === id ? {...l, ...updates} : l)})), onDeleteLink: (id: string) => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.filter(l => l.id !== id)})), onGenerateDescription: async () => 'Generated description', prefillUrl: appState.archivedLinks.find(l => l.prefillUrl)?.prefillUrl ? JSON.parse(appState.archivedLinks.find(l => l.prefillUrl)!.prefillUrl!) : null, onClearPrefill: () => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.filter(l => !l.prefillUrl)})) };
    const postItPanelProps = { isOpen: !!activePanels.postIt, onClose: () => togglePanel('postIt'), notes: appState.postItNotes, onAddNote: onAddPostItNote, onUpdateNote: onUpdatePostItNote, onDeleteNote: onDeletePostItNote, onProcessText: onProcessPostItText, onPlayTTS: onPlayPostItTTS, onStopTTS: stopTTS, ttsState: ttsState };
    const imageGenerationPanelProps = { isOpen: !!activePanels.imageGeneration, onClose: () => togglePanel('imageGeneration'), state: imageGenerationState, onGenerateImage, onEditImage, onSetMode: onSetImageGenerationMode, onSelectImageToEdit };
    const spotifyPanelProps = { isOpen: !!activePanels.spotify, onClose: () => togglePanel('spotify'), state: spotifyState, tokenStatus: spotifyTokenStatus, onFetchTopTracks: fetchTopTracks, onCreatePlaylist: createSpotifyPlaylist };
    const serpApiPanelProps = { isOpen: !!activePanels.serpApi, onClose: () => togglePanel('serpApi'), state: serpApiState, onPerformSearch: onPerformSerpSearch, onOpenSettings: () => togglePanel('settings') };
    const openStreetMapPanelProps = { isOpen: !!activePanels.openStreetMap, onClose: () => togglePanel('openStreetMap') };

    return {
        isInitializing: false,
        persistenceMode,
        initializePersistence,
        isDbActive,
        dbStatus,
        transcriptions,
        connectionState,
        interactionMode,
        setInteractionMode,
        toggleConversationMode,
        interruptAssistant,
        ttsState,
        onPlayPauseTTS,
        onStopTTS: stopTTS,
        onVolumeChange: (v: number) => handleSettingsChange({ ...appState.settings, volume: v }),
        volume: appState.settings.volume,
        recordingState,
        startRecording,
        stopRecording,
        elapsedTime,
        transcriptionProgress,
        textInput,
        setTextInput,
        onSendMessage,
        activeSearchContexts,
        onToggleSearchContext: (ctx: string) => setActiveSearchContexts(prev => {
            const next = new Set(prev);
            if (next.has(ctx)) next.delete(ctx);
            else next.add(ctx);
            return next;
        }),
        dynamicSearchContexts,
        isWebSearchForced,
        toggleWebSearch,
        onStartNewConversation,
        onImageSelected,
        imagePreviewUrl,
        onClearImage,
        videoSearchResults,
        clearVideoSearchResults,
        onPlayVideo,
        isIngesting,
        onIngestUrl,
        videos: appState.videos,
        documents: appState.documents,
        onLoadDocumentToEditor,
        onLoadLocalContext,
        onAddVideoToLibrary,
        onAddResourceToArchive,
        mediaPlayerUrl,
        closeMediaPlayer,
        informationCards,
        onDismissInfoCard,
        activeReminders,
        onDismissReminder,
        deepAnalysisState,
        onAnalyzeFile,
        handleAnalysisAction,
        groundedSearchState,
        onPerformGroundedSearch,
        projectAssistantState,
        isProjectAssistantModeActive,
        onLoadContacts,
        liveTranscript,
        liveModeTranscriptions,
        coCreatorSpecialization,
        setCoCreatorSpecialization,
        togglePanel,
        activePanels,
        settingsPanelProps,
        userProfilePanelProps,
        chatHistoryPanelProps,
        calendarPanelProps,
        rssPanelProps,
        documentLibraryPanelProps,
        documentEditorPanelProps,
        synthesisHubPanelProps,
        videotecaPanelProps,
        literaryArchivePanelProps,
        postItPanelProps,
        imageGenerationPanelProps,
        spotifyPanelProps,
        serpApiPanelProps,
        podcastPanelProps,
        openStreetMapPanelProps,
        apiKeys: appState.apiKeys,
        deepDiveResources,
        onOpenDeepDive,
        onCloseDeepDive,
        getActiveApiKey,
    };
};

export default useNeuralAssistant;