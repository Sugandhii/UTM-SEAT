
const API_BASE_URL = 'http://localhost:3000/api';

// Page elements
const elements = {
    cafeteriaSelect: document.getElementById('cafeteriaSelect'),
    refreshBtn: document.getElementById('refreshBtn'),
    messageArea: document.getElementById('messageArea'),

    cafeteriaName: document.getElementById('cafeteriaName'),
    cafeteriaDescription: document.getElementById('cafeteriaDescription'),
    statusBadge: document.getElementById('statusBadge'),

    totalBooths: document.getElementById('totalBooths'),
    openBooths: document.getElementById('openBooths'),
    closedBooths: document.getElementById('closedBooths'),
    unknownBooths: document.getElementById('unknownBooths'),
    statusExplanation: document.getElementById('statusExplanation'),

    peakStatusBadge: document.getElementById('peakStatusBadge'),
    peakStatusTitle: document.getElementById('peakStatusTitle'),
    peakStatusDescription: document.getElementById('peakStatusDescription'),
    peakHourTableBody: document.getElementById('peakHourTableBody')
};

let cafeteriaData = [];


// ========================================
// API REQUEST
// ========================================

async function apiRequest(endpoint) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`);
    } catch (error) {
        throw new Error(
            'Cannot connect to backend. Please make sure the server is running.'
        );
    }

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error('The server returned an invalid response.');
    }

    if (!response.ok || result.success !== true) {
        throw new Error(
            result.message || `Request failed: HTTP ${response.status}`
        );
    }

    return result;
}


// ========================================
// MESSAGE
// ========================================

function showMessage(message, type = 'danger') {
    elements.messageArea.replaceChildren();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');

    alert.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');

    alert.appendChild(closeButton);
    elements.messageArea.appendChild(alert);
}

function clearMessage() {
    elements.messageArea.replaceChildren();
}


// ========================================
// FORMAT HELPERS
// ========================================

function formatStatus(status) {
    const labels = {
        open: 'Open',
        partially_open: 'Partially Open',
        closed: 'Closed',
        temporarily_closed: 'Temporarily Closed',
        unknown: 'Unknown'
    };

    return labels[status] || 'Unknown';
}

function formatTime(time) {
    if (!time) return '--:--';

    return String(time).slice(0, 5);
}

function isCurrentPeak(value) {
    return value === true || Number(value) === 1;
}

function getTodayNumber() {
    const day = new Date().getDay();

    // MySQL: Monday = 1, Sunday = 7
    return day === 0 ? 7 : day;
}


// ========================================
// 1. LOAD CAFETERIAS
// ========================================

async function loadCafeterias() {
    const response = await apiRequest('/cafeterias');

    cafeteriaData = Array.isArray(response.data)
        ? response.data
        : [];

    elements.cafeteriaSelect.replaceChildren();

    if (cafeteriaData.length === 0) {
        elements.cafeteriaSelect.add(
            new Option('No cafeterias available', '')
        );

        elements.cafeteriaSelect.disabled = true;
        throw new Error('No active cafeterias were found.');
    }

    cafeteriaData.forEach(cafeteria => {
        const option = new Option(
            cafeteria.cafeteria_name,
            cafeteria.cafeteria_id
        );

        elements.cafeteriaSelect.add(option);
    });

    elements.cafeteriaSelect.disabled = false;

    return Number(elements.cafeteriaSelect.value);
}


// ========================================
// 2. RENDER CAFETERIA STATUS
// ========================================

function renderCafeteriaStatus(cafeteria) {
    const status = cafeteria.operating_status || 'unknown';

    const total = Number(cafeteria.total_active_booths || 0);
    const open = Number(cafeteria.open_booths || 0);
    const closed = Number(cafeteria.closed_booths || 0);
    const unknown = Number(cafeteria.unknown_booths || 0);

    elements.cafeteriaName.textContent =
        cafeteria.cafeteria_name;

    elements.cafeteriaDescription.textContent =
        cafeteria.description || 'No description available.';

    elements.statusBadge.textContent = formatStatus(status);

    elements.statusBadge.className =
        `status-badge status-${status.replaceAll('_', '-')}`;

    elements.totalBooths.textContent = total;
    elements.openBooths.textContent = open;
    elements.closedBooths.textContent = closed;
    elements.unknownBooths.textContent = unknown;

    elements.statusExplanation.textContent =
        `${open} of ${total} active booths are currently open.`;
}


// ========================================
// 3. LOAD PEAK-HOUR SCHEDULE
// ========================================

async function loadPeakHours(cafeteriaId) {
    const response = await apiRequest(
        `/cafeterias/${cafeteriaId}/peak-hours`
    );

    renderPeakHours(response.data);
}


// ========================================
// 4. RENDER PEAK-HOUR INFORMATION
// ========================================

function renderPeakHours(peakHours) {
    elements.peakHourTableBody.replaceChildren();

    const schedules = Array.isArray(peakHours)
        ? peakHours
        : [];

    if (schedules.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 4;
        cell.className = 'text-center text-secondary';
        cell.textContent = 'No peak-hour schedules available.';

        row.appendChild(cell);
        elements.peakHourTableBody.appendChild(row);

        updatePeakStatus(null);
        return;
    }

    const currentSchedule = schedules.find(
        schedule => isCurrentPeak(schedule.is_current_peak)
    );

    updatePeakStatus(currentSchedule || null);

    const today = getTodayNumber();

    schedules.forEach(schedule => {
        const row = document.createElement('tr');

        const isToday = Number(schedule.day_of_week) === today;
        const isPeak = isCurrentPeak(schedule.is_current_peak);

        if (isToday) {
            row.classList.add('today-row');
        }

        // Day
        const dayCell = document.createElement('td');
        dayCell.className = 'fw-semibold';
        dayCell.textContent = schedule.day_name || 'Unknown';

        if (isToday) {
            const todayLabel = document.createElement('span');
            todayLabel.className = 'today-label';
            todayLabel.textContent = 'Today';

            dayCell.appendChild(todayLabel);
        }

        // Period
        const periodCell = document.createElement('td');
        periodCell.textContent = schedule.period_name || '-';

        // Time
        const timeCell = document.createElement('td');
        timeCell.textContent =
            `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`;

        // Status
        const statusCell = document.createElement('td');
        const statusLabel = document.createElement('span');

        statusLabel.className = isPeak
            ? 'schedule-status schedule-current'
            : 'schedule-status schedule-normal';

        statusLabel.textContent = isPeak
            ? '● Currently Peak'
            : (isToday ? 'Today’s Schedule' : 'Scheduled');

        statusCell.appendChild(statusLabel);

        row.append(
            dayCell,
            periodCell,
            timeCell,
            statusCell
        );

        elements.peakHourTableBody.appendChild(row);
    });
}


// ========================================
// 5. UPDATE CURRENT PEAK STATUS
// ========================================

function updatePeakStatus(currentSchedule) {
    if (currentSchedule) {
        elements.peakStatusBadge.textContent = 'Currently Peak Hour';

        elements.peakStatusBadge.className =
            'peak-badge peak-active';

        elements.peakStatusTitle.textContent =
            `${currentSchedule.period_name} is currently active`;

        elements.peakStatusDescription.textContent =
            `Scheduled period: ${formatTime(currentSchedule.start_time)} - ${formatTime(currentSchedule.end_time)}.`;

    } else {
        elements.peakStatusBadge.textContent = 'Normal Hours';

        elements.peakStatusBadge.className =
            'peak-badge peak-normal';

        elements.peakStatusTitle.textContent =
            'No active peak-hour period';

        elements.peakStatusDescription.textContent =
            'The cafeteria is currently outside its configured peak-hour schedule.';
    }
}


// ========================================
// 6. LOAD SELECTED CAFETERIA
// ========================================

async function loadSelectedCafeteria() {
    clearMessage();

    const cafeteriaId = Number(elements.cafeteriaSelect.value);

    const cafeteria = cafeteriaData.find(
        item => Number(item.cafeteria_id) === cafeteriaId
    );

    if (!cafeteria) {
        showMessage('Please select a valid cafeteria.');
        return;
    }

    renderCafeteriaStatus(cafeteria);

    // Reset peak-hour section while loading
    elements.peakStatusBadge.textContent = 'Loading...';
    elements.peakStatusTitle.textContent =
        'Loading peak-hour information...';

    try {
        await loadPeakHours(cafeteriaId);
    } catch (error) {
        elements.peakStatusBadge.textContent = 'Unavailable';
        elements.peakStatusTitle.textContent =
            'Peak-hour information unavailable';

        elements.peakStatusDescription.textContent = error.message;

        showMessage(error.message);
    }
}


// ========================================
// 7. REFRESH INFORMATION
// ========================================

async function refreshInformation() {
    const button = elements.refreshBtn;

    button.disabled = true;
    button.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';

    try {
        const previousId = Number(elements.cafeteriaSelect.value);

        await loadCafeterias();

        // Keep the currently selected cafeteria if it still exists
        const stillExists = cafeteriaData.some(
            cafeteria => Number(cafeteria.cafeteria_id) === previousId
        );

        if (stillExists) {
            elements.cafeteriaSelect.value = String(previousId);
        }

        await loadSelectedCafeteria();

    } catch (error) {
        showMessage(error.message);
    } finally {
        button.disabled = false;
        button.innerHTML =
            '<i class="bi bi-arrow-clockwise"></i> Refresh Information';
    }
}


// ========================================
// 8. INITIALIZE PAGE
// ========================================

async function initializePage() {
    elements.cafeteriaSelect.addEventListener(
        'change',
        loadSelectedCafeteria
    );

    elements.refreshBtn.addEventListener(
        'click',
        refreshInformation
    );

    try {
        await loadCafeterias();
        await loadSelectedCafeteria();

    } catch (error) {
        showMessage(error.message);
    }
}

initializePage();
