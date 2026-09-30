import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MusicService } from '../../core/services/music.service';
import { AuthService } from '../../core/services/auth.service';
import { Song, Artist } from '../../core/models/music.model';

@Component({
  selector: 'app-musica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8 pb-16">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <span class="material-icons text-violet-400 text-3xl">headphones</span>
            Música & Sets de Club
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Escucha en streaming los lanzamientos de DJs residentes y orquestas de salsa en vivo
          </p>
        </div>

        @if (auth.isAdmin() || auth.isBarOwner()) {
          <div class="flex items-center gap-2">
            <button
              (click)="showAddSongModal = true"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
            >
              <span class="material-icons text-sm">library_music</span>
              Subir Canción
            </button>
            <button
              (click)="showAddArtistModal = true"
              class="px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1.5"
            >
              <span class="material-icons text-sm">person_add</span>
              Nuevo Artista
            </button>
          </div>
        }
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          (click)="activeTab = 'canciones'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'canciones' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          <span class="material-icons text-base">music_note</span>
          Canciones & Sets ({{ musicService.songs().length }})
        </button>

        <button
          (click)="activeTab = 'artistas'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'artistas' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          <span class="material-icons text-base">mic</span>
          Artistas & DJs ({{ musicService.artists().length }})
        </button>

        <button
          (click)="activeTab = 'playlists'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'playlists' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
        >
          <span class="material-icons text-base">queue_music</span>
          Playlists ({{ musicService.playlists().length }})
        </button>
      </div>

      <!-- TAB 1: CANCIONES -->
      @if (activeTab === 'canciones') {
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden p-4 sm:p-6 shadow-xl">
          <div class="divide-y divide-zinc-800/80">
            @for (song of musicService.songs(); track song.id) {
              <div
                class="py-3.5 px-3 flex items-center justify-between gap-4 hover:bg-zinc-800/40 rounded-2xl transition-colors group cursor-pointer"
                (click)="musicService.playSong(song)"
              >
                <!-- Play button & Track Title -->
                <div class="flex items-center gap-3.5 min-w-0">
                  <button
                    class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90"
                    [ngClass]="musicService.currentTrack()?.id === song.id && musicService.isPlaying() ? 'bg-fuchsia-600 text-white animate-pulse' : 'bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white'"
                  >
                    <span class="material-icons text-2xl">
                      {{ musicService.currentTrack()?.id === song.id && musicService.isPlaying() ? 'pause' : 'play_arrow' }}
                    </span>
                  </button>

                  <div class="min-w-0">
                    <h4 class="text-sm font-bold text-zinc-100 truncate group-hover:text-violet-300">
                      {{ song.title }}
                    </h4>
                    <p class="text-xs text-zinc-400 truncate">
                      {{ song.artistName }} • <span class="text-zinc-500">{{ song.album }}</span>
                    </p>
                  </div>
                </div>

                <!-- Genre & Stats -->
                <div class="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                  <span class="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                    {{ song.genre }}
                  </span>
                  <span class="hidden sm:inline font-mono">{{ song.duration }}</span>
                  <button
                    (click)="$event.stopPropagation(); musicService.playSong(song)"
                    class="p-2 text-zinc-500 hover:text-white transition-colors"
                    title="Reproducir ahora"
                  >
                    <span class="material-icons text-lg">play_circle</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: ARTISTAS & DJS -->
      @if (activeTab === 'artistas') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (artist of musicService.artists(); track artist.id) {
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 hover:border-violet-500/40 transition-all flex flex-col items-center text-center group shadow-xl">
              <div class="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-zinc-800 group-hover:border-violet-500 transition-colors shadow-lg">
                <img [src]="artist.imageUrl" [alt]="artist.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                @if (artist.popular) {
                  <span class="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-[10px]" title="Top Resident">
                    ★
                  </span>
                }
              </div>

              <h3 class="font-heading text-base font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                {{ artist.name }}
              </h3>
              <p class="text-xs text-violet-400 font-semibold mt-0.5">{{ artist.genre }}</p>
              <p class="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{{ artist.bio }}</p>

              <div class="mt-4 pt-3 border-t border-zinc-800/80 w-full flex items-center justify-between text-[11px] text-zinc-500">
                <span>{{ artist.topTracksCount }} temas</span>
                <span>{{ (artist.monthlyListeners / 1000).toFixed(0) }}k oyentes/mes</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 3: PLAYLISTS -->
      @if (activeTab === 'playlists') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (pl of musicService.playlists(); track pl.id) {
            <div class="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-fuchsia-500/40 transition-all flex flex-col group shadow-xl">
              <div class="relative h-48 bg-zinc-800 overflow-hidden">
                <img [src]="pl.coverUrl" [alt]="pl.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                <div class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-[11px] font-bold text-amber-400">
                  {{ pl.genre }}
                </div>
                <div class="absolute bottom-3 left-4 right-4">
                  <h3 class="font-heading text-lg font-bold text-white">{{ pl.title }}</h3>
                </div>
              </div>

              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p class="text-xs text-zinc-400 leading-relaxed">{{ pl.description }}</p>
                <div class="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span class="text-xs text-zinc-500">Curaduría Oficial Nocturna</span>
                  <button
                    (click)="playPlaylist(pl)"
                    class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5 transition-colors"
                  >
                    <span class="material-icons text-sm">play_arrow</span>
                    Reproducir
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Add Song Modal -->
      @if (showAddSongModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-heading text-lg font-bold text-white">Subir Canción / Set</h3>
              <button (click)="showAddSongModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="songForm" (ngSubmit)="onCreateSong()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Título de la Canción</label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="Ej. Fuego en la Disco"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Artista o DJ</label>
                <input
                  type="text"
                  formControlName="artistName"
                  placeholder="Ej. Valeria Cruz"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Álbum o EP</label>
                  <input
                    type="text"
                    formControlName="album"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-300 mb-1">Género</label>
                  <input
                    type="text"
                    formControlName="genre"
                    placeholder="Salsa, Techno..."
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">URL Audio Stream (MP3)</label>
                <input
                  type="text"
                  formControlName="audioUrl"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="showAddSongModal = false" class="px-4 py-2 text-xs text-zinc-400">Cancelar</button>
                <button type="submit" [disabled]="songForm.invalid" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
                  Guardar Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add Artist Modal -->
      @if (showAddArtistModal) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-heading text-lg font-bold text-white">Registrar Artista / DJ</h3>
              <button (click)="showAddArtistModal = false" class="text-zinc-500 hover:text-white">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="artistForm" (ngSubmit)="onCreateArtist()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Nombre Artístico</label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej. DJ Tornado"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Género Musical</label>
                <input
                  type="text"
                  formControlName="genre"
                  placeholder="Tech House, Salsa Brava..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Biografía</label>
                <textarea
                  formControlName="bio"
                  rows="3"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-300 mb-1">Foto del Artista (URL)</label>
                <input
                  type="text"
                  formControlName="imageUrl"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="showAddArtistModal = false" class="px-4 py-2 text-xs text-zinc-400">Cancelar</button>
                <button type="submit" [disabled]="artistForm.invalid" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
                  Guardar Artista
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class MusicaComponent {
  public musicService = inject(MusicService);
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public activeTab: 'canciones' | 'artistas' | 'playlists' = 'canciones';
  public showAddSongModal = false;
  public showAddArtistModal = false;

  public songForm = this.fb.group({
    title: ['', [Validators.required]],
    artistName: ['', [Validators.required]],
    album: ['Single 2026', [Validators.required]],
    genre: ['Urbano & Club', [Validators.required]],
    audioUrl: ['https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3', [Validators.required]]
  });

  public artistForm = this.fb.group({
    name: ['', [Validators.required]],
    genre: ['', [Validators.required]],
    bio: ['', [Validators.required]],
    imageUrl: ['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80', [Validators.required]]
  });

  playPlaylist(pl: any) {
    if (this.musicService.songs().length > 0) {
      this.musicService.playSong(this.musicService.songs()[0]);
    }
  }

  onCreateSong() {
    if (this.songForm.valid) {
      const val = this.songForm.value;
      this.musicService.addSong({
        title: val.title!,
        artistId: 'art-custom',
        artistName: val.artistName!,
        album: val.album!,
        duration: '3:45',
        audioUrl: val.audioUrl!,
        genre: val.genre!,
        playsCount: 1,
        active: true
      });
      this.showAddSongModal = false;
    }
  }

  onCreateArtist() {
    if (this.artistForm.valid) {
      const val = this.artistForm.value;
      this.musicService.addArtist({
        name: val.name!,
        genre: val.genre!,
        bio: val.bio!,
        imageUrl: val.imageUrl!,
        monthlyListeners: 15000,
        topTracksCount: 1,
        popular: false,
        active: true
      });
      this.showAddArtistModal = false;
    }
  }
}
