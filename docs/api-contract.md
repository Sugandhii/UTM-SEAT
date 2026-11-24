# UTM SE&AT – API Contract

Base URL (local): `http://localhost:3000`

All responses are JSON. Every response has a `success` field.
Error responses also have a `code` (for the app to check) and a `message` (for people to read):

```json
{ "success": false, "code": "SEAT_NOT_AVAILABLE", "message": "This seat is already held or booked." }
```

---

## Seat Management Subsystem

Owner: Muhammad Izdihar · Sprint 1 cards: IMP-03, IMP-04, IMP-05, TEST-02, TEST-03, TEST-04

> **Temporary (until User Management is ready):** the student is identified by `user_id`,
> sent in the JSON body for `POST` requests and as `?user_id=` for `GET` requests.
> Once login is available this will come from the logged-in user instead, and `user_id`
> will no longer be sent by the client.
>
> **GPS geofencing:** a student can hold a seat only when their device is within
> `geofence_radius` metres of the cafeteria. This is controlled by `GEOFENCE_ENABLED`
> in `.env`. Set it to `false` while developing away from campus: booking then skips
> the location check and `location_verified` is `false`.

### Seat statuses

| Status | Meaning |
|---|---|
| `available` | Free to book |
| `held` | A student has selected it and has a few minutes to confirm |
| `occupied` | Booking confirmed – a student is sitting there |
| `unavailable` | Taken out of use by an administrator |

### Booking statuses

| Status | Meaning |
|---|---|
| `held` | Seat is held, waiting for the student to confirm |
| `confirmed` | Student confirmed they are sitting at the seat |
| `cancelled` | Student cancelled the hold or booking |
| `released` | Hold expired before it was confirmed |
| `completed` | *(Sprint 2 – checkout)* |

### Booking rules

- A seat can have only **one** active hold or booking at a time.
- A student can have only **one** active hold or booking at a time.
- A hold expires after `HOLD_DURATION_MINUTES` (default **5**, set in `.env`). An expired hold becomes `released` and the seat is free again.
- A student can only confirm or cancel **their own** booking.
- When `GEOFENCE_ENABLED=true`, holding a seat requires `latitude` and `longitude` inside the cafeteria geofence.

---

### 1. Get seats of a cafeteria

`GET /api/cafeterias/:cafeteriaId/seats`

**Success – 200**

```json
{
  "success": true,
  "cafeteria": { "cafeteria_id": 1, "cafeteria_name": "Arked Meranti" },
  "summary": { "total": 12, "available": 9, "held": 1, "occupied": 1, "unavailable": 1 },
  "data": [
    { "seat_id": 1, "seat_number": "M01", "status": "held", "hold_seconds_left": 245 },
    { "seat_id": 2, "seat_number": "M02", "status": "available" },
    { "seat_id": 4, "seat_number": "M04", "status": "occupied" },
    { "seat_id": 12, "seat_number": "M12", "status": "unavailable" }
  ]
}
```

`hold_seconds_left` appears only for `held` seats.

**Errors**

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | `cafeteriaId` is not a positive number |
| 404 | `CAFETERIA_NOT_FOUND` | Cafeteria does not exist or is inactive |

---

### 2. Verify location

`POST /api/cafeterias/:cafeteriaId/verify-location`

Checks whether the student is inside the cafeteria geofence. The app calls this
before showing the booking buttons. The distance is always calculated, even when
`GEOFENCE_ENABLED=false`.

**Request body**

```json
{ "latitude": 1.5586, "longitude": 103.639 }
```

**Success – 200**

```json
{
  "success": true,
  "message": "You are inside Arked Meranti.",
  "data": {
    "cafeteria_id": 1,
    "cafeteria_name": "Arked Meranti",
    "within_geofence": true,
    "distance_meters": 44,
    "geofence_radius_meters": 100,
    "geofence_enabled": true,
    "can_book": true
  }
}
```

`can_book` is `true` when the student is inside, or when the geofence is switched off.

**Errors**

| HTTP | code | When |
|---|---|---|
| 400 | `LOCATION_REQUIRED` | `latitude` or `longitude` missing |
| 400 | `INVALID_INPUT` | Bad `cafeteriaId` or coordinates out of range |
| 404 | `CAFETERIA_NOT_FOUND` | Cafeteria does not exist or is inactive |
| 409 | `GEOFENCE_NOT_CONFIGURED` | Cafeteria has no coordinates |

---

### 3. Hold a seat

`POST /api/bookings/hold`

**Request body**

```json
{
  "user_id": 1,
  "seat_id": 2,
  "latitude": 1.5582,
  "longitude": 103.639
}
```

`latitude` and `longitude` are required when `GEOFENCE_ENABLED=true`, optional when it is `false`.

**Success – 201**

```json
{
  "success": true,
  "message": "Seat held for 5 minutes. Please confirm before the time runs out.",
  "data": {
    "booking_id": 7,
    "user_id": 1,
    "seat_id": 2,
    "seat_number": "M02",
    "cafeteria_id": 1,
    "cafeteria_name": "Arked Meranti",
    "booking_status": "held",
    "location_verified": false,
    "hold_expires_at": "2026-11-24T13:22:06.000Z",
    "hold_seconds_left": 300,
    "created_at": "2026-11-24T13:17:06.000Z",
    "updated_at": "2026-11-24T13:17:06.000Z"
  }
}
```

**Errors**

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | `user_id` / `seat_id` missing or not a number, or bad coordinates |
| 404 | `USER_NOT_FOUND` | User does not exist |
| 404 | `SEAT_NOT_FOUND` | Seat does not exist, or its cafeteria is inactive |
| 409 | `SEAT_NOT_AVAILABLE` | Seat is held, occupied or unavailable |
| 409 | `USER_HAS_ACTIVE_BOOKING` | The student already holds or booked another seat |
| 400 | `LOCATION_REQUIRED` | Geofence is on and no location was sent |
| 403 | `LOCATION_NOT_VERIFIED` | Geofence is on and the student is outside the cafeteria |
| 409 | `GEOFENCE_NOT_CONFIGURED` | Geofence is on and the cafeteria has no coordinates |

---

### 4. Confirm a held seat

`POST /api/bookings/:bookingId/confirm`

**Request body**

```json
{ "user_id": 1 }
```

**Success – 200** – same `data` shape as *Hold a seat*, with `"booking_status": "confirmed"`.
The seat now shows as `occupied`.

**Errors**

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | Bad `bookingId` or `user_id` |
| 403 | `NOT_YOUR_BOOKING` | Booking belongs to another student |
| 404 | `BOOKING_NOT_FOUND` | Booking does not exist |
| 409 | `HOLD_EXPIRED` | The hold time ran out – hold the seat again |
| 409 | `INVALID_BOOKING_STATUS` | Booking is not `held` (already confirmed, cancelled, …) |

---

### 5. Cancel a booking

`POST /api/bookings/:bookingId/cancel`

Works for `held` and `confirmed` bookings. The seat becomes `available` again.

**Request body**

```json
{ "user_id": 1 }
```

**Success – 200** – same `data` shape, with `"booking_status": "cancelled"`.

**Errors** – same as *Confirm*, except `HOLD_EXPIRED`.

---

### 6. Get the student's current booking

`GET /api/bookings/active?user_id=1`

**Success – 200**

```json
{ "success": true, "data": { "booking_id": 7, "booking_status": "held", "...": "..." } }
```

`data` is `null` when the student has no active booking.

**Errors**

| HTTP | code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | `user_id` missing or not a number |
