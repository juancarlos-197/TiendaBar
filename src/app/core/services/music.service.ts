import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { NotificationService } from './notification.service';
import { Artist, Song, Playlist } from '../models/music.model';

const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'art-1',
    name: 'DJ Snake & Los Del Espacio (Live Club Set)',
    genre: 'Tech House, Latin EDM & Baile Funk',
    bio: 'Productor internacional que fusiona percusiones latinas con líneas de bajo pesadas para festivales y pistas de baile de madrugada.',
    imageUrl: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=600&q=80',
    monthlyListeners: 4200000,
    topTracksCount: 18,
    popular: true,
    active: true
  },
  {
    id: 'art-2',
    name: 'Son de la Calle (Septeto Caucano)',
    genre: 'Salsa Brava, Son Cubano & Timba',
    bio: 'Agrupación tradicional de Popayán con trombones potentes, congas y campana al estilo de la salsa setentera de Nueva York y Cali.',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    monthlyListeners: 185000,
    topTracksCount: 12,
    popular: true,
    active: true
  },
  {
    id: 'art-3',
    name: 'Valeria Cruz (Resident DJ)',
    genre: 'Melodic Techno & Peak Time',
    bio: 'Pionera de los amaneceres en la escena underground colombiana con beats a 132 BPM y sintetizadores analógicos envolventes.',
    imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80',
    monthlyListeners: 340000,
    topTracksCount: 9,
    popular: false,
    active: true
  },
  {
    id: 'art-4',
    name: 'El Bloque Urbano',
    genre: 'Reggaetón, Afrobeat & Trap Latino',
    bio: 'Colectivo de DJs y productores que marcan el ritmo del perreo en las mejores discotecas del suroccidente colombiano.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    monthlyListeners: 890000,
    topTracksCount: 24,
    popular: true,
    active: true
  }
];

const INITIAL_SONGS: Song[] = [
  {
    id: 'song-1',
    title: 'Noche en el Sotareño (En Vivo)',
    artistId: 'art-2',
    artistName: 'Son de la Calle (Septeto Caucano)',
    album: 'Bohemia en Popayán',
    duration: '4:15',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=tropic-112283.mp3',
    genre: 'Salsa Brava',
    playsCount: 45200,
    active: true
  },
  {
    id: 'song-2',
    title: 'Midnight Frequency (Original Mix)',
    artistId: 'art-3',
    artistName: 'Valeria Cruz',
    album: 'Eclipse Underground EP',
    duration: '5:42',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    genre: 'Melodic Techno',
    playsCount: 88100,
    active: true
  },
  {
    id: 'song-3',
    title: 'Bajo & Fuego (Club VIP Remix)',
    artistId: 'art-1',
    artistName: 'DJ Snake & Los Del Espacio',
    album: 'Fuego Sessions 2026',
    duration: '3:20',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=club-edm-11438.mp3',
    genre: 'Tech House',
    playsCount: 195000,
    active: true
  },
  {
    id: 'song-4',
    title: 'Popayán de Fiesta (Perreo Sucio)',
    artistId: 'art-4',
    artistName: 'El Bloque Urbano',
    album: 'La Clandestina Mixtape',
    duration: '3:05',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=urban-reggaeton-122709.mp3',
    genre: 'Reggaetón',
    playsCount: 142000,
    active: true
  },
  {
    id: 'song-5',
    title: 'Sunset Skybar (Cocktail Groove)',
    artistId: 'art-3',
    artistName: 'Valeria Cruz',
    album: 'Rooftop Chill',
    duration: '4:30',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
    genre: 'Deep Lounge',
    playsCount: 63400,
    active: true
  }
];

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    title: 'Viernes de Crossover & Rumba Total',
    description: 'La selección definitiva para encender la noche: salsa clásica, merengue ochentero, reggaetón rompedor y hits del momento.',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    genre: 'Crossover',
    isFeatured: true,
    songIds: ['song-1', 'song-4', 'song-3']
  },
  {
    id: 'pl-2',
    title: 'Techno Rave: Boiler Room Popayán',
    description: 'Bajos hipnóticos, percusiones oscuras e intensidad continua de club para los amantes de la electrónica pura.',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    genre: 'Underground Techno',
    isFeatured: true,
    songIds: ['song-2', 'song-3']
  },
  {
    id: 'pl-3',
    title: 'Lounge Sunset & Cocktails 360°',
    description: 'Sonidos elegantes y relajados para acompañar un buen trago al caer la tarde en terrazas y rooftops.',
    coverUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
    genre: 'Deep Lounge',
    isFeatured: false,
    songIds: ['song-5']
  }
];

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private readonly fb = inject(FirebaseService);
  private readonly notify = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);

  public artists = signal<Artist[]>(INITIAL_ARTISTS);
  public songs = signal<Song[]>(INITIAL_SONGS);
  public playlists = signal<Playlist[]>(INITIAL_PLAYLISTS);

  // Audio player state
  public currentTrack = signal<Song | null>(null);
  public isPlaying = signal<boolean>(false);
  public currentTime = signal<number>(0);
  public totalDuration = signal<number>(0);
  public volume = signal<number>(0.8);

  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    this.initAudioPlayer();
    this.fetchMusicData();
  }

  private initAudioPlayer() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.audioElement = new Audio();
    this.audioElement.volume = this.volume();

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.currentTime.set(this.audioElement.currentTime);
      }
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this.totalDuration.set(this.audioElement.duration || 180);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.nextTrack();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback notice:', e);
      // Keep UI state pleasant
      this.isPlaying.set(false);
    });
  }

  private async fetchMusicData() {
    if (!this.fb.firestore) return;
    try {
      const songsSnap = await getDocs(collection(this.fb.firestore, 'songs'));
      if (!songsSnap.empty) {
        const loaded: Song[] = [];
        songsSnap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Song) }));
        this.songs.set(loaded);
      }
    } catch (e) {
      console.warn('Songs Firestore fallback:', e);
    }
  }

  public playSong(song: Song) {
    this.currentTrack.set(song);
    this.isPlaying.set(true);

    if (this.audioElement && isPlatformBrowser(this.platformId)) {
      this.audioElement.src = song.audioUrl;
      this.audioElement.play().catch(err => {
        console.warn('Audio autoplay permitted after user interaction:', err);
      });
    }

    this.notify.info(`Reproduciendo: ${song.title} - ${song.artistName}`, 'Reproductor Nocturna');
  }

  public togglePlay() {
    if (!this.currentTrack()) {
      if (this.songs().length > 0) {
        this.playSong(this.songs()[0]);
      }
      return;
    }

    if (this.isPlaying()) {
      this.audioElement?.pause();
      this.isPlaying.set(false);
    } else {
      this.audioElement?.play().catch(e => console.warn(e));
      this.isPlaying.set(true);
    }
  }

  public seek(seconds: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
      this.currentTime.set(seconds);
    }
  }

  public setVolume(val: number) {
    this.volume.set(val);
    if (this.audioElement) {
      this.audioElement.volume = val;
    }
  }

  public nextTrack() {
    const list = this.songs();
    if (!list.length) return;
    const current = this.currentTrack();
    if (!current) {
      this.playSong(list[0]);
      return;
    }
    const idx = list.findIndex(s => s.id === current.id);
    const nextIdx = (idx + 1) % list.length;
    this.playSong(list[nextIdx]);
  }

  public previousTrack() {
    const list = this.songs();
    if (!list.length) return;
    const current = this.currentTrack();
    if (!current) {
      this.playSong(list[0]);
      return;
    }
    const idx = list.findIndex(s => s.id === current.id);
    const prevIdx = (idx - 1 + list.length) % list.length;
    this.playSong(list[prevIdx]);
  }

  public async addSong(song: Omit<Song, 'id'>) {
    const newSong: Song = { ...song, id: 'song-' + Date.now(), createdAt: new Date().toISOString() };
    if (this.fb.firestore) {
      try {
        const ref = await addDoc(collection(this.fb.firestore, 'songs'), newSong);
        newSong.id = ref.id;
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, 'songs');
      }
    }
    this.songs.update(s => [newSong, ...s]);
    this.notify.success(`Canción "${newSong.title}" agregada al catálogo`);
  }

  public async addArtist(artist: Omit<Artist, 'id'>) {
    const newArt: Artist = { ...artist, id: 'art-' + Date.now(), createdAt: new Date().toISOString() };
    if (this.fb.firestore) {
      try {
        const ref = await addDoc(collection(this.fb.firestore, 'artists'), newArt);
        newArt.id = ref.id;
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, 'artists');
      }
    }
    this.artists.update(a => [newArt, ...a]);
    this.notify.success(`Artista "${newArt.name}" registrado`);
  }
}
