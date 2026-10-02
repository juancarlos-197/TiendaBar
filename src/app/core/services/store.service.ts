import { Injectable, inject, signal, computed } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService, OperationType } from './firebase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { Product, Category, CartItem, Order, OrderStatus, DeliveryMethod } from '../models/product.model';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-licores', name: 'Licores & Botellas', slug: 'licores', icon: 'liquor', description: 'Whiskies, aguardiente, rones añejos, tequila y ginebra premium', active: true },
  { id: 'cat-cocteles', name: 'Cócteles de Autor', slug: 'cocteles', icon: 'local_bar', description: 'Creaciones exclusivas de nuestros mixólogos residentes', active: true },
  { id: 'cat-cervezas', name: 'Cervezas Artesanales & Rubias', slug: 'cervezas', icon: 'sports_bar', description: 'Cervezas heladas nacionales, importadas y de barril', active: true },
  { id: 'cat-vip', name: 'Servicio VIP & Champagne', slug: 'vip', icon: 'stars', description: 'Moët, Don Pérignon y botellas servidas con bengalas en mesa', active: true },
  { id: 'cat-tapas', name: 'Piqueos & Tapas Nocturnas', slug: 'tapas', icon: 'restaurant', description: 'Nachos con queso cheddar, alitas BBQ, tequeños y mini hamburguesas', active: true }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-whisky-black',
    name: 'Johnnie Walker Black Label 750ml',
    description: 'Whisky escocés blend de 12 años con notas ahumadas y especiadas. Incluye 4 aguas tónicas o gaseosas y hielo gourmet.',
    price: 185000,
    categoryId: 'cat-licores',
    categoryName: 'Licores & Botellas',
    imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
    stock: 24,
    barId: 'bar-sotareno',
    barName: 'El Sotareño',
    active: true,
    volumeOrServing: 'Botella 750ml',
    whatsappNumber: '+573124567890',
    alcoholPercentage: '40% Vol.',
    ingredients: ['Malta escocesa añeja', '4 Mezcladores', 'Hielo cristalino']
  },
  {
    id: 'prod-aguardiente-caucano',
    name: 'Aguardiente Caucano Tradicional',
    description: 'El rey de la rumba del Cauca. Anisado fino, servido con sal, limón y rodajas de naranja en balde con hielo.',
    price: 95000,
    categoryId: 'cat-licores',
    categoryName: 'Licores & Botellas',
    imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=600&q=80',
    stock: 40,
    barId: 'bar-sotareno',
    barName: 'El Sotareño',
    active: true,
    volumeOrServing: 'Botella 750ml',
    whatsappNumber: '+573124567890',
    alcoholPercentage: '29% Vol.',
    ingredients: ['Anís fino del Cauca', 'Caña de azúcar', 'Servicio con sal y limones']
  },
  {
    id: 'prod-mojito-pasion',
    name: 'Mojito Maracuyá & Ron Viejo',
    description: 'Menta macerada fresca, jugo de maracuyá de la región, ron añejo colombiano, almíbar de jengibre y soda burbujeante.',
    price: 28000,
    categoryId: 'cat-cocteles',
    categoryName: 'Cócteles de Autor',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    stock: 99,
    barId: 'bar-rooftop-360',
    barName: 'Sky Lounge 360',
    active: true,
    volumeOrServing: 'Copa 350ml',
    whatsappNumber: '+573159904433',
    alcoholPercentage: '14% Vol.',
    ingredients: ['Ron añejo 8 años', 'Pulpa de maracuyá', 'Menta fresca', 'Almíbar artesanal']
  },
  {
    id: 'prod-gin-tonic-rosas',
    name: 'Gin Tonic Botánico Pink Rose',
    description: 'Ginebra infusionada con frutos rojos, flor de Jamaica, agua tónica premium Fever-Tree y pétalos de rosa secos.',
    price: 34000,
    categoryId: 'cat-cocteles',
    categoryName: 'Cócteles de Autor',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    stock: 99,
    barId: 'bar-eclipse',
    barName: 'Club Eclipse',
    active: true,
    volumeOrServing: 'Copa Balón',
    whatsappNumber: '+573208891122',
    alcoholPercentage: '15% Vol.',
    ingredients: ['Ginebra botánica', 'Agua tónica Fever-Tree', 'Pétalos de rosa', 'Frutos rojos']
  },
  {
    id: 'prod-champagne-moet',
    name: 'Champagne Moët & Chandon Brut Impérial',
    description: 'Servicio VIP con hielera luminosa LED, copas de cristal y bengalas para celebrar a lo grande en zona reservada.',
    price: 490000,
    categoryId: 'cat-vip',
    categoryName: 'Servicio VIP & Champagne',
    imageUrl: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=600&q=80',
    stock: 8,
    barId: 'bar-neon-discoteca',
    barName: 'La Clandestina Club',
    active: true,
    volumeOrServing: 'Botella 750ml VIP',
    whatsappNumber: '+573012237788',
    alcoholPercentage: '12% Vol.',
    ingredients: ['Chardonnay & Pinot Noir', 'Hielera LED luminosa', 'Show de bengalas en mesa']
  },
  {
    id: 'prod-cerveza-artesanal',
    name: 'Six-Pack Cerveza IPA Artesanal',
    description: 'Cerveza lupulada local con aroma cítrico a maracuyá y toronja. Servidas en cubeta de hielo.',
    price: 48000,
    categoryId: 'cat-cervezas',
    categoryName: 'Cervezas Artesanales',
    imageUrl: 'https://images.unsplash.com/photo-1608270190989-c56c2d474542?auto=format&fit=crop&w=600&q=80',
    stock: 50,
    barId: 'bar-sotareno',
    barName: 'El Sotareño',
    active: true,
    volumeOrServing: '6 Botellas x 330ml',
    whatsappNumber: '+573124567890',
    alcoholPercentage: '6.2% Vol.',
    ingredients: ['Lúpulos Citra & Mosaic', 'Maltas tostadas', 'Balde con hielo picado']
  },
  {
    id: 'prod-nachos-supremos',
    name: 'Nachos Supremos con Guacamole & Birria',
    description: 'Totopos crocantes bañados en queso fundido, guacamole fresco de la casa, pico de gallo y carne desmechada.',
    price: 32000,
    categoryId: 'cat-tapas',
    categoryName: 'Piqueos & Tapas',
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
    stock: 30,
    barId: 'bar-rooftop-360',
    barName: 'Sky Lounge 360',
    active: true,
    volumeOrServing: 'Porción para compartir',
    whatsappNumber: '+573159904433',
    ingredients: ['Totopos de maíz nixtamalizado', 'Queso cheddar fundido', 'Guacamole hass', 'Birria tierna']
  },
  // --- 3 NUEVOS PRODUCTOS AÑADIDOS ---
  {
    id: 'prod-tequila-don-julio-70',
    name: 'Tequila Don Julio 70 Cristalino Añejo 700ml',
    description: 'Tequila añejo cristalino filtrado en carbón activado, con suaves notas de vainilla, agave cocido y miel. Incluye sangrita de la casa y rodajas de lima.',
    price: 320000,
    categoryId: 'cat-licores',
    categoryName: 'Licores & Botellas',
    imageUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    barId: 'bar-sotareno',
    barName: 'El Sotareño VIP',
    active: true,
    volumeOrServing: 'Botella 700ml',
    whatsappNumber: '+573124567890',
    alcoholPercentage: '38% Vol.',
    ingredients: ['100% Agave azul añejado', 'Sangrita de tomate y naranja', 'Limones y sal marina']
  },
  {
    id: 'prod-aperol-spritz-veneto',
    name: 'Cóctel Aperol Spritz Veneciano',
    description: 'El cóctel veraniego por excelencia: Aperol amargo dulce, Prosecco DOC espumoso, golpe de soda y rodaja fresca de naranja en copa balón con hielo puro.',
    price: 31000,
    categoryId: 'cat-cocteles',
    categoryName: 'Cócteles de Autor',
    imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
    stock: 50,
    barId: 'bar-rooftop-360',
    barName: 'Sky Lounge 360',
    active: true,
    volumeOrServing: 'Copa Balón 400ml',
    whatsappNumber: '+573159904433',
    alcoholPercentage: '11% Vol.',
    ingredients: ['Aperol italiano', 'Prosecco DOC espumoso', 'Soda San Pellegrino', 'Naranja valenciana']
  },
  {
    id: 'prod-cubetazo-corona',
    name: 'Cubetazo Cerveza Corona Extra (5 Botellas)',
    description: 'Balde cervecero metálico con hielo escarchado, 5 botellas de Corona Extra bien frías servidas con sal fina y cuartos de limón criollo.',
    price: 55000,
    categoryId: 'cat-cervezas',
    categoryName: 'Cervezas Artesanales & Rubias',
    imageUrl: 'https://images.unsplash.com/photo-1538488881523-298f3254e060?auto=format&fit=crop&w=600&q=80',
    stock: 35,
    barId: 'bar-eclipse',
    barName: 'Club Eclipse',
    active: true,
    volumeOrServing: 'Balde 5 x 355ml',
    whatsappNumber: '+573208891122',
    alcoholPercentage: '4.5% Vol.',
    ingredients: ['5 Cervezas Corona Extra', 'Hielo escarchado', 'Limones en cuartos', 'Sal fina']
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    userId: 'user-vip-uid',
    userEmail: 'camila.rios@gmail.com',
    userName: 'Camila Ríos',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 2 },
      { product: INITIAL_PRODUCTS[6], quantity: 1 }
    ],
    total: 88000,
    status: 'PREPARING',
    deliveryMethod: 'TABLE',
    tableNumber: 'Mesa 14 (Zona Terraza)',
    notes: 'Poco hielo en los cócteles por favor',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'ord-1002',
    userId: 'admin-jalban-uid',
    userEmail: 'jalban.dacompsc@gmail.com',
    userName: 'J. Albán',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 }
    ],
    total: 185000,
    status: 'DELIVERED',
    deliveryMethod: 'VIP_LOUNGE',
    tableNumber: 'Palco VIP 1',
    notes: 'Servir con bengalas',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly fb = inject(FirebaseService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  public categories = signal<Category[]>(INITIAL_CATEGORIES);
  public products = signal<Product[]>(INITIAL_PRODUCTS);
  public orders = signal<Order[]>(INITIAL_ORDERS);
  public cart = signal<CartItem[]>([]);
  public isFirestoreConnected = signal<boolean>(false);
  public isLoading = signal<boolean>(false);

  private unsubscribeProducts: Unsubscribe | null = null;
  private hasAutoSeeded = false;
  private userExplicitlyCleared = false;

  // Computed cart values
  public cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  public cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0));

  constructor() {
    this.fetchOrders();
    this.initProductsSync();
  }

  /**
   * Initializes real-time listener for products with Cloud Firestore
   */
  public initProductsSync() {
    if (!this.fb.firestore) {
      this.products.set(INITIAL_PRODUCTS);
      return;
    }

    this.isLoading.set(true);
    const prodCol = collection(this.fb.firestore, 'products');

    try {
      this.unsubscribeProducts = onSnapshot(
        prodCol,
        (snap) => {
          this.isFirestoreConnected.set(true);
          this.isLoading.set(false);

          if (snap.empty) {
            if (!this.hasAutoSeeded && !this.userExplicitlyCleared) {
              this.hasAutoSeeded = true;
              this.seedProductsToFirestore(false);
            } else {
              this.products.set([]);
            }
          } else {
            this.hasAutoSeeded = true;
            this.userExplicitlyCleared = false;
            const list: Product[] = [];
            snap.forEach((d) => {
              const data = d.data();
              list.push({
                id: d.id,
                name: data['name'] || 'Bebida',
                description: data['description'] || '',
                price: Number(data['price']) || 0,
                categoryId: data['categoryId'] || 'cat-licores',
                categoryName: data['categoryName'] || '',
                imageUrl: data['imageUrl'] || 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
                stock: Number(data['stock']) || 0,
                barId: data['barId'] || '',
                barName: data['barName'] || '',
                active: data['active'] ?? true,
                volumeOrServing: data['volumeOrServing'] || '',
                whatsappNumber: data['whatsappNumber'] || '+573124567890',
                ingredients: data['ingredients'] || [],
                alcoholPercentage: data['alcoholPercentage'] || '',
                createdAt: data['createdAt']
              });
            });
            this.products.set(list);
          }
        },
        (error) => {
          this.isLoading.set(false);
          console.warn('Firestore products onSnapshot error:', error);
          this.fb.handleError(error, OperationType.GET, 'products');
          if (this.products().length === 0) {
            this.products.set(INITIAL_PRODUCTS);
          }
        }
      );
    } catch (e) {
      this.isLoading.set(false);
      console.warn('Products fallback to defaults:', e);
      this.products.set(INITIAL_PRODUCTS);
    }
  }

  /**
   * Seeds all products (including the 3 new drinks) directly into Cloud Firestore
   */
  public async seedProductsToFirestore(notifyUser = true): Promise<void> {
    this.userExplicitlyCleared = false;
    if (!this.fb.firestore) {
      this.products.set(INITIAL_PRODUCTS);
      if (notifyUser) {
        this.notify.info('Catálogo de bebidas y tienda cargado localmente.');
      }
      return;
    }

    this.isLoading.set(true);
    try {
      for (const prod of INITIAL_PRODUCTS) {
        const prodId = prod.id || ('prod-' + Math.random().toString(36).substring(2, 9));
        const docRef = doc(this.fb.firestore, 'products', prodId);
        await setDoc(docRef, {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: prod.categoryId,
          categoryName: prod.categoryName,
          imageUrl: prod.imageUrl,
          stock: prod.stock,
          barId: prod.barId || '',
          barName: prod.barName || '',
          active: prod.active ?? true,
          volumeOrServing: prod.volumeOrServing || '',
          whatsappNumber: prod.whatsappNumber || '+573124567890',
          ingredients: prod.ingredients || [],
          alcoholPercentage: prod.alcoholPercentage || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      this.isLoading.set(false);
      if (notifyUser) {
        this.notify.success(
          `¡${INITIAL_PRODUCTS.length} bebidas y productos sincronizados con Cloud Firestore!`,
          'Bebidas & Tienda Firebase'
        );
      }
    } catch (err) {
      this.isLoading.set(false);
      this.fb.handleError(err, OperationType.WRITE, 'products');
    }
  }

  /**
   * Generates a direct WhatsApp order URL for a specific product
   */
  public getProductWhatsAppUrl(product: Product, quantity = 1, location = 'Mesa 10'): string {
    const rawPhone = product.whatsappNumber?.replace(/[^0-9]/g, '') || '573124567890';
    const total = (product.price * quantity).toLocaleString('es-CO');
    const user = this.auth.userProfile();

    const text = `¡Hola! 👋 Quiero pedir desde la carta de Nocturna Club:\n\n` +
      `🍸 *Bebida:* ${product.name}\n` +
      `🔢 *Cantidad:* ${quantity}\n` +
      `💰 *Total:* $${total} COP\n` +
      `📍 *Bar:* ${product.barName || 'Bar Asociado'}\n` +
      `🛋️ *Mesa / Ubicación:* ${location}\n` +
      `👤 *Cliente:* ${user?.name || 'Cliente de Club'}\n\n` +
      `¿Me confirman para servir en barra o mesa, por favor?`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Generates a direct WhatsApp order URL for the entire shopping cart
   */
  public getCartWhatsAppUrl(deliveryMethod: DeliveryMethod, tableNumber?: string, notes?: string): string {
    const items = this.cart();
    if (!items.length) return '';
    const phone = '573124567890';
    const total = this.cartTotal().toLocaleString('es-CO');
    const user = this.auth.userProfile();

    let itemsList = '';
    items.forEach((item, idx) => {
      itemsList += `${idx + 1}. ${item.product.name} x${item.quantity} - $${(item.product.price * item.quantity).toLocaleString('es-CO')} COP\n`;
    });

    const methodLabels: Record<DeliveryMethod, string> = {
      TABLE: `Mesa ${tableNumber || 'General'}`,
      VIP_LOUNGE: `Palco VIP ${tableNumber || '1'}`,
      BAR_PICKUP: 'Retiro en Barra'
    };

    const text = `¡Hola! 👋 Deseo realizar un pedido de bar en Nocturna Club:\n\n` +
      `👤 *Cliente:* ${user?.name || 'Cliente de Club'}\n` +
      `📍 *Entrega:* ${methodLabels[deliveryMethod]}\n` +
      (notes ? `📝 *Instrucciones:* ${notes}\n` : '') +
      `\n🛍️ *Detalle del Pedido:*\n${itemsList}\n` +
      `💵 *TOTAL A PAGAR:* $${total} COP\n\n` +
      `¿Podrían confirmarme el tiempo estimado de preparación en barra? Gracias.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  private async fetchOrders() {
    if (!this.fb.firestore) return;
    try {
      const snap = await getDocs(collection(this.fb.firestore, 'orders'));
      if (!snap.empty) {
        const loaded: Order[] = [];
        snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Order) }));
        this.orders.set(loaded);
      }
    } catch (e) {
      console.warn('Orders fallback to defaults:', e);
    }
  }

  public addToCart(product: Product, quantity: number = 1) {
    if (product.stock <= 0) {
      this.notify.warning('Este producto no tiene existencias por el momento');
      return;
    }

    this.cart.update(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) {
        return current.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { product, quantity }];
    });

    this.notify.success(`+${quantity} "${product.name}" al carrito`, 'Carrito Nocturna');
  }

  public updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cart.update(list =>
      list.map(item => item.product.id === productId ? { ...item, quantity } : item)
    );
  }

  public removeFromCart(productId: string) {
    this.cart.update(list => list.filter(item => item.product.id !== productId));
    this.notify.info('Producto removido del pedido');
  }

  public clearCart() {
    this.cart.set([]);
  }

  public async checkout(deliveryMethod: DeliveryMethod, tableNumber?: string, notes?: string): Promise<Order | null> {
    const items = this.cart();
    if (!items.length) {
      this.notify.warning('El carrito está vacío');
      return null;
    }

    const user = this.auth.userProfile();
    const newOrder: Order = {
      id: 'ord-' + Date.now().toString().slice(-6),
      userId: user?.uid || 'user-guest',
      userEmail: user?.email || 'cliente@nocturna.club',
      userName: user?.name || 'Cliente de Bar',
      items: [...items],
      total: this.cartTotal(),
      status: 'PENDING',
      deliveryMethod,
      tableNumber: tableNumber || (deliveryMethod === 'TABLE' ? 'Mesa General' : undefined),
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    if (this.fb.firestore) {
      try {
        const ref = await addDoc(collection(this.fb.firestore, 'orders'), newOrder);
        newOrder.id = ref.id;
      } catch (err) {
        console.warn('Order sync fallback:', err);
      }
    }

    this.orders.update(list => [newOrder, ...list]);
    this.clearCart();
    this.notify.success(`¡Pedido #${newOrder.id} enviado a la barra! Preparando tu orden.`);
    return newOrder;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (this.fb.firestore) {
      try {
        await updateDoc(doc(this.fb.firestore, 'orders', orderId), { status });
      } catch (e) {
        console.warn('Update order status fallback:', e);
      }
    }
    this.orders.update(list =>
      list.map(ord => ord.id === orderId ? { ...ord, status } : ord)
    );
    this.notify.info(`Pedido #${orderId} actualizado a: ${status}`);
  }

  public async addProduct(product: Omit<Product, 'id'>) {
    const id = 'prod-' + Date.now();
    const newProd: Product = { ...product, id, createdAt: new Date().toISOString() };
    if (this.fb.firestore) {
      try {
        const docRef = doc(this.fb.firestore, 'products', id);
        await setDoc(docRef, newProd);
        this.notify.success(`Bebida / Producto "${newProd.name}" guardado en Cloud Firestore`);
      } catch (err) {
        this.fb.handleError(err, OperationType.CREATE, `products/${id}`);
      }
    } else {
      this.products.update(p => [newProd, ...p]);
      this.notify.success(`Producto "${newProd.name}" guardado localmente`);
    }
  }

  public async deleteProduct(productId?: string): Promise<void> {
    if (!productId) return;
    if (this.fb.firestore) {
      try {
        await deleteDoc(doc(this.fb.firestore, 'products', productId));
        this.notify.info('Bebida eliminada de Cloud Firestore');
      } catch (err) {
        this.fb.handleError(err, OperationType.DELETE, `products/${productId}`);
      }
    } else {
      this.products.update(list => list.filter(p => p.id !== productId));
      this.notify.info('Bebida eliminada localmente');
    }
  }

  /**
   * Elimina todas las bebidas y productos de la colección 'products' en Cloud Firestore
   */
  public async clearAllProductsFromFirestore(): Promise<void> {
    const count = this.products().length;
    if (count === 0) {
      this.notify.info('No hay bebidas para eliminar.');
      return;
    }

    this.userExplicitlyCleared = true;
    this.isLoading.set(true);
    if (this.fb.firestore) {
      try {
        const snap = await getDocs(collection(this.fb.firestore, 'products'));
        for (const d of snap.docs) {
          await deleteDoc(doc(this.fb.firestore, 'products', d.id));
        }
        this.products.set([]);
        this.isLoading.set(false);
        this.notify.warning('Se han eliminado todas las bebidas de la colección "products" en Firebase Firestore.');
      } catch (err) {
        this.isLoading.set(false);
        this.fb.handleError(err, OperationType.DELETE, 'products');
      }
    } else {
      this.products.set([]);
      this.isLoading.set(false);
      this.notify.warning('Catálogo de bebidas vaciado.');
    }
  }
}
