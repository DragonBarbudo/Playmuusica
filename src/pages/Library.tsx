import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { jellyfinService } from '../services/jellyfin';
import { MusicCard } from '../components/player/MusicCard';
import type { JellyfinItem } from '../types/jellyfin';
import {
  Music,
  User,
  LogOut,
  Search,
  Disc,
  ListMusic,
  Sparkles,
  X,
} from 'lucide-react';

export const Library: React.FC = () => {
  const { user, hasActiveSubscription, logout } = useAuth();
  const { playQueue, addToQueue } = usePlayer();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<JellyfinItem[]>([]);
  const [tracks, setTracks] = useState<JellyfinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'albums' | 'tracks' | 'playlists'>('albums');
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(true);

  useEffect(() => {
    loadMusic();
  }, []);

  const loadMusic = async () => {
    setIsLoading(true);
    try {
      const [albumsData, tracksData] = await Promise.all([
        jellyfinService.getAlbums({ limit: 50 }),
        jellyfinService.getMusicLibrary({ limit: 100, sortBy: 'DateCreated', sortOrder: 'Descending' }),
      ]);

      setAlbums(albumsData.Items);
      setTracks(tracksData.Items);
    } catch (error) {
      console.error('Error loading music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePlayAlbum = async (album: JellyfinItem) => {
    try {
      const albumTracks = await jellyfinService.getMusicLibrary({
        limit: 1000,
      });

      // Filter tracks by album
      const tracks = albumTracks.Items.filter(item => item.AlbumId === album.Id);

      if (tracks.length > 0) {
        playQueue(tracks, 0);
      }
    } catch (error) {
      console.error('Error playing album:', error);
    }
  };

  const handlePlayTrack = (track: JellyfinItem) => {
    playQueue([track], 0);
  };

  const handleDownload = async (item: JellyfinItem) => {
    try {
      const streamUrl = jellyfinService.getStreamUrl(item.Id);
      const response = await fetch(streamUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.Artists?.[0] || 'Unknown'} - ${item.Name}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // TODO: Save to IndexedDB for offline access
    } catch (error) {
      console.error('Error downloading track:', error);
      alert('Error al descargar la canción');
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.Artists?.some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTracks = tracks.filter(track =>
    track.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.Artists?.some(artist => artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
    track.Album?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-32">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold text-white">Playmuusica</h1>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar música, artistas, álbumes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-5 h-5" />
                <span className="text-sm">{user?.jellyfinUsername}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-4">
            <button
              onClick={() => setActiveTab('albums')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'albums'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Disc className="w-5 h-5" />
              <span>Álbumes</span>
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'tracks'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Music className="w-5 h-5" />
              <span>Canciones</span>
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'playlists'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-5 h-5" />
              <span>Playlists</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subscription Banner */}
      {!hasActiveSubscription && showSubscriptionBanner && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 border-b border-purple-500">
          <div className="max-w-screen-2xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    ¡Desbloquea todas las funciones!
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Suscríbete para disfrutar de música ilimitada, descargas offline y más
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/subscribe')}
                  className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Suscribirme ahora
                </button>
                <button
                  onClick={() => setShowSubscriptionBanner(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Cargando música...</div>
          </div>
        ) : (
          <>
            {activeTab === 'albums' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Álbumes</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filteredAlbums.map(album => (
                    <MusicCard
                      key={album.Id}
                      item={album}
                      onPlay={handlePlayAlbum}
                    />
                  ))}
                </div>
                {filteredAlbums.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    No se encontraron álbumes
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tracks' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Canciones</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filteredTracks.map(track => (
                    <MusicCard
                      key={track.Id}
                      item={track}
                      onPlay={handlePlayTrack}
                      onAddToQueue={addToQueue}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
                {filteredTracks.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    No se encontraron canciones
                  </div>
                )}
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className="text-center text-gray-400 py-12">
                <ListMusic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Gestión de playlists</p>
                <p className="text-sm">Próximamente podrás crear y gestionar tus playlists personalizadas</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
