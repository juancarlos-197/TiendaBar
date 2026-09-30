export interface Artist {
  id?: string;
  name: string;
  genre: string;
  bio: string;
  imageUrl: string;
  monthlyListeners: number;
  topTracksCount: number;
  popular: boolean;
  active: boolean;
  createdAt?: string;
}

export interface Song {
  id?: string;
  title: string;
  artistId: string;
  artistName: string;
  album: string;
  duration: string;
  audioUrl: string;
  genre: string;
  playsCount: number;
  active: boolean;
  createdAt?: string;
}

export interface Playlist {
  id?: string;
  title: string;
  description: string;
  coverUrl: string;
  genre: string;
  isFeatured: boolean;
  songIds?: string[];
  songs?: Song[];
  createdBy?: string;
  createdAt?: string;
}
