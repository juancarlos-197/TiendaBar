import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { AudioPlayerComponent } from './shared/components/audio-player/audio-player';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AudioPlayerComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
