export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  table_number?: number | null;
  special_requests?: string | null;
  payment_slip_url?: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationInput {
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  table_number?: number;
  special_requests?: string;
  payment_slip_url?: string;
}

export interface UpdateReservationInput {
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  table_number?: number;
  special_requests?: string;
  payment_slip_url?: string;
  status?: ReservationStatus;
}

// Supabase Database type (for typed queries)
export interface Database {
  public: {
    Tables: {
      reservations: {
        Row: Reservation;
        Insert: CreateReservationInput & { status?: ReservationStatus };
        Update: UpdateReservationInput;
      };
    };
  };
}
