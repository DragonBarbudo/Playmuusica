export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin?: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
  Configuration?: {
    PlayDefaultAudioTrack: boolean;
    SubtitleLanguagePreference: string;
    DisplayMissingEpisodes: boolean;
    GroupedFolders: string[];
    SubtitleMode: string;
    DisplayCollectionsView: boolean;
    EnableLocalPassword: boolean;
    OrderedViews: string[];
    LatestItemsExcludes: string[];
    MyMediaExcludes: string[];
    HidePlayedInLatest: boolean;
    RememberAudioSelections: boolean;
    RememberSubtitleSelections: boolean;
    EnableNextEpisodeAutoPlay: boolean;
  };
  Policy?: {
    IsAdministrator: boolean;
    IsHidden: boolean;
    IsDisabled: boolean;
    EnabledDevices: string[];
    EnableAllDevices: boolean;
  };
}

export interface JellyfinAuthResponse {
  User: JellyfinUser;
  SessionInfo: {
    PlayState: Record<string, unknown>;
    AdditionalUsers: unknown[];
    Capabilities: {
      PlayableMediaTypes: string[];
      SupportedCommands: string[];
    };
    RemoteEndPoint: string;
    Id: string;
    UserId: string;
    UserName: string;
    Client: string;
    LastActivityDate: string;
    LastPlaybackCheckIn: string;
    DeviceName: string;
    DeviceId: string;
    ApplicationVersion: string;
    IsActive: boolean;
    SupportsMediaControl: boolean;
    SupportsRemoteControl: boolean;
    NowPlayingItem: unknown | null;
    ServerId: string;
    UserPrimaryImageTag: string;
  };
  AccessToken: string;
  ServerId: string;
}

export interface JellyfinItem {
  Name: string;
  ServerId: string;
  Id: string;
  Container?: string;
  PremiereDate?: string;
  CriticRating?: number;
  OfficialRating?: string;
  CommunityRating?: number;
  RunTimeTicks?: number;
  ProductionYear?: number;
  IsFolder?: boolean;
  Type: string;
  UserData?: {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    Key: string;
  };
  PrimaryImageAspectRatio?: number;
  Artists?: string[];
  ArtistItems?: Array<{
    Name: string;
    Id: string;
  }>;
  Album?: string;
  AlbumId?: string;
  AlbumPrimaryImageTag?: string;
  MediaType?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  IsPlaceHolder?: boolean;
  Path?: string;
  MediaSources?: Array<{
    Protocol: string;
    Id: string;
    Path: string;
    Type: string;
    Container: string;
    Size: number;
    Name: string;
    IsRemote: boolean;
    RunTimeTicks: number;
    SupportsTranscoding: boolean;
    SupportsDirectStream: boolean;
    SupportsDirectPlay: boolean;
    IsInfiniteStream: boolean;
    RequiresOpening: boolean;
    RequiresClosing: boolean;
    RequiresLooping: boolean;
    SupportsProbing: boolean;
    MediaStreams: Array<{
      Codec: string;
      TimeBase: string;
      CodecTimeBase: string;
      DisplayTitle: string;
      IsInterlaced: boolean;
      ChannelLayout?: string;
      BitRate?: number;
      SampleRate?: number;
      Channels?: number;
      IsDefault: boolean;
      IsForced: boolean;
      IsExternal: boolean;
      Height?: number;
      Width?: number;
      AverageFrameRate?: number;
      RealFrameRate?: number;
      Profile?: string;
      Type: string;
      AspectRatio?: string;
      Index: number;
      IsTextSubtitleStream: boolean;
      SupportsExternalStream: boolean;
      PixelFormat?: string;
      Level?: number;
    }>;
  }>;
}

export interface JellyfinPlaylist {
  Name: string;
  ServerId: string;
  Id: string;
  Etag: string;
  DateCreated: string;
  CanDelete: boolean;
  CanDownload: boolean;
  SortName: string;
  ExternalUrls: unknown[];
  Path: string;
  TagItems: unknown[];
  IsFolder: boolean;
  Type: string;
  UserData: {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    Key: string;
  };
  MediaType: string;
  ImageTags: {
    Primary?: string;
  };
  BackdropImageTags: string[];
  LocationType: string;
  ChildCount?: number;
  CumulativeRunTimeTicks?: number;
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}
