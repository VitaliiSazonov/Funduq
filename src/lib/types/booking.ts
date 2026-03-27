// ─────────────────────────────────────────────────────────────
// Shared Booking Types — used across actions, components, and pages
// ─────────────────────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;   // ISO date string (YYYY-MM-DD)
  check_out: string;  // ISO date string (YYYY-MM-DD)
  total_guests: number;
  status: BookingStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

/** Booking row joined with property info (for guest dashboard) */
export interface BookingWithProperty extends Booking {
  property: {
    id: string;
    title: string;
    location_emirate: string;
    location_district: string;
    main_image_url: string | null;
    type: string;
  };
}

/** Booking row joined with guest info (for host dashboard) */
export interface BookingWithGuest extends Booking {
  guest: {
    email: string;
  };
  property: {
    id: string;
    title: string;
  };
}

/** Owner contact info — revealed only when booking is confirmed */
export interface OwnerContact {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}
