import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PodcastState, PodcastShow, PodcastEpisode } from '../types';

interface PodcastPanelProps {
  isOpen: boolean;
  onClose: () => void;
  podcastState: PodcastState;
  onSearchAndAddPodcast: (query: string) => void;
  onAddPodcastByUrl: (url: string) => void;
  onPlayEpisode: (showId: string, episodeId: string) => void;
  onPlayerAction: (action: 'play' | 'pause' | 'stop') => void;
  onUpdateEpisodeState: (episodeId: string, state: { playbackPosition?: number, listened?: boolean }) => void;
  onAddToQueue: (episodeId: string) => void;
  onPlayNextInQueue: () => void;
}

const PodcastPlayer: React.FC<Omit<PodcastPanelProps, 'isOpen' | 'onClose' | 'onSearchAndAddPodcast' | 'onAddPodcastByUrl'>> = (props) => {
    const { podcastState, onPlayerAction, onUpdateEpisodeState, onPlayNextInQueue } = props;
    const { nowPlaying, playerStatus, shows, episodes, episodeStates } = podcastState;
    
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const nowPlayingEpisode = useMemo(() => {
        if (!nowPlaying) return null;
        const showEpisodes = episodes[nowPlaying.showId];
        return showEpisodes?.find(e => e.id === nowPlaying.episodeId) || null;
    }, [nowPlaying, episodes]);

    const nowPlayingShow = useMemo(() => {
        if (!nowPlaying) return null;
        return shows.find(s => s.id === nowPlaying.showId) || null;
    }, [nowPlaying, shows]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !nowPlayingEpisode) return;
        
        const handleTimeUpdate = () => {
            if (!audio.seeking) {
                setCurrentTime(audio.currentTime);
                onUpdateEpisodeState(nowPlayingEpisode.id, { playbackPosition: audio.currentTime });
            }
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => {
            onUpdateEpisodeState(nowPlayingEpisode.id, { listened: true });
            onPlayNextInQueue();
        };

        if (audio.src !== nowPlayingEpisode.audioUrl) {
            audio.src = nowPlayingEpisode.audioUrl;
            const savedPosition = episodeStates[nowPlayingEpisode.id]?.playbackPosition || 0;
            
            const handleCanPlay = () => {
                if (audio.readyState >= 2) { 
                    audio.currentTime = savedPosition;
                    if (playerStatus === 'playing') {
                        audio.play().catch(e => console.error("Audio play failed:", e));
                    }
                }
            };
            audio.addEventListener('canplay', handleCanPlay, { once: true });
        } else {
             if (playerStatus === 'playing' && audio.paused) {
                audio.play().catch(e => console.error("Audio play failed:", e));
            } else if (playerStatus === 'paused' && !audio.paused) {
                audio.pause();
            }
        }

        if (playerStatus === 'stopped') {
            audio.pause();
            audio.currentTime = 0;
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [nowPlayingEpisode, playerStatus, onUpdateEpisodeState, episodeStates, onPlayNextInQueue]);

    if (!nowPlaying || !nowPlayingEpisode || !nowPlayingShow) {
        return (
            <div className="h-24 bg-gray-900/50 flex items-center justify-center text-sm text-gray-500 border-t border-gray-700/50">
                Selecione um episódio para tocar
            </div>
        );
    }
    
    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(audioRef.current) {
            const newTime = Number(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    return (
        <div className="h-24 bg-gray-900/80 backdrop-blur-sm p-3 flex items-center space-x-4 border-t border-gray-700/50">
            <audio ref={audioRef} />
            <img src={nowPlayingEpisode.artworkUrl || nowPlayingShow.artworkUrl} alt={nowPlayingShow.title} className="w-16 h-16 rounded-md flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <p className="font-bold text-white truncate">{nowPlayingEpisode.title}</p>
                <p className="text-xs text-gray-400 truncate">{nowPlayingShow.title}</p>
                 <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-400 w-10 text-center">{formatTime(currentTime)}</span>
                    <input type="range" min="0" max={duration || 1} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    <span className="text-xs text-gray-400 w-10 text-center">{formatTime(duration)}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => onPlayerAction(playerStatus === 'playing' ? 'pause' : 'play')} className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-xl">
                    <i className={`fas ${playerStatus === 'playing' ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                 <button onClick={() => onPlayerAction('stop')} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center" title="Parar">
                    <i className="fas fa-stop"></i>
                </button>
            </div>
        </div>
    );
};

export const PodcastPanel: React.FC<PodcastPanelProps> = (props) => {
    const { isOpen, onClose, podcastState, onSearchAndAddPodcast } = props;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && !podcastState.isLoading) {
            onSearchAndAddPodcast(searchQuery);
        }
    };

    const selectedShow = useMemo(() => {
        return podcastState.shows.find(s => s.id === selectedShowId) || null;
    }, [selectedShowId, podcastState.shows]);

    const selectedShowEpisodes = useMemo(() => {
        if (!selectedShowId) return [];
        return podcastState.episodes[selectedShowId] || [];
    }, [selectedShowId, podcastState.episodes]);

    const ShowGrid = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {podcastState.shows.map(show => (
                <div key={show.id} onClick={() => setSelectedShowId(show.id)} className="bg-gray-800/60 p-3 rounded-lg flex flex-col items-center text-center cursor-pointer transition-transform duration-200 hover:-translate-y-1">
                    <img src={show.artworkUrl} alt={show.title} className="w-full aspect-square rounded-md mb-2 shadow-lg"/>
                    <p className="font-bold text-sm text-gray-100 line-clamp-2">{show.title}</p>
                </div>
            ))}
        </div>
    );
    
    const EpisodeList = () => {
        if (!selectedShow) return null;
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedShowId(null)} className="mb-4 text-sm text-gray-400 hover:text-white"><i className="fas fa-arrow-left mr-2"></i>Voltar para a Biblioteca</button>
                <div className="flex items-start space-x-4 mb-4">
                    <img src={selectedShow.artworkUrl} alt={selectedShow.title} className="w-32 h-32 rounded-lg shadow-lg flex-shrink-0" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedShow.title}</h2>
                        <h3 className="text-md font-semibold text-gray-400">{selectedShow.author}</h3>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-3">{selectedShow.description}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {selectedShowEpisodes.map(ep => {
                        const state = props.podcastState.episodeStates[ep.id];
                        const progress = ep.duration > 0 ? ((state?.playbackPosition || 0) / ep.duration) * 100 : 0;
                        return (
                            <div key={ep.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center space-x-3 relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500" style={{width: `${progress}%`}}></div>
                                <button onClick={() => props.onPlayEpisode(selectedShow.id, ep.id)} className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full text-white flex items-center justify-center shrink-0">
                                    <i className="fas fa-play"></i>
                                </button>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-white truncate">{ep.title}</p>
                                    <p className="text-xs text-gray-400">{new Date(ep.releaseDate).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => props.onAddToQueue(ep.id)} className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-600 shrink-0" title="Adicionar à fila">
                                    <i className="fas fa-plus"></i>
                                </button>
                                <button onClick={() => props.onUpdateEpisodeState(ep.id, { listened: !state?.listened })} className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-600 shrink-0" title={state?.listened ? "Marcar como não ouvido" : "Marcar como ouvido"}>
                                    <i className={`fas ${state?.listened ? 'fa-check-circle text-green-400' : 'fa-circle'}`}></i>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={`slate-panel w-full max-w-5xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center"><i className="fas fa-podcast mr-3"></i>Podcast Hub</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><i className="fas fa-times"></i></button>
            </header>

            <div className="p-4 border-b border-gray-700/50">
                <form onSubmit={handleSearch} className="flex space-x-2">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar e adicionar podcast com SERP API..." className="flex-grow bg-gray-900/80 border border-gray-600 rounded-md text-sm px-4 py-2" disabled={podcastState.isLoading} />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold rounded-md disabled:bg-gray-500" disabled={podcastState.isLoading || !searchQuery.trim()}>
                        {podcastState.isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    </button>
                </form>
                {podcastState.error && <p className="text-xs text-red-400 mt-2">{podcastState.error}</p>}
            </div>

            <main className="flex-1 overflow-y-auto p-4">
                {selectedShowId ? <EpisodeList /> : podcastState.shows.length > 0 ? <ShowGrid /> : (
                     <div className="text-center text-gray-500 pt-16">
                        <i className="fas fa-box-open text-4xl mb-4"></i>
                        <p>Sua biblioteca de podcasts está vazia.</p>
                        <p className="text-xs">Use a busca para encontrar e adicionar novos shows.</p>
                    </div>
                )}
            </main>

            <footer className="shrink-0">
                <PodcastPlayer {...props} />
            </footer>
        </div>
    );
};

export default PodcastPanel;