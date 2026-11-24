// Dummy data for Sprint 1 (interface only). Backend will replace this later.
const cafeNames = ["Cafe Kolej Tun Fatimah", "Cafe Kolej Tun Razak", "Cafe Fakulti Komputeran"];

const history = [
  { id: "BK001", date: "2026-11-24", student: "Ali Hassan (A24CS1001)", cafe: cafeNames[0], seat: "A12", time: "12:00 - 13:00", status: "Active" },
  { id: "BK002", date: "2026-11-24", student: "Nur Aina (A24CS1002)", cafe: cafeNames[1], seat: "B03", time: "12:30 - 13:30", status: "Active" },
  { id: "BK003", date: "2026-11-24", student: "Chong Wei (A24CS1003)", cafe: cafeNames[2], seat: "C07", time: "11:00 - 12:00", status: "Completed" },
  { id: "BK004", date: "2026-11-23", student: "Siti Sarah (A24CS1004)", cafe: cafeNames[0], seat: "A20", time: "13:00 - 14:00", status: "Cancelled" },
  { id: "BK005", date: "2026-11-23", student: "Muthu Raj (A24CS1005)", cafe: cafeNames[1], seat: "D05", time: "12:00 - 13:00", status: "Completed" },
  { id: "BK006", date: "2026-11-22", student: "Aisyah Rahman (A24CS1006)", cafe: cafeNames[0], seat: "B11", time: "08:00 - 09:00", status: "Completed" },
  { id: "BK007", date: "2026-11-21", student: "Daniel Lim (A24CS1007)", cafe: cafeNames[2], seat: "A02", time: "14:00 - 15:00", status: "Completed" },
  { id: "BK008", date: "2026-11-20", student: "Farah Nadia (A24CS1008)", cafe: cafeNames[1], seat: "C15", time: "18:00 - 19:00", status: "Cancelled" },
  { id: "BK009", date: "2026-11-19", student: "Hafiz Azmi (A24CS1009)", cafe: cafeNames[0], seat: "E04", time: "12:00 - 13:00", status: "Completed" },
  { id: "BK010", date: "2026-11-18", student: "Priya Nair (A24CS1010)", cafe: cafeNames[0], seat: "F08", time: "19:00 - 20:00", status: "Completed" },
];

/* ---------------- BOOKING HISTORY PAGE ---------------- */
function getFiltered() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;
  const cafe = document.getElementById("cafeFilter").value;
  const status = document.getElementById("statusFilter").value;

  return history.filter(b =>
    b.student.toLowerCase().includes(keyword) &&
    (!from || b.date >= from) &&
    (!to || b.date <= to) &&
    (cafe === "all" || b.cafe === cafe) &&
    (status === "all" || b.status === status)
  );
}

function renderHistory() {
  const rows = getFiltered();
  const tbody = document.getElementById("historyTable");

  document.getElementById("sTotal").textContent = rows.length;
  document.getElementById("sCompleted").textContent = rows.filter(b => b.status === "Completed").length;
  document.getElementById("sActive").textContent = rows.filter(b => b.status === "Active").length;
  document.getElementById("sCancelled").textContent = rows.filter(b => b.status === "Cancelled").length;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No bookings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.date}</td>
      <td>${b.student}</td>
      <td>${b.cafe}</td>
      <td>${b.seat}</td>
      <td>${b.time}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
    </tr>`).join("");
}

function exportCSV() {
  const rows = getFiltered();
  const header = ["Booking ID", "Date", "Student", "Cafeteria", "Seat", "Time", "Status"];
  const lines = rows.map(b =>
    [b.id, b.date, b.student, b.cafe, b.seat, b.time, b.status].map(v => `"${v}"`).join(","));
  const csv = [header.join(","), ...lines].join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "booking-history.csv";
  link.click();
}

function initHistoryPage() {
  const cafeFilter = document.getElementById("cafeFilter");
  cafeFilter.innerHTML = `<option value="all">All cafeterias</option>` +
    cafeNames.map(n => `<option value="${n}">${n}</option>`).join("");

  ["searchInput", "dateFrom", "dateTo", "cafeFilter", "statusFilter"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderHistory);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("dateFrom").value = "";
    document.getElementById("dateTo").value = "";
    cafeFilter.value = "all";
    document.getElementById("statusFilter").value = "all";
    renderHistory();
  });

  document.getElementById("exportBtn").addEventListener("click", exportCSV);
  renderHistory();
}

/* ---------------- OCCUPANCY REPORTS PAGE ---------------- */
const reportData = {
  today: {
    bookings: 48,
    cafes: [65, 85, 30],
    hours: [3, 5, 8, 14, 32, 40, 18, 9, 7, 12, 10, 4],
  },
  week: {
    bookings: 312,
    cafes: [58, 79, 41],
    hours: [20, 34, 52, 88, 190, 240, 120, 60, 48, 76, 70, 25],
  },
  month: {
    bookings: 1286,
    cafes: [61, 82, 38],
    hours: [85, 140, 210, 360, 780, 960, 500, 250, 200, 310, 290, 100],
  },
};
const hourLabels = ["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM"];

function renderReport(period) {
  const data = reportData[period];

  const avg = Math.round(data.cafes.reduce((a, b) => a + b, 0) / data.cafes.length);
  const peakIndex = data.hours.indexOf(Math.max(...data.hours));
  const busiestIndex = data.cafes.indexOf(Math.max(...data.cafes));

  document.getElementById("rBookings").textContent = data.bookings;
  document.getElementById("rAverage").textContent = avg + "%";
  document.getElementById("rPeak").textContent = hourLabels[peakIndex];
  document.getElementById("rBusiest").textContent = cafeNames[busiestIndex];

  document.getElementById("cafeOccupancy").innerHTML = cafeNames.map((name, i) => {
    const pct = data.cafes[i];
    const level = pct >= 80 ? "high" : pct >= 50 ? "mid" : "";
    return `
      <div class="occ-row">
        <div class="occ-label"><span>${name}</span><span>${pct}%</span></div>
        <div class="bar"><div class="bar-fill ${level}" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");

  const max = Math.max(...data.hours);
  document.getElementById("hourChart").innerHTML = data.hours.map((v, i) => `
    <div class="hour-col">
      <span class="hour-value">${v}</span>
      <div class="hour-bar ${i === peakIndex ? "peak" : ""}" style="height:${(v / max) * 85}%"></div>
    </div>`).join("");

  // labels row (added once under the chart)
  const chart = document.getElementById("hourChart");
  let labels = document.getElementById("hourLabels");
  if (!labels) {
    labels = document.createElement("div");
    labels.className = "hour-labels";
    labels.id = "hourLabels";
    labels.innerHTML = hourLabels.map(l => `<span>${l}</span>`).join("");
    chart.insertAdjacentElement("afterend", labels);
  }
}

function initReportPage() {
  const select = document.getElementById("periodSelect");
  select.addEventListener("change", () => renderReport(select.value));
  renderReport("today");
}

/* ---------------- START ---------------- */
if (document.getElementById("historyTable")) initHistoryPage();
if (document.getElementById("hourChart")) initReportPage();