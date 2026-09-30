export interface Bar {
  id?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  imageUrl: string;
  musicGenre: string;
  capacity: number;
  rating: number;
  openingHours: string;
  ownerId?: string;
  active: boolean;
  features?: string[];
  galleryUrls?: string[];
  schedule?: { day: string; hours: string; isOpen?: boolean }[];
  mapUrl?: string;
  dressCode?: string;
  minAge?: number;
  createdAt?: string;
}

export interface BarEvent {
  id?: string;
  barId: string;
  barName: string;
  title: string;
  description: string;
  date: string;
  time: string;
  coverPrice: number;
  ticketStock: number;
  imageUrl: string;
  active: boolean;
  djOrArtist?: string;
  createdAt?: string;
}
