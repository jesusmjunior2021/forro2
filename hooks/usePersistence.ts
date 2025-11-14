import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { AppState, AssistantSettings, PersistenceMode } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DB_FILE_NAME = 'neural_assistant_db.json';

const getDefaultAppState = (): AppState => ({
  transcriptions: [],
  settings: {
    personality: 'phlegmatic',
    selectedVoice: 'Kore',
    selectedBrowserVoice: '',
    speechRate: 1.0,
    preResponsePause: 250,
    postResponsePause: 500,
    mimicryLevel: 75,
    strategyLevel: 85,
    sarcasticHumorEnabled: false,
    temperature: 0.7,
    tokenLimit: 4096,
    responseMode: 'Texto Plano',
    formality: 'neutral',
    volume: 0.7,
    activeApiKeyId: null,
    replicateApiKey: null,
    spotifyToken: null,
    serpApiKey: null,
    serpApiRequestCount: 0,
    tomTomApiKey: null,
    theme: 'dark',
  },
  chatHistory: [],
  userProfileData: null,
  calendarEvents: [],
  knowledgeTree: {},
  informationCards: [],
  documents: [],
  videos: [],
  archivedLinks: [],
  apiKeys: [],
  synthesisHub: {
    isOpen: false,
    isLoading: false,
    selectedIds: [],
    error: null,
    result: null,
  },
  postItNotes: [],
  podcastState: {
    shows: [],
    episodes: {},
    episodeStates: {},
    isLoading: false,
    error: null,
    nowPlaying: null,
    playerStatus: 'stopped',
    playbackQueue: [],
  },
  creativeSlate: [],
  personalityFrameworkData: {
    personality: [0.5, 0.5, 0.5, 0.5, 0.5],
    content: [0.5, 0.5, 0.5, 0.5, 0.5],
    interactivity: [0.5, 0.5, 0.5, 0.5, 0.5],
  },
  magazine: [],
  spreadsheetState: {
    fileName: null,
    originalData: [],
    processedData: [],
    lastCommand: null,
    // Fix: Rename 'analysisResult' to 'assistantOutput' to match the 'SpreadsheetState' type definition.
    assistantOutput: null,
    commandHistory: [],
    versionHistory: [],
  },
  pollinationsState: {
    isLoading: false,
    error: null,
    generations: [],
    cooldownUntil: null,
  },
});


export const usePersistence = (
  setPersistenceMode: Dispatch<SetStateAction<PersistenceMode>>
): [
  AppState, 
  Dispatch<SetStateAction<AppState>>,
  boolean,
  string,
  () => Promise<boolean>
] => {
  const [appState, setAppState] = useState<AppState>(getDefaultAppState);
  const [isDbActive, setIsDbActive] = useState(false);
  const [dbStatus, setDbStatus] = useState('Inativo');
  const dbFileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const saveState = useCallback(async (state: AppState) => {
    if (!dbFileHandleRef.current) return;

    setDbStatus('Salvando...');
    try {
      const writable = await dbFileHandleRef.current.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      setDbStatus('Salvo');
    } catch (error) {
      console.error('Falha ao salvar o estado:', error);
      setDbStatus('Erro ao Salvar');
      setIsDbActive(false);
      dbFileHandleRef.current = null;
    }
  }, []);

  const debouncedSave = useCallback((state: AppState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveState(state);
    }, 1000); // Salva 1 segundo após la última alteração
  }, [saveState]);

  useEffect(() => {
    if (isDbActive) {
      debouncedSave(appState);
    }
  }, [appState, isDbActive, debouncedSave]);

  const loadState = useCallback(async () => {
    if (!dbFileHandleRef.current) return;
    setDbStatus('Carregando...');
    try {
      const file = await dbFileHandleRef.current.getFile();
      const content = await file.text();
      const loadedState = JSON.parse(content);
      const defaultState = getDefaultAppState();

      // Perform a more robust deep merge
      const mergedState: AppState = {
        ...defaultState,
        ...loadedState,
        // Deep merge for nested objects to ensure new settings are not lost
        settings: {
          ...defaultState.settings,
          ...(loadedState.settings || {}),
        },
        synthesisHub: {
          ...defaultState.synthesisHub,
          ...(loadedState.synthesisHub || {}),
        },
        personalityFrameworkData: {
            ...defaultState.personalityFrameworkData,
            ...(loadedState.personalityFrameworkData || {}),
        },
        spreadsheetState: {
          ...defaultState.spreadsheetState,
          ...(loadedState.spreadsheetState || {}),
          versionHistory: loadedState.spreadsheetState?.versionHistory || [],
        },
        pollinationsState: {
          ...defaultState.pollinationsState,
          ...(loadedState.pollinationsState || {}),
          generations: loadedState.pollinationsState?.generations || [],
        },
        // Ensure array properties are always arrays, even if saved as null/undefined from old saves
        transcriptions: loadedState.transcriptions || [],
        chatHistory: loadedState.chatHistory || [],
        calendarEvents: loadedState.calendarEvents || [],
        informationCards: loadedState.informationCards || [],
        documents: loadedState.documents || [],
        videos: loadedState.videos || [],
        archivedLinks: loadedState.archivedLinks || [],
        apiKeys: loadedState.apiKeys || [],
        postItNotes: loadedState.postItNotes || [],
        creativeSlate: loadedState.creativeSlate || [],
        podcastState: {
          ...defaultState.podcastState,
          ...(loadedState.podcastState || {}),
        },
        magazine: loadedState.magazine || [],
      };
      
      setAppState(mergedState);
      setDbStatus('Carregado');
    } catch (error) {
      console.error('Falha ao carregar estado, usando padrão:', error);
      setAppState(getDefaultAppState());
      setDbStatus('Erro ao Carregar');
    }
  }, []);

  const initializePersistence = useCallback(async (): Promise<boolean> => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const permissionStatus = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (permissionStatus !== 'granted') {
        alert('Permissão para acessar o diretório negada.');
        setDbStatus('Permissão Negada');
        return false;
      }

      const fileHandle = await dirHandle.getFileHandle(DB_FILE_NAME, { create: true });
      dbFileHandleRef.current = fileHandle;
      setIsDbActive(true);
      await loadState();
      setPersistenceMode('local');
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
          console.log("Seleção de diretório cancelada pelo usuário.");
          setDbStatus('Cancelado');
      } else {
          console.error("Erro ao inicializar a persistência:", error);
          alert("Não foi possível inicializar a memória permanente. Verifique as permissões do navegador.");
          setDbStatus('Erro de Inicialização');
      }
      setIsDbActive(false);
      return false;
    }
  }, [loadState, setPersistenceMode]);

  return [appState, setAppState, isDbActive, dbStatus, initializePersistence];
};