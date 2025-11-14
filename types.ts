import React from 'react';

// Fix: Add global declarations for libraries loaded from CDN and for Web Speech API.
declare const L: any;
declare const pdfjsLib: any;
declare global {
  interface Window {
    maplibregl: any;
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    webkitAudioContext: typeof AudioContext;
  }
}

// Fix: Exporting SpeechRecognition-related interfaces to resolve type errors in other modules.
export interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

// This is a simplified version, but it should be sufficient to resolve TS errors.
export interface SpeechRecognition extends EventTarget {
    grammars: any;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};


// Fix: Define all necessary types used across the application.
export enum ConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SPEAKING = 'SPEAKING',
  THINKING = 'THINKING',
  ERROR = 'ERROR',
  LOADING_FILE = 'LOADING_FILE',
  PAUSED = 'PAUSED',
  SAVING = 'SAVING',
  DISCONNECTED = 'DISCONNECTED',
  SILENT = 'SILENT'
}

export interface GenaiBlob {
    data: string;
    mimeType: string;
}

export interface LiveSession {
    close: () => void;
    sendRealtimeInput: (input: { text?: string; media?: GenaiBlob }) => void;
    sendToolResponse: (response: any) => void;
}

export type Personality = 'choleric' | 'sanguine' | 'phlegmatic' | 'melancholic';
export type ResponseMode = 'Texto Plano';
export type InteractionMode = 'live' | 'chat' | 'cocreator';
export type SearchContext = 'web' | 'drive' | 'videos' | 'jurisprudence' | 'history' | 'documents' | 'knowledge' | 'serpApi';
export type Theme = 'dark' | 'cyan' | 'yellow' | 'magenta' | 'gray';

export interface AssistantSettings {
  personality: Personality;
  selectedVoice: string;
  selectedBrowserVoice: string | null;
  speechRate: number;
  preResponsePause: number;
  postResponsePause: number;
  mimicryLevel: number;
  strategyLevel: number;
  sarcasticHumorEnabled: boolean;
  temperature: number;
  tokenLimit: number;
  responseMode: ResponseMode;
  formality: string;
  volume: number;
  activeApiKeyId: string | null;
  replicateApiKey: string | null;
  spotifyToken: string | null;
  serpApiKey: string | null;
  serpApiRequestCount: number;
  tomTomApiKey: string | null;
  theme: Theme;
}

export interface Product {
  Codigo: number;
  Nome: string;
  Categoria?: string;
  Marca?: string;
  ValorPrecoFixado?: number;
  PrecoCusto?: number;
  EstoqueUnidade?: string;
}

export interface Transcription {
  id: string;
  speaker: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  isFinal?: boolean;
  resourceLinks?: ResourceLink[];
  localContextLinks?: LocalContextLink[];
  toolCall?: { name: string; args: any };
  image?: { name: string; data: string };
  reportContent?: ReportContent;
  structuredContent?: SerpMagazineResult;
}

export interface ReportContent {
    title: string;
    imageUrl?: string;
    summary: string;
    sections: Array<{
        heading: string;
        content: string;
        videoUrl?: string;
        podcastUrl?: string;
        imageUrl?: string;
    }>;
    tags?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  timestamp: string;
  transcriptions: Transcription[];
}

export interface UserProfile {
  summary: string;
  keyTopics: string[];
  nextSteps: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  status: 'pending' | 'completed';
  prerequisites: string[];
  executionSteps: string[];
}

export interface Reminder {
  id: string;
  eventId: string;
  eventTitle: string;
  eventTime: string;
  remindAt: number;
}

export interface KnowledgeTree {
  [topicId: string]: KnowledgeTopic;
}

export interface KnowledgeTopic {
  id: string;
  title: string;
  resources: KnowledgeResource[];
}

// Fix: Added 'pdf' and 'image' to the ResourceCategory type to allow for proper categorization and prevent type errors.
export type ResourceCategory = 'video' | 'podcast' | 'audio' | 'book' | 'article' | 'web-search' | 'generic' | 'report' | 'movie' | 'series' | 'audiobook' | 'academic' | 'shopping' | 'pdf' | 'image';

export interface KnowledgeResource {
  id: string;
  title: string;
  url: string;
  type: ResourceCategory;
  source: string;
}

export interface InformationCard {
  id: string;
  type: 'video' | 'pdf' | 'link' | 'link-collection' | 'image';
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
  links?: { title: string; url: string }[];
}

export interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
  versionHistory: DocumentVersion[];
}

export interface DocumentVersion {
    id: string;
    content: string;
    savedAt: string;
}

export interface Video {
  id: string;
  videoUrl: string;
  title: string;
  thumbnailUrl: string;
  summary: string;
  tags: string[];
  isProcessing: boolean;
  channel?: string;
}

export interface ArchivedLink {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
  prefillUrl?: string;
}

export interface SynthesisState {
  isOpen: boolean;
  isLoading: boolean;
  selectedIds: string[];
  error: string | null;
  result: {
      keyThemes: string[];
      novelConnections: string;
      contradictions: string;
      actionableNextSteps: string[];
  } | null;
}

export interface PostItNote {
  id: string;
  content: string;
  color: string;
  tags: string[];
  createdAt: string;
}

export interface SlateCard {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

export interface PersonalityFrameworkData {
    personality: number[];
    content: number[];
    interactivity: number[];
}

export interface Cell {
  value: string;
  style?: React.CSSProperties;
}

export interface SpreadsheetCommand {
    id: string;
    command: string; // The user's spoken command
    toolCalls: { name: string, args: any }[]; // The function calls the AI made
    status: 'success' | 'error';
    errorMessage?: string;
    feedback?: 'liked' | 'disliked';
}

export interface SpreadsheetVersion {
  data: Cell[][];
  commandId: string;
  timestamp: string;
}

export interface Anomaly {
    row: number; // The 1-based row number for user display
    column: string;
    issue: string;
    value: string;
    suggestion?: string;
}

export interface SpreadsheetState {
  fileName: string | null;
  originalData: string[][];
  processedData: Cell[][];
  lastCommand: string | null;
  assistantOutput: string | Anomaly[] | null;
  commandHistory: SpreadsheetCommand[];
  versionHistory: SpreadsheetVersion[];
}

export interface PollinationImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

export interface PollinationsState {
  isLoading: boolean;
  error: string | null;
  generations: PollinationImage[];
  cooldownUntil: number | null;
}

export interface AppState {
  transcriptions: Transcription[];
  settings: AssistantSettings;
  chatHistory: ChatSession[];
  userProfileData: UserProfile | null;
  calendarEvents: CalendarEvent[];
  knowledgeTree: KnowledgeTree;
  informationCards: InformationCard[];
  documents: Document[];
  videos: Video[];
  archivedLinks: ArchivedLink[];
  apiKeys: ApiKey[];
  synthesisHub: SynthesisState;
  postItNotes: PostItNote[];
  podcastState: PodcastState;
  creativeSlate: SlateCard[];
  personalityFrameworkData: PersonalityFrameworkData;
  magazine: Transcription[];
  spreadsheetState: SpreadsheetState;
  pollinationsState: PollinationsState;
}

export interface ApiKey {
  id: string;
  name: string;
  value: string;
}

export type PersistenceMode = 'local' | 'demo' | 'inactive';

export interface PromptCartridge {
  id: string;
  title: string;
  prompt: string;
  isRemovable?: boolean;
}

export interface TTSState {
  playingId: string | null;
  isPaused: boolean;
}

export type RecordingState = 'idle' | 'recording' | 'transcribing';

export interface ResourceLink {
  uri: string;
  title: string;
  summary?: string;
  thumbnailUrl?: string;
  tags?: string[];
  isLoading?: boolean;
  detailedSummary?: string;
}

export interface LocalContextLink {
  id: string;
  type: 'document' | 'chat' | 'knowledge';
  title: string;
  snippet: string;
}

export interface DynamicContext {
  id: string;
  icon: string;
  label: string;
}

export interface LiveDocument {
  id: string;
  name: string;
  status: LiveDocumentStatus;
  previewUrl: string;
  errorMessage?: string;
}

export type LiveDocumentStatus = 'pending' | 'processing' | 'done' | 'error';

export interface MapState {
  isOpen: boolean;
  center: [number, number];
  zoom: number;
  markers: { position: [number, number]; popupText: string }[];
  routes: { points: [number, number][]; color?: string; label?: string }[];
}

export interface DeepAnalysisState {
  isOpen: boolean;
  isLoading: boolean;
  progress: number;
  statusMessage: string;
  fileName: string | null;
  fileDataUrl: string | null;
  error: string | null;
  result: DeepAnalysisResult | null;
}

export interface DeepAnalysisResult {
    title: string;
    summary: string;
    extractedData: { key: string, value: string }[];
    suggestedActions: string[];
}

export interface GroundedSearchState {
  isLoading: boolean;
  error: string | null;
  result: {
      summary: string;
      sources: { title: string; uri: string }[];
  } | null;
}

export interface ProjectAssistantState {
  userGoal: string;
  userTech: string;
  userIdeas: string;
  generatedPlan: ProjectPlan | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectPlan {
    projectSummary: string;
    techStack: { category: string; recommendation: string; reason: string; }[];
    stepByStepPlan: string[];
    proactiveInsights: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    progress: {
        phase: 'orientation' | 'cocreation' | 'review';
        percentage: number;
    };
    attachedFiles: { name: string; type: 'pdf' | 'text'; summary: string; }[];
}

export interface MagazineResource {
    type: ResourceCategory;
    title: string;
    url: string;
    summary: string;
    source: string;
    thumbnailUrl?: string;
}
  
export interface MagazineTopic {
    topicNumber: number;
    title: string;
    summary: string;
    deepDiveResources: MagazineResource[];
}
  
export interface SerpMagazineResult {
    mainSummary: string;
    topics: MagazineTopic[];
}

export interface RssArticle {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    content: string;
    source: string;
}

export interface Contact {
    name: string;
    phone: string;
    whatsappLink: string;
}

export interface DataPlayerState {
    isOpen: boolean;
    isLoading: boolean;
    title: string;
    summary: string;
    keyMetrics: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
    chartData: {
        type: 'bar';
        title: string;
        labels: string[];
        datasets: { label: string; data: number[] }[];
    } | null;
    timeline: { date: string; event: string }[];
    pros: string[];
    cons: string[];
}

export interface ProactiveInsightState {
    isOpen: boolean;
    title: string;
    summary: string;
    url: string;
}

export interface ImageGeneration {
    id: string;
    prompt: string;
    imageUrl: string;
    aspectRatio: string;
    createdAt: string;
}
  
export interface ImageGenerationState {
    isLoading: boolean;
    error: string | null;
    generations: ImageGeneration[];
    mode: 'generate' | 'edit';
    imageToEdit: ImageGeneration | null;
}

export interface GoogleDriveFile {
    id: string;
    name: string;
    webViewLink: string;
    iconLink: string;
}

export interface SpotifyState {
    isLoading: boolean;
    error: string | null;
    topTracks: any[];
    createdPlaylistId: string | null;
    statusMessage: string;
}
  
export interface SerpCardResult {
    title: string;
    summary: string;
    resources: ResourceLink[];
}

export interface SerpApiState {
    isLoading: boolean;
    error: string | null;
    query: string;
    magazineResult: SerpMagazineResult | null;
    cardResult: SerpCardResult | null;
}

export interface PodcastShow {
    id: string;
    title: string;
    description: string;
    artworkUrl: string;
    rssUrl: string;
    author: string;
    categories: string[];
    isSubscribed: boolean;
}
  
export interface PodcastEpisode {
    id: string;
    showId: string;
    title: string;
    description: string;
    audioUrl: string;
    artworkUrl?: string;
    releaseDate: string;
    duration: number; // in seconds
}
  
export interface PodcastState {
    shows: PodcastShow[];
    episodes: Record<string, PodcastEpisode[]>; // showId -> episodes
    episodeStates: Record<string, { playbackPosition: number, listened: boolean }>; // episodeId -> state
    isLoading: boolean;
    error: string | null;
    nowPlaying: { showId: string; episodeId: string } | null;
    playerStatus: 'playing' | 'paused' | 'stopped';
    playbackQueue: string[]; // array of episodeIds
}

export type CeilingType = 'drywall' | 'pvc-liso';

// Fix: Add ScaffoldingCalculationResults interface to resolve type error.
export interface ScaffoldingCalculationResults {
    totalArea: number;
    frames: number;
    braces: number;
    platforms: number;
    baseJacks: number;
    guardRails: number;
}

export interface CalculationResults {
    area: number;
    panels: { count: number; description: string; };
    mainStructure: { count: number; description: string; };
    secondaryStructure?: { count: number; description: string; };
    finishingProfiles: { count: number; description: string; };
    hangers?: number;
    screws: number;
    corners: number;
}

export interface OptimizationResult {
    layout: 'A' | 'B';
    description: string;
    fullPanels: number;
    cutPanels: number;
    totalPanelsNoWaste: number;
    totalPanelsWithWaste: number;
    wastePercentage: number;
    schematic: {
        rows: number;
        cols: number;
        lastRowHeight?: number;
        lastColWidth?: number;
    };
}