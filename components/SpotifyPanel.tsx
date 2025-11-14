import React from 'react';
import { SpotifyState } from '../types';

interface SpotifyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: SpotifyState;
  tokenStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onFetchTopTracks: () => void;
  onCreatePlaylist: () => void;
}

const SpotifyPanel: React.FC<SpotifyPanelProps> = ({
  isOpen,
  onClose,
  state,
  tokenStatus,
  onFetchTopTracks,
  onCreatePlaylist
}) => {
  const { isLoading, error, topTracks, createdPlaylistId, statusMessage } = state;

  const renderContent = () => {
    if (tokenStatus !== 'valid') {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full text-gray-400 p-4">
          <i className="fab fa-spotify text-5xl text-green-500 mb-4"></i>
          <h2 className="text-xl font-bold text-white">Conecte seu Spotify</h2>
          <p className="mt-2 max-w-sm">
            Para usar o Hub de Música, por favor, adicione um Token de Acesso válido nas Configurações.
          </p>
        </div>
      );
    }
    
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
            {statusMessage && <p className="text-sm text-gray-400 mb-2">{statusMessage}</p>}
            {error && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}
        </div>

        {!createdPlaylistId && (
            <button
                onClick={onFetchTopTracks}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500"
            >
                {isLoading && statusMessage.includes('Buscando') 
                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Buscando Músicas...</> 
                    : <><i className="fas fa-music mr-2"></i>Buscar meu Top 5 Músicas</>
                }
            </button>
        )}
        
        {topTracks.length > 0 && (
          <div className="space-y-2">
            {topTracks.map((track, index) => (
              <div key={track.id} className="bg-gray-700/50 p-2 rounded-lg flex items-center space-x-3">
                <span className="font-bold text-gray-400 text-lg w-5 text-center">{index + 1}</span>
                <img src={track.album.images[0]?.url} alt={track.album.name} className="w-12 h-12 rounded-md"/>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-white truncate">{track.name}</p>
                  <p className="text-sm text-gray-400 truncate">{track.artists.map((a: any) => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {topTracks.length > 0 && !createdPlaylistId && (
            <button
                onClick={onCreatePlaylist}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500"
            >
                 {isLoading && statusMessage.includes('Criando') 
                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Criando Playlist...</> 
                    : <><i className="fas fa-plus mr-2"></i>Criar Playlist com essas Músicas</>
                }
            </button>
        )}

        {createdPlaylistId && (
            <div className="mt-4">
                 <iframe
                    title="Spotify Embed: Recommendation Playlist"
                    src={`https://open.spotify.com/embed/playlist/${createdPlaylistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                />
            </div>
        )}

      </div>
    );
  };

  return (
    <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fab fa-spotify mr-3 text-green-500"></i>
          Hub de Música
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default SpotifyPanel;