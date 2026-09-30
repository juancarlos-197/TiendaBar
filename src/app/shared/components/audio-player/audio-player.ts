import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music.service';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (music.currentTrack(); as track) {
      <div class="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-xl px-4 py-2.5 shadow-2xl transition-all">
        <!-- Progress track -->
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <!-- Track Info -->
          <div class="flex items-center gap-3 w-full md:w-1/3 min-w-0">
            <div class="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80"
                alt="Track Cover"
                class="w-full h-full object-cover"
                [class.animate-pulse]="music.isPlaying()"
              />
              @if (music.isPlaying()) {
                <div class="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                  <span class="material-icons text-xs text-violet-300 animate-spin">graphic_eq</span>
                </div>
              }
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-semibold text-zinc-100 truncate hover:text-fuchsia-400 cursor-pointer transition-colors">
                {{ track.title }}
              </h4>
              <p class="text-xs text-zinc-400 truncate">{{ track.artistName }} • <span class="text-violet-400">{{ track.genre }}</span></p>
            </div>
          </div>

          <!-- Controls & Timeline -->
          <div class="flex flex-col items-center gap-1.5 w-full md:w-1/2">
            <div class="flex items-center gap-4">
              <button
                (click)="music.previousTrack()"
                class="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
                title="Canción anterior"
              >
                <span class="material-icons text-xl">skip_previous</span>
              </button>

              <button
                (click)="music.togglePlay()"
                class="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
                [title]="music.isPlaying() ? 'Pausar' : 'Reproducir'"
              >
                <span class="material-icons text-2xl">
                  {{ music.isPlaying() ? 'pause' : 'play_arrow' }}
                </span>
              </button>

              <button
                (click)="music.nextTrack()"
                class="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
                title="Siguiente canción"
              >
                <span class="material-icons text-xl">skip_next</span>
              </button>
            </div>

            <!-- Progress bar -->
            <div class="w-full flex items-center gap-2 text-[11px] text-zinc-400">
              <span>{{ formatTime(music.currentTime()) }}</span>
              <input
                type="range"
                [min]="0"
                [max]="music.totalDuration() || 100"
                [value]="music.currentTime()"
                (input)="onSeek($event)"
                class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 hover:accent-fuchsia-400"
              />
              <span>{{ formatTime(music.totalDuration() || 180) }}</span>
            </div>
          </div>

          <!-- Volume & Actions -->
          <div class="hidden md:flex items-center justify-end gap-3 w-1/3 text-zinc-400">
            <span class="material-icons text-sm">volume_up</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              [value]="music.volume()"
              (input)="onVolumeChange($event)"
              class="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

        </div>
      </div>
    }
  `
})
export class AudioPlayerComponent {
  public music = inject(MusicService);

  formatTime(secs: number): string {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  onSeek(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.music.seek(val);
  }

  onVolumeChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.music.setVolume(val);
  }
}
