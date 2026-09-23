import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from './services/firebase.service';
import { ToastService } from './services/toast.service';
import { NavbarComponent } from './components/navbar/navbar';
import { DashboardComponent } from './components/dashboard/dashboard';
import { InventoryComponent } from './components/inventory/inventory';
import { LoansComponent } from './components/loans/loans';
import { HistoryComponent } from './components/history/history';
import { UsersComponent } from './components/users/users';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { ItemModalComponent } from './components/item-modal/item-modal';
import { LoanModalComponent } from './components/loan-modal/loan-modal';
import { ToastContainerComponent } from './components/toast-container/toast-container';
import { Item, ItemType } from './models/types';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    NavbarComponent,
    DashboardComponent,
    InventoryComponent,
    LoansComponent,
    HistoryComponent,
    UsersComponent,
    SubscriptionsComponent,
    AuthModalComponent,
    ItemModalComponent,
    LoanModalComponent,
    ToastContainerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public firebaseService = inject(FirebaseService);
  public toastService = inject(ToastService);

  public activeTab = signal<string>('dashboard');

  // Modals state
  public showAuthModal = signal<boolean>(false);
  public showItemModal = signal<boolean>(false);
  public showLoanModal = signal<boolean>(false);

  public itemToEdit = signal<Item | null>(null);
  public defaultItemType = signal<ItemType>('bar');
  public preselectedItemIdForLoan = signal<string | null>(null);

  public overdueCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.firebaseService
      .loans()
      .filter((l) => l.status !== 'devuelto' && (l.status === 'vencido' || l.dueDate < today)).length;
  });

  public openCreateItem(type: ItemType = 'bar') {
    this.itemToEdit.set(null);
    this.defaultItemType.set(type);
    this.showItemModal.set(true);
  }

  public openEditItem(item: Item) {
    this.itemToEdit.set(item);
    this.showItemModal.set(true);
  }

  public openLoanModal(itemId: string | null = null) {
    this.preselectedItemIdForLoan.set(itemId);
    this.showLoanModal.set(true);
  }
}
