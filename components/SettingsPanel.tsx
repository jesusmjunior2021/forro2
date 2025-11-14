import React, { useState, useEffect } from 'react';
import { AssistantSettings, Personality, ResponseMode, PromptCartridge, ApiKey, Theme } from '../types';
import PromptCartridges from './PromptCartridges';
import ApiKeyManager from './ApiKeyManager';

interface SettingsPanelProps {
  settings: AssistantSettings;
  onSettingsChange: (settings: AssistantSettings) => void;
  onReplicateApiKeyChange: (key: string) => void;
  replicateApiStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onSpotifyTokenChange: (token: string) => void;
  spotifyTokenStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onSerpApiKeyChange: (token: string) => void;
  serpApiStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onTomTomApiKeyChange: (key: string) => void;
  onOpenAboutModal: () => void;
  isOpen: boolean;
  onClose: () => void;
  promptCartridges: PromptCartridge[];
  activeCartridgeId: string | null;
  onAddPromptCartridge: (cartridge: { title: string; prompt: string }) => void;
  onDeletePromptCartridge: (id: string) => void;
  onSetActivePromptCartridge: (id: string | null) => void;
  apiKeys: ApiKey[];
  activeApiKeyId: string | null;
  onAddApiKey: (key: { name: string; value: string }) => void;
  onDeleteApiKey: (id: string) => void;
  onSetActiveApiKey: (id: string) => void;
}

const ControlGroup: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
        <h4 className="font-bold text-gray-200">{title}</h4>
        <p className="text-xs text-gray-500 mb-4">{description}</p>
        {children}
    </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }> = 
({ label, value, min, max, step, unit, onChange }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-400">{label}</label>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-md bg-gray-900 border border-teal-500/50 text-teal-300">
                {unit === '%' ? `${(value * 100).toFixed(0)}${unit}` : `${value.toFixed(1)}${unit}`}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const PersonalityRadar: React.FC<{ selected: Personality; onSelect: (p: Personality) => void; }> = ({ selected, onSelect }) => {
    const personalities: { id: Personality; label: string; color: string; position: { top: string; left: string; } }[] = [
        { id: 'choleric', label: 'Colérico', color: 'border-red-500', position: { top: '15%', left: '50%' } },
        { id: 'sanguine', label: 'Sanguíneo', color: 'border-yellow-500', position: { top: '50%', left: '85%' } },
        { id: 'phlegmatic', label: 'Fleumático', color: 'border-blue-500', position: { top: '85%', left: '50%' } },
        { id: 'melancholic', label: 'Melancólico', color: 'border-cyan-500', position: { top: '50%', left: '15%' } },
    ];

    return (
        <div className="relative w-48 h-48 mx-auto my-4">
            {/* Dashed Circle */}
            <div className="absolute top-1/2 left-1/2 w-[70%] h-[70%] border-2 border-dashed border-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            {/* Lines */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-gray-700"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-gray-700"></div>

            {/* Center Logo */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-blue-800">
                <i className="fas fa-brain text-blue-400 text-xl"></i>
            </div>
            
            {/* Personality Nodes */}
            {personalities.map(p => (
                <div key={p.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center" style={p.position}>
                    <button
                        onClick={() => onSelect(p.id)}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${p.color} ${selected === p.id ? 'bg-white' : 'bg-gray-800'}`}
                        title={p.label}
                    ></button>
                    <span className={`block text-xs mt-2 ${selected === p.id ? 'text-white font-bold' : 'text-gray-500'}`}>{p.label}</span>
                </div>
            ))}
        </div>
    );
};

const ThemeSelector: React.FC<{ selectedTheme: Theme; onSelectTheme: (theme: Theme) => void }> = ({ selectedTheme, onSelectTheme }) => {
    const themes: { id: Theme; color: string; label: string }[] = [
        { id: 'dark', color: '#3b82f6', label: 'Dark' },
        { id: 'cyan', color: '#0891b2', label: 'Ciano' },
        { id: 'yellow', color: '#f59e0b', label: 'Amarelo' },
        { id: 'magenta', color: '#c026d3', label: 'Magenta' },
        { id: 'gray', color: '#a1a1aa', label: 'Cinza' },
    ];

    return (
        <div className="flex justify-around items-center">
            {themes.map(theme => (
                <div key={theme.id} className="flex flex-col items-center">
                    <button
                        onClick={() => onSelectTheme(theme.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2 ring-offset-gray-900/50 ${selectedTheme === theme.id ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: theme.color }}
                        title={theme.label}
                    >
                        {selectedTheme === theme.id && <i className="fas fa-check text-white text-xs"></i>}
                    </button>
                    <span className={`mt-2 text-xs font-semibold ${selectedTheme === theme.id ? 'text-white' : 'text-gray-500'}`}>{theme.label}</span>
                </div>
            ))}
        </div>
    );
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    settings, onSettingsChange, onReplicateApiKeyChange, replicateApiStatus,
    onSpotifyTokenChange, spotifyTokenStatus, onSerpApiKeyChange, serpApiStatus,
    onTomTomApiKeyChange, onOpenAboutModal, isOpen, onClose,
    promptCartridges, activeCartridgeId, onAddPromptCartridge, onDeletePromptCartridge, onSetActivePromptCartridge,
    apiKeys, activeApiKeyId, onAddApiKey, onDeleteApiKey, onSetActiveApiKey
}) => {
    const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
    const [replicateKey, setReplicateKey] = useState(settings.replicateApiKey || '');
    const [spotifyToken, setSpotifyToken] = useState(settings.spotifyToken || '');
    const [serpApiKey, setSerpApiKey] = useState(settings.serpApiKey || '');
    const [tomTomKey, setTomTomKey] = useState(settings.tomTomApiKey || '');
    const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('pt-BR'));
            setBrowserVoices(voices);
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        setReplicateKey(settings.replicateApiKey || '');
    }, [settings.replicateApiKey]);
    
    useEffect(() => {
        setSpotifyToken(settings.spotifyToken || '');
    }, [settings.spotifyToken]);

    useEffect(() => {
        setSerpApiKey(settings.serpApiKey || '');
    }, [settings.serpApiKey]);

    useEffect(() => {
        setTomTomKey(settings.tomTomApiKey || '');
    }, [settings.tomTomApiKey]);

    const geminiVoices = [
        { name: 'Kore', label: 'Kore (Feminino)' },
        { name: 'Charon', label: 'Charon (Feminino)' },
        { name: 'Zephyr', label: 'Zephyr (Masculino)' },
        { name: 'Puck', label: 'Puck (Masculino)' },
        { name: 'Fenrir', label: 'Fenrir (Masculino)' },
    ];

    const handleSettingChange = <K extends keyof AssistantSettings>(key: K, value: AssistantSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const ApiStatusIndicator: React.FC<{ status: 'idle' | 'checking' | 'valid' | 'invalid' }> = ({ status }) => {
        const statusConfig = {
            idle: { text: 'Não configurada', color: 'bg-gray-500' },
            checking: { text: 'Verificando...', color: 'bg-yellow-500 animate-pulse' },
            valid: { text: 'Válida', color: 'bg-green-500' },
            invalid: { text: 'Inválida', color: 'bg-red-500' },
        };
        const { text, color } = statusConfig[status];

        return (
            <div className="flex items-center space-x-2 mt-2">
                <span className={`w-3 h-3 rounded-full ${color}`}></span>
                <span className="text-sm font-medium text-gray-400">{text}</span>
            </div>
        );
    };

    return (
        <>
            <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
                <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                        <i className="fas fa-sliders-h mr-3"></i>
                        Configurações
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </header>
                <div className="flex-1 space-y-4 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    
                    <ControlGroup title="API de Conversação (Google)" description="Gerencie suas chaves de API do Google AI Studio.">
                        <button 
                            onClick={() => setIsApiKeyManagerOpen(true)}
                            className="w-full flex items-center justify-center text-sm bg-blue-700/80 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition-colors"
                        >
                            <i className="fas fa-key mr-2"></i> Gerenciar Chaves de API
                        </button>
                    </ControlGroup>
                    
                    <ControlGroup title="API de Mapas (TomTom)" description="Insira sua chave para habilitar visualizações de mapas e tráfego.">
                        <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                placeholder="Cole sua chave da TomTom API"
                                value={tomTomKey}
                                onChange={(e) => setTomTomKey(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => onTomTomApiKeyChange(tomTomKey)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </ControlGroup>
                    
                    <ControlGroup title="API de Pesquisa (SERP API)" description="Insira sua chave para habilitar a pesquisa profunda.">
                        <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                placeholder="Cole sua chave da SERP API"
                                value={serpApiKey}
                                onChange={(e) => setSerpApiKey(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => onSerpApiKeyChange(serpApiKey)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                        <ApiStatusIndicator status={serpApiStatus} />
                         <div className="text-xs text-gray-500 mt-2">
                            <p>Requisições usadas: {settings.serpApiRequestCount} / 250 (free tier). Visite o{' '}
                            <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                 Dashboard
                            </a>.</p>
                        </div>
                    </ControlGroup>

                    <ControlGroup title="API de Imagem (Replicate)" description="Insira sua chave de API do Replicate para gerar e editar imagens.">
                        <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                placeholder="Cole sua chave r8_..."
                                value={replicateKey}
                                onChange={(e) => setReplicateKey(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => onReplicateApiKeyChange(replicateKey)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                        <ApiStatusIndicator status={replicateApiStatus} />
                    </ControlGroup>

                    <ControlGroup title="API de Música (Spotify)" description="Cole um Token de Acesso OAuth do Spotify para habilitar a integração.">
                        <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                placeholder="Cole seu token de acesso aqui"
                                value={spotifyToken}
                                onChange={(e) => setSpotifyToken(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => onSpotifyTokenChange(spotifyToken)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                        <ApiStatusIndicator status={spotifyTokenStatus} />
                        <p className="text-xs text-gray-500 mt-2">
                            Gere um token temporário no{' '}
                            <a href="https://developer.spotify.com/console/get-current-user-top-artists-and-tracks/?time_range=long_term&limit=5" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                Console do Spotify
                            </a> (marque 'user-top-read', 'playlist-modify-private' e 'playlist-modify-public').
                        </p>
                    </ControlGroup>

                    <ControlGroup title="Tema da Aplicação" description="Personalize a aparência da interface.">
                        <ThemeSelector 
                            selectedTheme={settings.theme} 
                            onSelectTheme={theme => handleSettingChange('theme', theme)} 
                        />
                    </ControlGroup>

                     <ControlGroup title="Áudio" description="Ajuste o volume e a velocidade da narração de texto.">
                        <div className="space-y-4">
                            <Slider 
                                label="Volume Geral" 
                                value={settings.volume} 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                unit="%" 
                                onChange={v => handleSettingChange('volume', v)} 
                            />
                            <Slider 
                                label="Velocidade da Fala" 
                                value={settings.speechRate} 
                                min={0.5} 
                                max={2} 
                                step={0.1} 
                                unit="x" 
                                onChange={v => handleSettingChange('speechRate', v)} 
                            />
                        </div>
                    </ControlGroup>

                     <ControlGroup title="Seleção de Voz (Gemini TTS)" description="Voz da IA para conversas ao vivo. Otimizada para baixa latência.">
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-user-astronaut text-gray-400"></i>
                            <select 
                                value={settings.selectedVoice} 
                                onChange={e => handleSettingChange('selectedVoice', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {geminiVoices.map(voice => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </ControlGroup>

                    <ControlGroup title="Seleção de Voz (Navegador TTS)" description="Voz da IA para leitura de textos (modo chat). Alta qualidade.">
                        <div className="flex items-center space-x-2">
                            <i className="fas fa-desktop text-gray-400"></i>
                            <select
                                value={settings.selectedBrowserVoice}
                                onChange={e => handleSettingChange('selectedBrowserVoice', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Padrão do Navegador</option>
                                {browserVoices.map(voice => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </ControlGroup>
                    
                    <ControlGroup title="Modo de Humor" description="Ative para que a IA adote uma personalidade ácida e conte piadas.">
                        <label htmlFor="sarcastic-humor-toggle" className="flex items-center justify-between cursor-pointer">
                            <span className="font-semibold text-gray-300">Ativar Humor Sarcástico</span>
                             <div className="relative">
                                <input 
                                    type="checkbox" 
                                    id="sarcastic-humor-toggle" 
                                    className="sr-only" 
                                    checked={settings.sarcasticHumorEnabled} 
                                    onChange={e => handleSettingChange('sarcasticHumorEnabled', e.target.checked)} 
                                />
                                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings.sarcasticHumorEnabled ? 'transform translate-x-full bg-yellow-400' : ''}`}></div>
                            </div>
                        </label>
                    </ControlGroup>

                    <ControlGroup title="Cartuchos de Prompt" description="Selecione um cartucho para modificar a personalidade e o comportamento da IA.">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 -m-2">
                            <PromptCartridges
                                cartridges={promptCartridges}
                                activeCartridgeId={activeCartridgeId}
                                onSelect={onSetActivePromptCartridge}
                                onAdd={onAddPromptCartridge}
                                onDelete={onDeletePromptCartridge}
                            />
                        </div>
                    </ControlGroup>

                    <ControlGroup title="Radar de Personalidade" description="Defina o arquétipo comportamental da IA.">
                        <PersonalityRadar 
                            selected={settings.personality} 
                            onSelect={(p) => handleSettingChange('personality', p)} 
                        />
                    </ControlGroup>

                    <ControlGroup title="Flow (Ritmo)" description="Controle o ritmo da fala da IA para uma conversa mais natural.">
                        <div className="space-y-4">
                            <Slider label="Pausa Pré-Resposta" value={settings.preResponsePause} min={0} max={2000} step={50} unit="ms" onChange={v => handleSettingChange('preResponsePause', v)} />
                            <Slider label="Pausa Pós-Resposta" value={settings.postResponsePause} min={0} max={2000} step={50} unit="ms" onChange={v => handleSettingChange('postResponsePause', v)} />
                        </div>
                    </ControlGroup>
                    
                    <ControlGroup title="Jogos da Imitação" description="Defina o quanto a IA deve espelhar seu estilo de comunicação.">
                        <Slider label="Nível de Espelhamento" value={settings.mimicryLevel} min={0} max={100} step={1} unit="%" onChange={v => handleSettingChange('mimicryLevel', v)} />
                    </ControlGroup>

                    <ControlGroup title="Teoria dos Jogos" description="Defina o nível de proatividade e estratégia da IA na condução da conversa.">
                        <Slider label="Nível de Estratégia" value={settings.strategyLevel} min={0} max={100} step={1} unit="%" onChange={v => handleSettingChange('strategyLevel', v)} />
                    </ControlGroup>

                    <ControlGroup title="Parâmetros Técnicos" description="Ajustes avançados para o modelo da IA. Use com cuidado.">
                        <div className="space-y-4">
                            <Slider label="Temperatura (Criatividade)" value={settings.temperature} min={0} max={1} step={0.1} unit="" onChange={v => handleSettingChange('temperature', v)} />
                            <Slider label="Limite de Tokens" value={settings.tokenLimit} min={512} max={8192} step={256} unit="" onChange={v => handleSettingChange('tokenLimit', v)} />
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Modo de Resposta</label>
                                <select 
                                    value={settings.responseMode} 
                                    onChange={e => handleSettingChange('responseMode', e.target.value as ResponseMode)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option>Texto Plano</option>
                                </select>
                            </div>
                        </div>
                    </ControlGroup>

                    <ControlGroup title="Sobre" description="Informações sobre a aplicação e o desenvolvedor.">
                        <button 
                            onClick={onOpenAboutModal}
                            className="w-full flex items-center justify-center text-sm bg-gray-700/80 hover:bg-gray-700 text-white py-2 px-3 rounded-md transition-colors"
                        >
                            <i className="fas fa-info-circle mr-2"></i> Ver Informações
                        </button>
                    </ControlGroup>
                </div>
            </div>
            <ApiKeyManager
                isOpen={isApiKeyManagerOpen}
                onClose={() => setIsApiKeyManagerOpen(false)}
                apiKeys={apiKeys}
                activeApiKeyId={activeApiKeyId}
                onAddApiKey={onAddApiKey}
                onDeleteApiKey={onDeleteApiKey}
                onSetActiveApiKey={onSetActiveApiKey}
            />
        </>
    );
};

export default SettingsPanel;