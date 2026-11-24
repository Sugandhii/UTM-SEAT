// =====================================================
// UTM SE&AT – Seat Management page (seats.html)
// Owner: Muhammad Izdihar
//
// What this page does:
//   1. Lists cafeterias and shows the seats of the chosen one
//   2. Refreshes the seats every few seconds ("real-time")
//   3. Checks the student's GPS location (browser Geolocation API)
//   4. Lets the student hold, confirm and cancel a seat
// =====================================================

// ---------- Settings ----------
const API_BASE_URL = 'http://localhost:3000/api';
const REFRESH_INTERVAL_MS = 10000;   // refresh seats every 10 seconds

// ---------- Page state (everything the page currently knows) ----------
const state = {
    cafeteriaId: null,
    seats: [],
    location: null,          // { latitude, longitude, result } after verifying
    activeBooking: null,     // the student's current held/confirmed booking
    holdSeat: null,          // seat chosen in the popup
    holdExpiresAt: null,     // time (ms) when the current hold ends
    countdownTimer: null,
    refreshTimer: null,
    busy: false              // true while a booking request is running
};

// ---------- Shortcuts to page elements ----------
const el = {
    testUserSelect: document.getElementById('testUserSelect'),
    messageArea: document.getElementById('messageArea'),
    cafeteriaSelect: document.getElementById('cafeteriaSelect'),
    locationIcon: document.getElementById('locationIcon'),
    locationTitle: document.getElementById('locationTitle'),
    locationText: document.getElementById('locationText'),
    verifyLocationBtn: document.getElementById('verifyLocationBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    lastUpdated: document.getElementById('lastUpdated'),
    summary: document.getElementById('summary'),
    seatGrid: document.getElementById('seatGrid'),
    seatHint: document.getElementById('seatHint'),
    bookingBar: document.getElementById('bookingBar'),
    bookingSeatBadge: document.getElementById('bookingSeatBadge'),
    bookingTitle: document.getElementById('bookingTitle'),
    bookingText: document.getElementById('bookingText'),
    confirmBtn: document.getElementById('confirmBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    holdSeatNumber: document.getElementById('holdSeatNumber'),
    holdConfirmBtn: document.getElementById('holdConfirmBtn')
};

const holdModal = new bootstrap.Modal(document.getElementById('holdModal'));


// =====================================================
// TEMPORARY: current student
// Login (User Management) is not ready, so the student is picked from
// the "Student 1 / Student 2" menu in the header.
// When login is ready, change ONLY this function, e.g. read the
// logged-in user's id from the login token.
// =====================================================
function getCurrentUserId() {
    return Number(el.testUserSelect.value);
}

function setupTestUser() {
    try {
        const saved = localStorage.getItem('utmseat_test_user_id');
        if (saved) el.testUserSelect.value = saved;
    } catch (error) {
        // Storage not available: just use the default
    }

    el.testUserSelect.addEventListener('change', async () => {
        try {
            localStorage.setItem('utmseat_test_user_id', el.testUserSelect.value);
        } catch (error) {
            // ignore
        }
        clearMessages();
        await loadActiveBooking();
        await loadSeats();
    });
}


// =====================================================
// Talking to the backend
// =====================================================
class ApiError extends Error {
    constructor(code, message, status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

// Sends a request to the backend and returns the JSON.
// Throws an ApiError with the server's code and message when it fails.
async function api(path, { method = 'GET', body } = {}) {
    let response;

    try {
        response = await fetch(API_BASE_URL + path, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (error) {
        throw new ApiError(
            'NETWORK_ERROR',
            'Cannot reach the server. Make sure the backend is running (npx nodemon src/server.js).'
        );
    }

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // Not JSON (e.g. a 404 page)
    }

    if (!response.ok || !data || data.success !== true) {
        throw new ApiError(
            data?.code || `HTTP_${response.status}`,
            data?.message || `Request failed (${response.status}).`,
            response.status
        );
    }

    return data;
}


// =====================================================
// Messages
// =====================================================
function showMessage(text, type = 'danger') {
    clearMessages();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    alert.textContent = text;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.setAttribute('data-bs-dismiss', 'alert');
    close.setAttribute('aria-label', 'Close');
    alert.appendChild(close);

    el.messageArea.appendChild(alert);

    // Success messages disappear by themselves
    if (type === 'success') {
        setTimeout(() => alert.remove(), 5000);
    }
}

function clearMessages() {
    el.messageArea.innerHTML = '';
}


// =====================================================
// 1. Cafeterias
// =====================================================
async function loadCafeterias() {
    let cafeterias = [];

    try {
        // Cafeteria list from the Cafeteria Information module (Achmad)
        const response = await api('/cafeterias');
        cafeterias = response.data;
    } catch (error) {
        // That module is not merged into this branch yet. Fallback:
        // find cafeterias by asking the seats endpoint for ids 1-10.
        cafeterias = await findCafeteriasFromSeats();
    }

    el.cafeteriaSelect.innerHTML = '';

    if (cafeterias.length === 0) {
        const option = new Option('No cafeterias found', '');
        el.cafeteriaSelect.add(option);
        showMessage('No cafeterias found. Did you run database/seed.sql and start the backend?');
        return;
    }

    cafeterias.forEach((cafeteria) => {
        el.cafeteriaSelect.add(new Option(cafeteria.cafeteria_name, cafeteria.cafeteria_id));
    });

    // Another page can open this one as seats.html?cafeteria_id=2
    const fromUrl = new URLSearchParams(window.location.search).get('cafeteria_id');
    const exists = cafeterias.some((c) => String(c.cafeteria_id) === fromUrl);
    el.cafeteriaSelect.value = exists ? fromUrl : String(cafeterias[0].cafeteria_id);

    state.cafeteriaId = Number(el.cafeteriaSelect.value);
}

async function findCafeteriasFromSeats() {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = await Promise.all(
        ids.map((id) =>
            api(`/cafeterias/${id}/seats`)
                .then((response) => response.cafeteria)
                .catch((error) => {
                    if (error.code === 'NETWORK_ERROR') throw error;
                    return null;
                })
        )
    );

    return results.filter(Boolean);
}

function onCafeteriaChange() {
    state.cafeteriaId = Number(el.cafeteriaSelect.value);

    // Keep the choice in the address bar (useful for sharing / refresh)
    const url = new URL(window.location.href);
    url.searchParams.set('cafeteria_id', state.cafeteriaId);
    window.history.replaceState(null, '', url);

    // A location check belongs to one cafeteria: check again
    resetLocation();
    clearMessages();
    loadSeats();
}


// =====================================================
// 2. Location (GPS)
// =====================================================
function setLocationView(iconState, icon, title, text) {
    el.locationIcon.className = `location-icon state-${iconState}`;
    el.locationIcon.innerHTML = `<i class="bi ${icon}"></i>`;
    el.locationTitle.textContent = title;
    el.locationText.textContent = text;
}

function resetLocation() {
    state.location = null;
    el.verifyLocationBtn.disabled = false;
    el.verifyLocationBtn.innerHTML = '<i class="bi bi-crosshair"></i> Verify my location';
    setLocationView(
        'unknown',
        'bi-geo-alt',
        'Location not checked',
        'You can only book a seat when you are inside the cafeteria.'
    );
}

// Asks the browser for the device position (shows a permission popup).
function getBrowserPosition() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Your browser does not support location.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => {
                const messages = {
                    1: 'Location permission was denied. Allow location for this site in your browser settings, then try again.',
                    2: 'Your location is not available. Turn on location services on your device and try again.',
                    3: 'Getting your location took too long. Please try again.'
                };
                reject(new Error(messages[error.code] || 'Could not get your location.'));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
}

async function verifyLocation() {
    if (!state.cafeteriaId) return;

    el.verifyLocationBtn.disabled = true;
    setLocationView('checking', 'bi-hourglass-split', 'Checking your location…', 'Please allow location access if your browser asks.');

    try {
        const coords = await getBrowserPosition();

        const response = await api(`/cafeterias/${state.cafeteriaId}/verify-location`, {
            method: 'POST',
            body: { latitude: coords.latitude, longitude: coords.longitude }
        });

        const result = response.data;

        state.location = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            result
        };

        if (result.within_geofence) {
            setLocationView('inside', 'bi-check-circle-fill', `You are at ${result.cafeteria_name}`, 'You can now choose a seat.');
        } else if (!result.geofence_enabled) {
            setLocationView(
                'dev',
                'bi-tools',
                'Development mode – location check is off',
                `You are ${formatDistance(result.distance_meters)} away, but booking is allowed because GEOFENCE_ENABLED=false.`
            );
        } else {
            setLocationView(
                'outside',
                'bi-x-circle-fill',
                'You are outside the cafeteria',
                `You are ${formatDistance(result.distance_meters)} away. Move within ${result.geofence_radius_meters} m and check again.`
            );
        }
    } catch (error) {
        state.location = null;
        setLocationView('outside', 'bi-exclamation-triangle-fill', 'Location could not be verified', error.message);
    } finally {
        el.verifyLocationBtn.disabled = false;
        el.verifyLocationBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Check again';
        renderSeats();
    }
}

function canBookHere() {
    return Boolean(state.location && state.location.result.can_book);
}

function formatDistance(meters) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}


// =====================================================
// 3. Seats
// =====================================================
async function loadSeats() {
    if (!state.cafeteriaId) return;

    try {
        const response = await api(`/cafeterias/${state.cafeteriaId}/seats`);
        state.seats = response.data;
        renderSummary(response.summary);
        renderSeats();
        el.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch (error) {
        showMessage(error.message);
    }
}

function renderSummary(summary) {
    const items = [
        ['Available', summary.available, 'var(--seat-available)'],
        ['Held', summary.held, 'var(--seat-held)'],
        ['Occupied', summary.occupied, 'var(--seat-occupied)'],
        ['Total', summary.total, 'inherit']
    ];

    el.summary.innerHTML = items.map(([label, number, color]) => `
        <div class="summary-item">
            <div class="summary-number" style="color:${color}">${number}</div>
            <div class="summary-label">${label}</div>
        </div>
    `).join('');
}

const STATUS_ICONS = {
    available: 'bi-check-lg',
    held: 'bi-clock',
    occupied: 'bi-person-fill',
    unavailable: 'bi-slash-circle',
    mine: 'bi-star-fill'
};

function renderSeats() {
    el.seatGrid.innerHTML = '';

    const mySeatId = state.activeBooking ? state.activeBooking.seat_id : null;
    const canPick = canBookHere() && !state.activeBooking;

    state.seats.forEach((seat) => {
        const isMine = seat.seat_id === mySeatId;
        const status = isMine ? 'mine' : seat.status;
        const clickable = canPick && seat.status === 'available';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `seat status-${status}${clickable ? ' clickable' : ''}`;
        button.disabled = !clickable;
        button.setAttribute('aria-label', `Seat ${seat.seat_number}, ${isMine ? 'your seat' : seat.status}`);
        button.innerHTML = `<span>${seat.seat_number}</span><i class="bi ${STATUS_ICONS[status]}"></i>`;

        if (clickable) {
            button.addEventListener('click', () => openHoldPopup(seat));
        }

        el.seatGrid.appendChild(button);
    });

    el.seatHint.textContent = getSeatHint();
}

// Short sentence under the grid telling the student what to do next.
function getSeatHint() {
    if (state.activeBooking) {
        return 'You already have a seat. Cancel it first if you want a different one.';
    }
    if (!state.location) {
        return 'Verify your location to start choosing a seat.';
    }
    if (!canBookHere()) {
        return 'You can choose a seat once you are inside the cafeteria.';
    }
    if (!state.seats.some((seat) => seat.status === 'available')) {
        return 'No seats are free right now. This page updates automatically.';
    }
    return 'Tap a green seat to hold it.';
}


// =====================================================
// 4. Booking: hold, confirm, cancel
// =====================================================
function openHoldPopup(seat) {
    state.holdSeat = seat;
    el.holdSeatNumber.textContent = seat.seat_number;
    holdModal.show();
}

async function holdSelectedSeat() {
    if (!state.holdSeat || state.busy) return;

    state.busy = true;
    el.holdConfirmBtn.disabled = true;

    try {
        const response = await api('/bookings/hold', {
            method: 'POST',
            body: {
                user_id: getCurrentUserId(),
                seat_id: state.holdSeat.seat_id,
                latitude: state.location?.latitude,
                longitude: state.location?.longitude
            }
        });

        holdModal.hide();
        setActiveBooking(response.data);
        showMessage(response.message, 'success');
    } catch (error) {
        holdModal.hide();
        showMessage(error.message);

        if (error.code === 'LOCATION_NOT_VERIFIED' || error.code === 'LOCATION_REQUIRED') {
            resetLocation();
        }
        if (error.code === 'USER_HAS_ACTIVE_BOOKING') {
            await loadActiveBooking();
        }
    } finally {
        state.busy = false;
        el.holdConfirmBtn.disabled = false;
        state.holdSeat = null;
        await loadSeats();
    }
}

async function confirmBooking() {
    if (!state.activeBooking || state.busy) return;

    state.busy = true;
    el.confirmBtn.disabled = true;

    try {
        const response = await api(`/bookings/${state.activeBooking.booking_id}/confirm`, {
            method: 'POST',
            body: { user_id: getCurrentUserId() }
        });

        setActiveBooking(response.data);
        showMessage(response.message, 'success');
    } catch (error) {
        showMessage(error.message);
        await loadActiveBooking();
    } finally {
        state.busy = false;
        el.confirmBtn.disabled = false;
        await loadSeats();
    }
}

async function cancelBooking() {
    if (!state.activeBooking || state.busy) return;

    const isConfirmed = state.activeBooking.booking_status === 'confirmed';
    const question = isConfirmed
        ? `Leave seat ${state.activeBooking.seat_number}? It will become available to others.`
        : `Cancel your hold on seat ${state.activeBooking.seat_number}?`;

    if (!window.confirm(question)) return;

    state.busy = true;
    el.cancelBtn.disabled = true;

    try {
        await api(`/bookings/${state.activeBooking.booking_id}/cancel`, {
            method: 'POST',
            body: { user_id: getCurrentUserId() }
        });

        setActiveBooking(null);
        showMessage(isConfirmed ? 'Seat released. Thank you!' : 'Hold cancelled.', 'success');
    } catch (error) {
        showMessage(error.message);
        await loadActiveBooking();
    } finally {
        state.busy = false;
        el.cancelBtn.disabled = false;
        await loadSeats();
    }
}

async function loadActiveBooking() {
    try {
        const response = await api(`/bookings/active?user_id=${getCurrentUserId()}`);
        setActiveBooking(response.data);
    } catch (error) {
        showMessage(error.message);
    }
}


// =====================================================
// 5. Booking bar at the bottom + countdown
// =====================================================
function setActiveBooking(booking) {
    state.activeBooking = booking;

    stopCountdown();

    if (booking && booking.booking_status === 'held') {
        // Count down from what the server says, not the computer clock
        state.holdExpiresAt = Date.now() + booking.hold_seconds_left * 1000;
        startCountdown();
    }

    renderBookingBar();
    renderSeats();
}

function renderBookingBar() {
    const booking = state.activeBooking;

    if (!booking) {
        el.bookingBar.classList.add('d-none');
        return;
    }

    el.bookingBar.classList.remove('d-none');
    el.bookingSeatBadge.textContent = booking.seat_number;

    if (booking.booking_status === 'held') {
        el.bookingSeatBadge.classList.add('is-held');
        el.bookingTitle.textContent = `Seat ${booking.seat_number} is held for you`;
        el.confirmBtn.classList.remove('d-none');
        el.cancelBtn.textContent = 'Cancel';
        updateCountdownText();
    } else {
        el.bookingSeatBadge.classList.remove('is-held');
        el.bookingTitle.textContent = `You are seated at ${booking.seat_number}`;
        el.bookingText.textContent = `${booking.cafeteria_name} · Enjoy your meal!`;
        el.confirmBtn.classList.add('d-none');
        el.cancelBtn.textContent = 'Leave seat';
    }
}

function startCountdown() {
    state.countdownTimer = setInterval(updateCountdownText, 1000);
}

function stopCountdown() {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
}

function updateCountdownText() {
    const booking = state.activeBooking;
    if (!booking || booking.booking_status !== 'held') return;

    const secondsLeft = Math.max(0, Math.round((state.holdExpiresAt - Date.now()) / 1000));
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, '0');
    const urgent = secondsLeft <= 60 ? ' is-urgent' : '';

    el.bookingText.innerHTML = '';
    el.bookingText.append(`${booking.cafeteria_name} · Confirm within `);
    const time = document.createElement('span');
    time.className = `countdown${urgent}`;
    time.textContent = `${minutes}:${seconds}`;
    el.bookingText.appendChild(time);

    if (secondsLeft === 0) {
        stopCountdown();
        showMessage(`Your hold on seat ${booking.seat_number} has expired. You can hold a seat again.`, 'warning');
        setActiveBooking(null);
        loadSeats();
    }
}


// =====================================================
// 6. Automatic refresh ("real-time" seats)
// =====================================================
function startAutoRefresh() {
    clearInterval(state.refreshTimer);

    state.refreshTimer = setInterval(() => {
        // Do not refresh while the tab is hidden or a request is running
        if (document.hidden || state.busy) return;
        loadSeats();
    }, REFRESH_INTERVAL_MS);

    // Refresh straight away when the student comes back to the tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadSeats();
            loadActiveBooking();
        }
    });
}


// =====================================================
// Start
// =====================================================
async function init() {
    setupTestUser();
    resetLocation();

    el.cafeteriaSelect.addEventListener('change', onCafeteriaChange);
    el.verifyLocationBtn.addEventListener('click', verifyLocation);
    el.refreshBtn.addEventListener('click', loadSeats);
    el.holdConfirmBtn.addEventListener('click', holdSelectedSeat);
    el.confirmBtn.addEventListener('click', confirmBooking);
    el.cancelBtn.addEventListener('click', cancelBooking);

    try {
        await loadCafeterias();
    } catch (error) {
        el.cafeteriaSelect.innerHTML = '<option value="">Server not reachable</option>';
        showMessage(error.message);
        return;
    }

    await loadActiveBooking();
    await loadSeats();
    startAutoRefresh();
}

init();
