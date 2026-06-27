# Salon Scheduler Project Specification

This specification documents the functional requirements, architectural design, database model, business rules, and interface definitions for the Salon Scheduler AI Agent. This document allows any AI agent to recreate the project successfully.

---

## 1. Project Overview
The Salon Scheduler is an AI-powered appointment management system designed for a hair and beauty salon. It enables users to interact with a conversational assistant (built using Google ADK) to look up services and stylists, check slot availability, book, reschedule, or cancel appointments, and search for bookings.

---

## 2. Technical Stack
- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Language**: TypeScript (`tsconfig.json` targeting ES2022/NodeNext)
- **Agent Framework**: Google Agent Development Kit (`@google/adk` and `@google/adk-devtools`)
- **Validation**: Zod (`zod`)
- **Testing**: Vitest (`vitest`)

---

## 3. Directory Layout
```
├── .agents/
│   └── AGENTS.md                  # Behavioral rules for the AI pair-programmer
├── app/
│   ├── agent.ts                   # Agent initialization and instructions
│   ├── scheduler.ts               # Core database definitions and helpers
│   ├── scheduler.test.ts          # Colocated unit test for database & domain helpers
│   └── tools/
│       ├── index.ts               # Consolidates and re-exports all tools
│       ├── list-services.ts       # tool: list_services
│       ├── list-services.test.ts  # Colocated unit test
│       ├── list-stylists.ts       # tool: list_stylists
│       ├── list-stylists.test.ts  # Colocated unit test
│       ├── check-availability.ts  # tool: check_availability
│       ├── check-availability.test.ts
│       ├── create-booking.ts      # tool: book_appointment
│       ├── create-booking.test.ts
│       ├── cancel-booking.ts      # tool: cancel_appointment
│       ├── cancel-booking.test.ts
│       ├── reschedule-booking.ts  # tool: reschedule_appointment
│       ├── reschedule-booking.test.ts
│       ├── search-bookings.ts     # tool: search_appointments
│       ├── search-bookings.test.ts
│       ├── get-current-date.ts    # tool: get_current_date
│       └── get-current-date.test.ts
├── data/
│   └── appointments.json          # File-based JSON database (created at runtime)
├── specs/
│   └── salon_scheduler_spec.md    # This project specification file
└── tests/
    └── integration/
        ├── agent.test.ts          # Agent conversational tests
        └── server_e2e.test.ts     # API server E2E tests
```

---

## 4. Data Models & Constants

### Constants
1. **SERVICES**:
   - `haircut`: Haircut & Styling (Price: $35, Duration: 30 mins)
   - `coloring`: Hair Coloring (Price: $85, Duration: 90 mins)
   - `manicure`: Manicure (Price: $25, Duration: 30 mins)
   - `pedicure`: Pedicure (Price: $40, Duration: 45 mins)
   - `facial`: Facial & Skin Care (Price: $60, Duration: 60 mins)

2. **STYLISTS**:
   - `alice`: Alice Smith (Specialties: haircut, coloring)
   - `bob`: Bob Jones (Specialties: haircut)
   - `charlie`: Charlie Brown (Specialties: manicure, pedicure, facial)

### Interfaces
- **Appointment**:
  - `id`: string (Format: `APT-XXXX` where `XXXX` is a random 4-digit number)
  - `customerName`: string
  - `customerPhone`: string
  - `serviceId`: string
  - `stylistId`: string
  - `date`: string (Format: `YYYY-MM-DD`)
  - `time`: string (Format: `HH:MM`)
  - `durationMinutes`: number

---

## 5. Core Scheduling Business Rules

1. **Business Hours**: The salon operates between `09:00` and `18:00`. Appointments must begin and end strictly within these hours.
2. **Intervals**: Slots are offered at `30-minute` intervals starting at `09:00`.
3. **Collision / Overlap Detection**: A stylist cannot have overlapping appointments on the same date. 
   An overlap occurs if:
   $$\max(\text{start}_1, \text{start}_2) < \min(\text{end}_1, \text{end}_2)$$
4. **Database File**: Appointments are saved as a JSON array under `data/appointments.json`. The directory and file are initialized automatically if they do not exist.

---

## 6. Tool Definitions & Specifications

Each tool is constructed as a `FunctionTool` from `@google/adk`.

| Variable Name | Registered Name | Input Parameters (Zod Schema) | Output Structure |
|---|---|---|---|
| `listServices` | `list_services` | `{}` | `{ status: 'success', services: Service[] }` |
| `listStylists` | `list_stylists` | `{}` | `{ status: 'success', stylists: Stylist[] }` |
| `checkAvailability` | `check_availability` | `date` (string), `serviceId` (string), `stylistId` (string) | `{ status: 'success', date, serviceId, stylistId, availableSlots: string[] }` |
| `createBooking` | `book_appointment` | `customerName` (string), `customerPhone` (string), `serviceId` (string), `stylistId` (string), `date` (string), `time` (string) | `{ status: 'success', appointment: Appointment }` or `{ status: 'error', message: string }` |
| `cancelBooking` | `cancel_appointment` | `appointmentId` (string) | `{ status: 'success', message: string }` or `{ status: 'error', message: string }` |
| `rescheduleBooking` | `reschedule_appointment` | `appointmentId` (string), `newDate` (string), `newTime` (string) | `{ status: 'success', appointment: Appointment }` or `{ status: 'error', message: string }` |
| `searchBookings` | `search_appointments` | Optional: `customerName`, `customerPhone`, `date` (strings) | `{ status: 'success', appointments: Appointment[] }` |
| `getCurrentDate` | `get_current_date` | `{}` | `{ status: 'success', date: 'YYYY-MM-DD', time: 'HH:MM', dayOfWeek: string }` |

---

## 7. Agent Conversation Guidelines
The agent is configured as an `LlmAgent` using model `gemini-flash-latest`. Its system instructions are:
1. Use `list_services` or `list_stylists` to provide styling details.
2. Before booking, rescheduling, or checking slots, verify service, stylist, date, and time are known. If stylist is omitted, check stylist specialty matches the service before recommending or listing them.
3. Check availability before confirming bookings or reschedule requests.
4. If a slot is taken, suggest alternative times on the same day.
5. If the user mentions relative dates (like "tomorrow", "next Tuesday", etc.) or today's date is needed, the agent must call the `get_current_date` tool to find today's date and calculate the target date.

---

## 8. Test Settings
- **Colocated tests**: Unit tests are colocated alongside implementations in `app/tools/*.test.ts` and `app/scheduler.test.ts`.
- **Sequential Execution**: In `vitest.config.ts`, `fileParallelism: false` is configured to prevent file-based conflicts on `appointments.json` when test files execute.
