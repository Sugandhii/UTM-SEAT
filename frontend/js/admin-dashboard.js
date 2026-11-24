// Dummy data for Sprint 1 (interface only). Backend will replace this later.
const cafeterias = [
  { name: "Cafe Kolej Tun Fatimah", total: 80, occupied: 52 },
  { name: "Cafe Kolej Tun Razak", total: 60, occupied: 51 },
  { name: "Cafe Fakulti Komputeran", total: 40, occupied: 12 },
];

let bookings = [
  { id: "BK001", student: "Ali Hassan (A24CS1001)", cafe: "Cafe Kolej Tun Fatimah", seat: "A12", time: "12:00 - 13:00", status: "Active" },
  { id: "BK002", student: "Nur Aina (A24CS1002)", cafe: "Cafe Kolej Tun Razak", seat: "B03", time: "12:30 - 13:30", status: "Active" },
  { id: "BK003", student: "Chong Wei (A24CS1003)", cafe: "Cafe Fakulti Komputeran", seat: "C07", time: "11:00 - 12:00", status: "Completed" },
  { id: "BK004", student: "Siti Sarah (A24CS1004)", cafe: "Cafe Kolej Tun Fatimah", seat: "A20", time: "13:00 - 14:00", status: "Cancelled" },
];

function renderStats() {
  const total = cafeterias.reduce((s, c) => s + c.total, 0);
  const occupied = cafeterias.reduce((s, c) => s + c.occupied, 0);
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statOccupied").textContent = occupied;
  document.getElementById("statAvailable").textContent = total - occupied;
  document.getElementById("statBookings").textContent =
    bookings.filter(b => b.status === "Active").length;
}

function renderOccupancy() {
  const list = document.getElementById("occupancyList");
  list.innerHTML = cafeterias.map(c => {
    const pct = Math.round((c.occupied / c.total) * 100);
    const level = pct >= 80 ? "high" : pct >= 50 ? "mid" : "";
    return `
      <div class="occ-row">
        <div class="occ-label"><span>${c.name}</span><span>${c.occupied}/${c.total} (${pct}%)</span></div>
        <div class="bar"><div class="bar-fill ${level}" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");
}

function renderBookings() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  const filtered = bookings.filter(b =>
    b.student.toLowerCase().includes(keyword) &&
    (status === "all" || b.status === status)
  );

  const tbody = document.getElementById("bookingTable");
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No bookings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.student}</td>
      <td>${b.cafe}</td>
      <td>${b.seat}</td>
      <td>${b.time}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td>${b.status === "Active"
        ? `<button class="btn-cancel" onclick="cancelBooking('${b.id}')">Cancel</button>`
        : "-"}</td>
    </tr>`).join("");
}

function cancelBooking(id) {
  if (!confirm("Cancel booking " + id + "?")) return;
  const booking = bookings.find(b => b.id === id);
  if (booking) booking.status = "Cancelled";
  renderStats();
  renderBookings();
}

document.getElementById("searchInput").addEventListener("input", renderBookings);
document.getElementById("statusFilter").addEventListener("change", renderBookings);

renderStats();
renderOccupancy();
renderBookings();