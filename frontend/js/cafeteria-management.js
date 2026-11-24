// Dummy data for Sprint 1 (interface only). Backend will replace this later.
function generateSeats(total, occupied) {
  const seats = [];
  for (let i = 0; i < total; i++) {
    const row = String.fromCharCode(65 + Math.floor(i / 10));
    seats.push({ id: row + ((i % 10) + 1), state: i < occupied ? "occupied" : "available" });
  }
  return seats;
}

let nextId = 4;
let selectedId = 1;
let editingId = null;

let cafes = [
  { id: 1, name: "Cafe Kolej Tun Fatimah", location: "Kolej Tun Fatimah", hours: "7:00 AM - 10:00 PM", status: "Open", seats: generateSeats(80, 52) },
  { id: 2, name: "Cafe Kolej Tun Razak", location: "Kolej Tun Razak", hours: "7:00 AM - 9:00 PM", status: "Open", seats: generateSeats(60, 51) },
  { id: 3, name: "Cafe Fakulti Komputeran", location: "Fakulti Komputeran", hours: "8:00 AM - 5:00 PM", status: "Closed", seats: generateSeats(40, 0) },
];

const countState = (c, state) => c.seats.filter(s => s.state === state).length;

function renderCafes() {
  document.getElementById("cafeList").innerHTML = cafes.map(c => `
    <div class="cafe-card">
      <div class="card-top">
        <h4>${c.name}</h4>
        <span class="badge ${c.status}">${c.status}</span>
      </div>
      <p>📍 ${c.location}</p>
      <p>🕒 ${c.hours}</p>
      <p>🪑 ${c.seats.length} seats (${countState(c, "occupied")} occupied)</p>
      <div class="card-actions">
        <button class="btn-small" onclick="selectCafe(${c.id})">View seats</button>
        <button class="btn-small" onclick="openModal(${c.id})">Edit</button>
        <button class="btn-small danger" onclick="deleteCafe(${c.id})">Delete</button>
      </div>
    </div>`).join("") || "<p>No cafeterias yet. Click “Add Cafeteria”.</p>";

  const select = document.getElementById("cafeSelect");
  select.innerHTML = cafes.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${c.name}</option>`).join("");
}

function renderSeats() {
  const cafe = cafes.find(c => c.id === selectedId);
  const grid = document.getElementById("seatGrid");
  const summary = document.getElementById("seatSummary");

  if (!cafe) {
    grid.innerHTML = "";
    summary.innerHTML = "";
    return;
  }

  summary.innerHTML = `
    <span><b>Total:</b> ${cafe.seats.length}</span>
    <span><b>Available:</b> ${countState(cafe, "available")}</span>
    <span><b>Occupied:</b> ${countState(cafe, "occupied")}</span>
    <span><b>Maintenance:</b> ${countState(cafe, "maintenance")}</span>`;

  grid.innerHTML = cafe.seats.map(s =>
    `<div class="seat ${s.state}" onclick="toggleSeat('${s.id}')">${s.id}</div>`).join("");
}

function selectCafe(id) {
  selectedId = id;
  renderCafes();
  renderSeats();
  document.getElementById("seatGrid").scrollIntoView({ behavior: "smooth" });
}

function toggleSeat(seatId) {
  const cafe = cafes.find(c => c.id === selectedId);
  const seat = cafe.seats.find(s => s.id === seatId);
  if (seat.state === "occupied") {
    alert("Seat " + seatId + " is currently occupied and cannot be changed.");
    return;
  }
  seat.state = seat.state === "available" ? "maintenance" : "available";
  renderCafes();
  renderSeats();
}

function openModal(id) {
  editingId = id || null;
  const cafe = cafes.find(c => c.id === id);
  document.getElementById("modalTitle").textContent = cafe ? "Edit Cafeteria" : "Add Cafeteria";
  document.getElementById("fName").value = cafe ? cafe.name : "";
  document.getElementById("fLocation").value = cafe ? cafe.location : "";
  document.getElementById("fSeats").value = cafe ? cafe.seats.length : "";
  document.getElementById("fHours").value = cafe ? cafe.hours : "";
  document.getElementById("fStatus").value = cafe ? cafe.status : "Open";
  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

function deleteCafe(id) {
  const cafe = cafes.find(c => c.id === id);
  if (!confirm("Delete " + cafe.name + "?")) return;
  cafes = cafes.filter(c => c.id !== id);
  if (selectedId === id) selectedId = cafes.length ? cafes[0].id : null;
  renderCafes();
  renderSeats();
}

document.getElementById("cafeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const data = {
    name: document.getElementById("fName").value.trim(),
    location: document.getElementById("fLocation").value.trim(),
    hours: document.getElementById("fHours").value.trim(),
    status: document.getElementById("fStatus").value,
  };
  const total = parseInt(document.getElementById("fSeats").value, 10);

  if (editingId) {
    const cafe = cafes.find(c => c.id === editingId);
    const fresh = generateSeats(total, 0);
    // keep the state of existing seats when the total changes
    fresh.forEach((s, i) => { if (cafe.seats[i]) s.state = cafe.seats[i].state; });
    Object.assign(cafe, data, { seats: fresh });
  } else {
    cafes.push({ id: nextId, ...data, seats: generateSeats(total, 0) });
    selectedId = nextId;
    nextId++;
  }
  closeModal();
  renderCafes();
  renderSeats();
});

document.getElementById("addCafeBtn").addEventListener("click", () => openModal());
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("cafeSelect").addEventListener("change", e => {
  selectedId = parseInt(e.target.value, 10);
  renderSeats();
});

renderCafes();
renderSeats();