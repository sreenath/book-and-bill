# Appointment Scheduler Project Specification

This specification documents the functional requirements, architectural design, database model, business rules, and interface definitions for the Appointment Scheduler AI Agent. This document allows any AI agent to recreate the project successfully.

---

## 1. Project Overview
The Appointment Scheduler is an AI-powered appointment management system designed for a hair and beauty salon. It enables users to interact with a conversational assistant (built using Google ADK) to look up services and stylists, check slot availability, book, reschedule, or cancel appointments, and search for bookings.

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
│   ├── model-factory.ts           # Dynamic model selection factory
│   ├── scheduler.ts               # Core database definitions and helpers
│   ├── scheduler.test.ts          # Colocated unit test for database & domain helpers
│   ├── models/
│   │   ├── openai.ts              # Custom OpenAI LLM connection adapter
│   │   └── groq.ts                # Custom Groq LLM connection adapter
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
│   └── appointment_scheduler_spec.md # This project specification file
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
| `searchBookings` | `search_appointments` | Optional: `customerName`, `customerPhone`, `date`, `time` (strings) | `{ status: 'success', appointments: Appointment[] }` |
| `getCurrentDate` | `get_current_date` | `{}` | `{ status: 'success', date: 'YYYY-MM-DD', time: 'HH:MM', dayOfWeek: string }` |

---

## 7. Agent Conversation Guidelines & Dynamic LLM Switching
The agent is configured as an `LlmAgent`. Rather than using a hardcoded model, it dynamically resolves the LLM model instance at startup based on the environment variables in `.env` (precedence: Gemini > Groq > OpenAI):

### LLM Switching Logic
1. **Gemini**: Used if `GEMINI_API_KEY` or `GOOGLE_GENAI_API_KEY` is present. Uses model name specified in `GEMINI_MODEL` (default: `gemini-2.5-flash`).
2. **Groq**: Used if `GROQ_API_KEY` is present (and Gemini keys are absent). Uses model name specified in `GROQ_MODEL` (default: `llama-3.3-70b-versatile`). Implemented via a custom `BaseLlm` adapter pointing to `https://api.groq.com/openai/v1/chat/completions`.
3. **OpenAI**: Used if `OPENAI_API_KEY` is present (and Gemini/Groq keys are absent). Uses model name specified in `OPENAI_MODEL` (default: `gpt-4o-mini`). Implemented via a custom `BaseLlm` adapter pointing to `https://api.openai.com/v1/chat/completions`.

### Custom Adapter Rules
- Requests mapping from Gemini's `LlmRequest` structures to OpenAI-compatible chat completion payload formats (remapping roles, prepending `systemInstruction` as a system message, mapping tools to OpenAI tool objects, and lower-casing Zod/JSON schema parameter type strings).
- Responses mapping from OpenAI-compatible JSON responses back to ADK `LlmResponse` structures (converting message content, finish reasons, and mapping tool calls/responses sequentially using unique `tool_call_id` markers).

### Conversational Guidelines
Its system instructions are:
1. When asked for services or stylists, use the list_services tool or the list_stylists tool to provide styling details.
2. Before booking, rescheduling, or checking slots, verify service, stylist, date, and/or time are known. If stylist is omitted, check stylist specialty matches the service before recommending or listing them. Use the check_availability tool to see if a slot is open before booking/rescheduling.
3. To book an appointment, gather customer name, phone number, service ID, stylist ID, date (YYYY-MM-DD), and time (HH:MM). You MUST check slot availability using the check_availability tool before booking. If the requested time slot is available: Summarize all appointment details (Customer Name, Service, Stylist, Date, and Time) back to the user, and ask the user for explicit confirmation to book. DO NOT invoke the book_appointment tool until the user has explicitly confirmed these details. If the requested time slot is NOT available: DO NOT book the appointment, and DO NOT call the book_appointment tool. Instead, suggest alternative available times on that day and ask the user to choose or confirm one first.
4. To cancel an appointment, ask for the customer's full name, phone number, and the date and time of the appointment. ONLY search for an existing appointment (i.e. by calling the search_appointments tool) if the user has provided at least the customer's full name, phone number, and the date of the appointment. If the user has not provided at least these three details, DO NOT perform the search, and instead inform the user that all four details (full name, phone number, date, and time) are required to proceed. When calling the search_appointments tool, use the provided details (customerName, customerPhone, date, and optionally time). For optional parameters, if the value is not available, do not pass that parameter when calling. Verify that the details provided match the retrieved booking record. If no booking is found or if the details do not match, inform the user and do not cancel. If a match is found, summarize the appointment details and ask the user for explicit confirmation before canceling. Only call the cancel_appointment tool with the corresponding appointment ID after the user has explicitly confirmed.
5. Confirm details with the user clearly once a booking, cancellation, or rescheduling is complete.
6. If a slot is taken or unavailable during booking or rescheduling, DO NOT book or reschedule the appointment automatically, and DO NOT call the book_appointment or reschedule_appointment tool for an alternative slot. Instead, suggest alternative available times on that day and ask the user to choose or confirm one first.
7. If the user mentions relative dates (like 'tomorrow', 'next Tuesday', '5 days from now') or when today's date is needed, use the get_current_date tool to obtain the current date and calculate the target date.

---

## 8. Test Settings
- **Colocated tests**: Unit tests are colocated alongside implementations in `app/tools/*.test.ts` and `app/scheduler.test.ts`.
- **Sequential Execution**: In `vitest.config.ts`, `fileParallelism: false` is configured to prevent file-based conflicts on `appointments.json` when test files execute.
