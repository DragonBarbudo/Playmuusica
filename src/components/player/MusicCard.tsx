import React from 'react';
import { Play, Download, Plus } from 'lucide-react';
import { jellyfinService } from '../../services/jellyfin';
import type { JellyfinItem } from '../../types/jellyfin';

interface MusicCardProps {
  item: JellyfinItem;
  onPlay: (item: JellyfinItem) => void;
  onAddToQueue?: (item: JellyfinItem) => void;
  onDownload?: (item: JellyfinItem) => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  item,
  onPlay,
  onAddToQueue,
  onDownload,
}) => {
  const imageUrl = item.AlbumPrimaryImageTag
    ? jellyfinService.getImageUrl(item.AlbumId || item.Id, 'Primary', item.AlbumPrimaryImageTag)
    : item.Type === 'MusicAlbum'
    ? jellyfinService.getImageUrl(item.Id, 'Primary')
    : null;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(item);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue?.(item);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(item);
  };

  return (
    <div className="group bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all cursor-pointer">
      <div className="relative mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.Name}
            className="w-full aspect-square object-cover rounded-md"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-700 rounded-md flex items-center justify-center">
            <span className="text-gray-500 text-4xl">♪</span>
          </div>
        )}

        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 p-3 bg-purple-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all hover:bg-purple-700"
        >
          <Play className="w-5 h-5 text-white fill-white" />
        </button>
      </div>

      <h3 className="text-white font-medium truncate mb-1">{item.Name}</h3>
      <p className="text-gray-400 text-sm truncate">
        {item.Artists?.join(', ') || 'Unknown Artist'}
      </p>

      {item.Type === 'Audio' && (
        <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddToQueue && (
            <button
              onClick={handleAddToQueue}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              title="Agregar a cola"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
