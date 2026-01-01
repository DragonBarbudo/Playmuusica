export interface CustomPlaylist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tracks: PlaylistTrack[];
  coverImageUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  id: string;
  jellyfinItemId: string;
  position: number;
  addedAt: string;
}

export interface DownloadedTrack {
  id: string;
  jellyfinItemId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  blobUrl: string;
  downloadedAt: string;
  fileSize: number;
}
