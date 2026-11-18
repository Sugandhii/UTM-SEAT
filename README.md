# UTM SE&AT
### Smart Eating & Availability Tracker

**A Location-Based Smart Canteen Seat Booking and Occupancy Management System for University Students**

## About the Project

UTM SE&AT (Smart Eating & Availability Tracker) is a location-based cafeteria seat booking and occupancy management system designed to help university students find and secure available seating more efficiently.

Students often face difficulties finding available seats in university cafeterias, especially during peak dining periods. This can result in wasted time, overcrowding, and uncertainty when choosing where to eat.

UTM SE&AT aims to address these challenges by providing a digital platform where students can view cafeteria seating availability, verify their location before booking, and manage their dining sessions.

The system also provides administrators with tools to manage cafeteria seating information, monitor bookings, configure peak-hour schedules, and handle overdue dining sessions.

## Project Objectives

The main objectives of UTM SE&AT are:

1. To provide students with information about available and occupied cafeteria seats.
2. To implement GPS geofencing for on-site booking eligibility.
3. To support seat booking, temporary seat holding, confirmation, and cancellation.
4. To manage peak-hour dining durations and provide automated reminders.
5. To provide a digital waiting list when no eligible seats are available.
6. To support cafeteria administrators in managing seating operations and monitoring occupancy.

## Key Features

The proposed system includes the following features:

- **Student Authentication:** Student registration, login, and role-based access.
- **Cafeteria Information:** Display registered cafeterias and relevant cafeteria information.
- **Seat Availability:** Display available, held, occupied, overdue, and unavailable seat statuses.
- **GPS Geofencing:** Verify whether a student's device is within the designated cafeteria area before allowing a booking.
- **Seat Booking:** Support temporary seat holds, booking confirmation, cancellation, and duplicate booking prevention.
- **Peak-Hour Management:** Configure peak-hour schedules and dining time limits.
- **Dining Session Management:** Track dining sessions, display remaining time, and provide reminders.
- **Overdue Management:** Identify overdue dining sessions and allow authorized staff to verify and release vacant seats.
- **Digital Waiting List:** Allow students to join a waiting list when no eligible seats are available.
- **Admin Dashboard:** Provide administrators with tools to manage cafeteria seating, monitor bookings, and review occupancy information.

## Project Scope and Limitations

UTM SE&AT focuses primarily on cafeteria seating and occupancy management.

**Included in the project scope:**
- Student and administrator authentication.
- GPS geofencing for on-site booking eligibility.
- Seat inventory and occupancy display.
- Temporary seat holds, booking confirmation, and cancellation.
- Peak-hour dining duration management and reminders.
- Overdue session tracking and administrative seat release.
- Digital waiting lists for cafeteria seats.

**Excluded from the project scope:**
- Advance seat reservations from outside the cafeteria.
- Food ordering and food purchasing transactions.
- Food-purchase queue management.
- Online payment transactions.
- Camera-based AI people counting.
- IoT sensor-based automatic occupancy detection.
- Automatic physical enforcement of dining time limits.

The system uses application-reported booking information and administrative status updates as its primary sources of occupancy information. GPS geofencing is used as an eligibility check and does not guarantee absolute proof of physical presence inside a building.

## Technology Stack

The current project repository uses the following technologies:

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, Bootstrap, JavaScript |
| Backend Runtime | Node.js |
| Backend Framework | Express.js |
| Database | MySQL |
| Database Connector | MySQL2 |
| API Architecture | REST API |
| Version Control | Git and GitHub |
| Project Management | Agile Tracker / Trello |

## Project Structure

```text
UTM-SEAT/
│
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   └── css/
│   │       └── style.css
│   └── js/
│       └── api.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── docs/
│
├── .gitignore
└── README.md
```

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

Make sure the following software is installed:

- Node.js
- MySQL Server
- MySQL Workbench (recommended)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Sugandhii/UTM-SEAT.git
cd UTM-SEAT
```

Switch to the development branch:

```bash
git checkout develop
git pull origin develop
```

### 2. Set Up the Database

1. Open MySQL Workbench.
2. Connect to your local MySQL Server.
3. Open `database/schema.sql`.
4. Execute the SQL script to create the `utm_seat` database and its initial tables.

### 3. Configure Environment Variables

Navigate to the backend folder:

```bash
cd backend
```

Create a local `.env` file by copying `.env.example`:

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows CMD:**
```cmd
copy .env.example .env
```

Update the `.env` file with your local MySQL configuration:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=utm_seat
```

Replace `your_mysql_password` with your own local MySQL password.

**Important:** Never commit your actual `.env` file or database credentials to GitHub.

### 4. Install Backend Dependencies

While inside the `backend` directory, run:

```bash
npm install
```

### 5. Start the Backend Server

Run:

```bash
npx nodemon src/server.js
```

The backend server should be available at:

```text
http://localhost:3000
```

### 6. Test the API

The initial backend provides the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check whether the backend server is running |
| GET | `/api/test-db` | Test the MySQL database connection |
| GET | `/api/cafeterias` | Retrieve active cafeteria information |

Example API endpoint:

```text
http://localhost:3000/api/cafeterias
```

The endpoint may return an empty data array when no cafeteria records have been inserted into the database.

## Development Methodology

UTM SE&AT is developed using an Agile approach consisting of three sprints, with each sprint lasting two weeks.

| Sprint | Focus |
|---|---|
| Sprint 1 | Authentication, cafeteria and seat inventory, GPS verification, seating availability, and booking |
| Sprint 2 | Peak-hour management, dining sessions, reminders, overdue handling, and digital waiting lists |
| Sprint 3 | Administration dashboard, booking history, reports, integration, testing, and deployment preparation |

The team uses Git and GitHub for source code management and an Agile Tracker board for monitoring project requirements, design, implementation, and testing activities.

## Team Members

**Project Team: ZeroErrors**

| Team Member | Assigned Subsystem |
|---|---|
| Maryam Khalila | User Management |
| Muhammad Izdihar | Seat Management |
| Achmad Sugandhi | Cafeteria Information |
| Rahmah Nurfitri | Administration & Analytics |

## Project Status

**Currently in Development**

UTM SE&AT is being developed as part of the SECJ3104 Application Development course at Universiti Teknologi Malaysia (UTM).

---

*UTM SE&AT — Making cafeteria seating more accessible, organized, and manageable.*