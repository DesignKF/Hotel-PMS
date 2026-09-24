# Security Specification: Moshi Urban Hostel PMS Firestore Rules

## 1. Data Invariants
1. **Default Deny**: Any document path not explicitly allowed is strictly inaccessible.
2. **Booking Integrity**:
   - Every booking must have a valid non-empty `roomId`, valid date format `checkIn` and `checkOut` (YYYY-MM-DD), and positive `stayTotalTZS`.
   - `bookingId` must conform to ID constraints (`isValidId`).
   - Terminal states (`Cancelled`, `Checked-out`, `Refunded`) cannot be arbitrarily manipulated once finalized without authorized staff credentials.
3. **Room Inventory Protection**:
   - Rooms can only be modified with strictly whitelisted keys (`name`, `roomCode`, `totalBeds`, `pricePerNightTZS`, etc.).
   - Room IDs must be valid alphanumeric IDs.
4. **Settings & Operational Config**:
   - Hostel settings can only be read by authenticated users, and written with valid setting schemas.
5. **Connection Test**:
   - `/test/{connectionId}` allows read access to verify database connectivity.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: An unauthenticated guest attempts to create `/bookings/b-hack-1`.
2. **Ghost Field / Shadow Update**: Creating a booking with unknown payload fields like `{ isSuperAdmin: true }`.
3. **ID Poisoning Attack**: An attacker requests a booking with an illegal 1000-character injection ID.
4. **Denial-of-Wallet Payload**: Creating a booking with a 500KB string in `specialRequests`.
5. **Price Manipulation**: Negative `stayTotalTZS` (e.g. -50000 TZS).
6. **Date Inversion**: Malformed date strings outside the YYYY-MM-DD pattern.
7. **Terminal State Bypass**: Mutating a finalized `Cancelled` or `Refunded` booking back to `Confirmed`.
8. **Direct Room Deletion without Auth**: Unauthenticated DELETE on `/rooms/R1`.
9. **Settings Overwrite**: Modifying hostel exchange rates with arbitrary non-numeric values.
10. **Root Traversal Probe**: Attempting read on `/{document=**}`.
11. **Spoofed User Context**: Write payload pretending to be an authorized staff user when not signed in.
12. **Malformed Room Inventory**: Injecting negative bed counts or corrupted room configurations.

## 3. Red Team Security Validation
All rules are audited against:
- Identity Spoofing
- State Shortcutting
- Resource Poisoning / Large payloads
- Master Gate & Schema Consistency
