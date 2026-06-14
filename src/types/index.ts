export interface Pin {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  title: string;
  body: string;
  color: string;
  created_at: string;
  updated_at: string;
  images?: Image[];
}

export interface Image {
  id: string;
  pin_id: string;
  storage_path: string;
  url: string;
  order_index: number;
  uploaded_at: string;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
