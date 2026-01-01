import type {
  JellyfinAuthResponse,
  JellyfinItem,
  JellyfinItemsResponse,
} from '../types/jellyfin';

const JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL;

if (!JELLYFIN_URL) {
  throw new Error('Missing Jellyfin URL environment variable');
}

class JellyfinService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.baseUrl = JELLYFIN_URL;
    // Try to load token from localStorage
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('jellyfin_access_token');
    const userId = localStorage.getItem('jellyfin_user_id');
    if (token && userId) {
      this.accessToken = token;
      this.userId = userId;
    }
  }

  private saveTokenToStorage(token: string, userId: string) {
    localStorage.setItem('jellyfin_access_token', token);
    localStorage.setItem('jellyfin_user_id', userId);
    this.accessToken = token;
    this.userId = userId;
  }

  private clearTokenFromStorage() {
    localStorage.removeItem('jellyfin_access_token');
    localStorage.removeItem('jellyfin_user_id');
    this.accessToken = null;
    this.userId = null;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="Playmuusica", Device="Web Browser", DeviceId="${this.getDeviceId()}", Version="1.0.0"`,
    };

    if (includeAuth && this.accessToken) {
      headers['X-Emby-Token'] = this.accessToken;
    }

    return headers;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  async authenticate(username: string, password: string): Promise<JellyfinAuthResponse> {
    const response = await fetch(`${this.baseUrl}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({
        Username: username,
        Pw: password,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data: JellyfinAuthResponse = await response.json();
    this.saveTokenToStorage(data.AccessToken, data.User.Id);
    return data;
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${this.baseUrl}/Sessions/Logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.clearTokenFromStorage();
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.userId !== null;
  }

  getUserId(): string | null {
    return this.userId;
  }

  // Get all music items
  async getMusicLibrary(params?: {
    startIndex?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    searchTerm?: string;
  }): Promise<JellyfinItemsResponse> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      includeItemTypes: 'Audio',
      recursive: 'true',
      fields: 'PrimaryImageAspectRatio,SortName,Path,MediaSources',
      ...(params?.startIndex !== undefined && { startIndex: params.startIndex.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.sortBy && { sortBy: params.sortBy }),
      ...(params?.sortOrder && { sortOrder: params.sortOrder }),
      ...(params?.searchTerm && { searchTerm: params.searchTerm }),
    });

    const response = await fetch(`${this.baseUrl}/Items?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch music library');
    }

    return response.json();
  }

  // Get albums
  async getAlbums(params?: {
    startIndex?: number;
    limit?: number;
    artistId?: string;
  }): Promise<JellyfinItemsResponse> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      includeItemTypes: 'MusicAlbum',
      recursive: 'true',
      fields: 'PrimaryImageAspectRatio,SortName',
      ...(params?.startIndex !== undefined && { startIndex: params.startIndex.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.artistId && { artistIds: params.artistId }),
    });

    const response = await fetch(`${this.baseUrl}/Items?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch albums');
    }

    return response.json();
  }

  // Get artists
  async getArtists(params?: {
    startIndex?: number;
    limit?: number;
  }): Promise<JellyfinItemsResponse> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      ...(params?.startIndex !== undefined && { startIndex: params.startIndex.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
    });

    const response = await fetch(`${this.baseUrl}/Artists?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch artists');
    }

    return response.json();
  }

  // Get playlists
  async getPlaylists(): Promise<JellyfinItemsResponse> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      includeItemTypes: 'Playlist',
      recursive: 'true',
    });

    const response = await fetch(`${this.baseUrl}/Items?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }

    return response.json();
  }

  // Get playlist items
  async getPlaylistItems(playlistId: string): Promise<JellyfinItemsResponse> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      fields: 'PrimaryImageAspectRatio,SortName,Path,MediaSources',
    });

    const response = await fetch(
      `${this.baseUrl}/Playlists/${playlistId}/Items?${queryParams}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch playlist items');
    }

    return response.json();
  }

  // Get item details
  async getItem(itemId: string): Promise<JellyfinItem> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
    });

    const response = await fetch(`${this.baseUrl}/Items/${itemId}?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    return response.json();
  }

  // Get stream URL for an audio item
  getStreamUrl(itemId: string): string {
    if (!this.accessToken) {
      throw new Error('User not authenticated');
    }

    return `${this.baseUrl}/Audio/${itemId}/universal?UserId=${this.userId}&DeviceId=${this.getDeviceId()}&MaxStreamingBitrate=140000000&Container=opus,webm|opus,mp3,aac,m4a|aac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&api_key=${this.accessToken}&PlaySessionId=${crypto.randomUUID()}&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`;
  }

  // Get image URL
  getImageUrl(itemId: string, type: 'Primary' | 'Backdrop' = 'Primary', tag?: string): string {
    const tagParam = tag ? `?tag=${tag}` : '';
    return `${this.baseUrl}/Items/${itemId}/Images/${type}${tagParam}`;
  }

  // Report playback progress
  async reportPlaybackStart(itemId: string, positionTicks: number): Promise<void> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    await fetch(`${this.baseUrl}/Sessions/Playing`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: positionTicks,
        IsPaused: false,
        PlayMethod: 'DirectStream',
      }),
    });
  }

  async reportPlaybackProgress(itemId: string, positionTicks: number, isPaused: boolean): Promise<void> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    await fetch(`${this.baseUrl}/Sessions/Playing/Progress`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: positionTicks,
        IsPaused: isPaused,
        PlayMethod: 'DirectStream',
      }),
    });
  }

  async reportPlaybackStopped(itemId: string, positionTicks: number): Promise<void> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    await fetch(`${this.baseUrl}/Sessions/Playing/Stopped`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: positionTicks,
      }),
    });
  }
}

export const jellyfinService = new JellyfinService();
