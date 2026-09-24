import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { Booking, CalendarEvent } from '../types';
import { auth } from './firebase';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events'
];

const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const onGoogleAuthStateChanged = (
  callback: (user: User | null, token: string | null) => void,
  onTokenExpired?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        callback(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onTokenExpired) onTokenExpired();
      }
    } else {
      cachedAccessToken = null;
      if (onTokenExpired) onTokenExpired();
    }
  });
};

export const signInWithGoogleForCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Calendar access token');
    }
    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (err: any) {
    console.error('Google sign-in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const fetchCalendarEvents = async (
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100'
  });
  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Google Calendar fetch failed: ${res.statusText}`);
  }

  const data = await res.json();
  return (data.items || []) as CalendarEvent[];
};

export const syncBookingToGoogleCalendar = async (
  accessToken: string,
  booking: Booking
): Promise<CalendarEvent> => {
  const eventBody = {
    summary: `[Moshi Urban] ${booking.id}: ${booking.guestName} (${booking.roomName})`,
    location: 'Moshi Urban Hostel, Moshi, Kilimanjaro, Tanzania',
    description: [
      `Hostel Booking ID: ${booking.id}`,
      `Guest Name: ${booking.guestName} (Guest ID: ${booking.guestId})`,
      `Assigned Room: ${booking.roomName} (${booking.roomId})`,
      `Status: ${booking.status}`,
      `Guests / Beds: ${booking.guestsCount}`,
      `Stay Duration: ${booking.nights} night(s)`,
      `Total Stay: TZS ${booking.stayTotalTZS.toLocaleString()} (~$${booking.stayTotalUSD} USD)`,
      `Payment Status: ${booking.paymentStatus} (${booking.paymentMethod === 'mobile_money' || booking.paymentMethod === 'mpesa' ? 'Mobile Money' : booking.paymentMethod === 'front_desk' ? 'Pay at Desk' : booking.paymentMethod === 'card' ? 'Credit Card' : booking.paymentMethod})`,
      `Balance Due: TZS ${booking.balanceDueTZS.toLocaleString()}`,
      `Phone/WhatsApp: ${booking.phone}`,
      `Email: ${booking.email}`,
      booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : ''
    ].filter(Boolean).join('\n'),
    start: {
      date: booking.checkIn // All-day reservation block
    },
    end: {
      date: booking.checkOut
    }
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody)
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create event in Google Calendar: ${res.statusText}`);
  }

  return (await res.json()) as CalendarEvent;
};

export const deleteCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to delete calendar event: ${res.statusText}`);
  }
};
