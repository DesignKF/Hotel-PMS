import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseError';
import { Booking, Room, ExchangeRates } from '../types';

const BOOKINGS_PATH = 'bookings';
const ROOMS_PATH = 'rooms';
const SETTINGS_PATH = 'settings';

export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${BOOKINGS_PATH}/${booking.id}`;
  try {
    const data: Record<string, unknown> = {
      guestName: booking.guestName,
      roomId: booking.roomId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      stayTotalTZS: Number(booking.stayTotalTZS) || 0
    };

    if (booking.id) data.id = booking.id;
    if (booking.guestId) data.guestId = booking.guestId;
    if (booking.email) data.email = booking.email;
    if (booking.phone) data.phone = booking.phone;
    if (booking.roomName) data.roomName = booking.roomName;
    if (booking.roomCode) data.roomCode = booking.roomCode;
    if (booking.nights) data.nights = Number(booking.nights);
    if (booking.guestsCount) data.guestsCount = Number(booking.guestsCount);
    if (booking.platform) data.platform = booking.platform;
    if (booking.stayTotalUSD !== undefined) data.stayTotalUSD = Number(booking.stayTotalUSD);
    if (booking.depositPaidTZS !== undefined) data.depositPaidTZS = Number(booking.depositPaidTZS);
    if (booking.balanceDueTZS !== undefined) data.balanceDueTZS = Number(booking.balanceDueTZS);
    if (booking.paymentMethod) data.paymentMethod = booking.paymentMethod;
    if (booking.paymentStatus) data.paymentStatus = booking.paymentStatus;
    if (booking.specialRequests) data.specialRequests = booking.specialRequests.slice(0, 500);
    if (booking.createdAt) data.createdAt = booking.createdAt;
    data.updatedAt = new Date().toISOString();

    await setDoc(doc(db, BOOKINGS_PATH, booking.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBookingFromFirestore(bookingId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${BOOKINGS_PATH}/${bookingId}`;
  try {
    await deleteDoc(doc(db, BOOKINGS_PATH, bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToBookings(
  onData: (bookings: Booking[]) => void,
  onError?: (error: unknown) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const q = query(collection(db, BOOKINGS_PATH));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Booking[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Booking, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, BOOKINGS_PATH);
    }
  );
}

export async function saveRoomToFirestore(room: Room): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${ROOMS_PATH}/${room.id}`;
  try {
    const data: Record<string, unknown> = {
      name: room.name,
      roomCode: room.roomCode,
      type: room.type,
      totalBeds: Number(room.totalBeds) || 1,
      pricePerNightTZS: Number(room.pricePerNightTZS) || 0
    };

    if (room.id) data.id = room.id;
    if (room.pricePerNightUSD !== undefined) data.pricePerNightUSD = Number(room.pricePerNightUSD);
    if (room.singleBeds !== undefined) data.singleBeds = Number(room.singleBeds);
    if (room.bunkBeds !== undefined) data.bunkBeds = Number(room.bunkBeds);
    if (room.bathroom) data.bathroom = room.bathroom.slice(0, 100);
    if (room.description) data.description = room.description.slice(0, 500);
    if (room.tagline) data.tagline = room.tagline.slice(0, 100);

    await setDoc(doc(db, ROOMS_PATH, room.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToRooms(
  onData: (rooms: Room[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(collection(db, ROOMS_PATH));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Room[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Room, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, ROOMS_PATH);
    }
  );
}

export async function saveSettingsToFirestore(rates: ExchangeRates, basePriceTZS: number): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${SETTINGS_PATH}/general`;
  try {
    await setDoc(
      doc(db, SETTINGS_PATH, 'general'),
      {
        basePricePerNightTZS: basePriceTZS,
        currency: 'TZS',
        rates,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
