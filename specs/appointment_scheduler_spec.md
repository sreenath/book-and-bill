# Book&Bill Project Specification

This specification documents the functional requirements, architectural design, database model, business rules, and interface definitions for the Book&Bill AI Agent. This document allows any AI agent to recreate the project successfully.

---

## 1. Project Overview
Book&Bill is an AI-powered appointment management and billing system designed for a hair and beauty salon. It enables users to interact with a conversational assistant (built using Google ADK) to look up services and stylists, check slot availability, book, reschedule, or cancel appointments, search for bookings, request quotes, and generate invoices.

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
│   ├── config/                    # Business configurations and validation helpers
│   │   ├── types.ts               # Configuration type interfaces
│   │   ├── business_1.ts          # Business 1 (Tony & Guy Saloon) config
│   │   ├── business_2.ts          # Business 2 (Ray's SPA) config
│   │   ├── business-config.ts     # Dynamic config loader & test mock helper
│   │   ├── validation.ts          # Date and operating day validations
│   │   └── validation.test.ts     # Validation unit test
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
│       ├── get-current-date.test.ts
│       ├── create-invoice.ts      # tool: create_invoice
│       ├── create-invoice.test.ts
│       ├── create-quote.ts        # tool: create_quote
│       ├── create-quote.test.ts
│       ├── generate-pdf.ts        # tool: generate_pdf
│       └── generate-pdf.test.ts
├── data/
│   ├── appointments_${businessId}.json # Dynamic file-based JSON database (created at runtime)
│   ├── invoices_${businessId}.json    # Dynamic file-based JSON invoice database
│   └── quotes_${businessId}.json      # Dynamic file-based JSON quote database
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

- **Invoice**:
  - `id`: string (Format: `INV-XXXX` where `XXXX` is a random 4-digit number)
  - `appointmentId`: string
  - `customerName`: string
  - `customerPhone`: string
  - `serviceId`: string
  - `serviceName`: string
  - `price`: number
  - `tax`: number
  - `total`: number
  - `date`: string

- **Quote**:
  - `id`: string (Format: `QT-XXXX` where `XXXX` is a random 4-digit number)
  - `customerName`: string
  - `customerPhone`: string
  - `serviceId`: string
  - `serviceName`: string
  - `price`: number
  - `tax`: number
  - `total`: number
  - `date`: string

---

## 5. Core Scheduling Business Rules

1. **Business Hours**: The salon operates between `09:00` and `18:00`. Appointments must begin and end strictly within these hours.
2. **Intervals**: Slots are offered at `30-minute` intervals starting at `09:00`.
3. **Collision / Overlap Detection**: A stylist cannot have overlapping appointments on the same date. 
   An overlap occurs if:
   $$\max(\text{start}_1, \text{start}_2) < \min(\text{end}_1, \text{end}_2)$$
4. **Database File**: Appointments are saved as a JSON array under `data/appointments_${businessId}.json` in production, or `data/appointments_${businessId}_test.json` in test environments. The directory and file are initialized automatically if they do not exist.

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
| `createInvoice` | `create_invoice` | `appointmentId` (string) | `{ status: 'success', invoice: Invoice }` or `{ status: 'error', message: string }` |
| `createQuote` | `create_quote` | `customerName` (string), `customerPhone` (string), `serviceId` (string) | `{ status: 'success', quote: Quote }` or `{ status: 'error', message: string }` |
| `generatePdf` | `generate_pdf` | Optional: `invoiceId` (string), `quoteId` (string) | `{ status: 'success', message: string, filePath: string }` or `{ status: 'error', message: string }` |

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

### Multi-Agent Architecture
The conversational assistant is structured as a multi-agent system consisting of:
1. **Root Orchestrator Agent (`book_and_bill_agent`)**: Greet the user, understand their high-level intent, and route/transfer control to the specialized sub-agents.
2. **Appointment Agent (`appointment_agent`)**: Specialized sub-agent that handles all appointment scheduling tasks.
3. **Invoice/Quote Agent (`invoice_quote_agent`)**: Specialized sub-agent that handles invoicing, price quotes, and PDF downloads.

### Conversational Guidelines by Agent

#### 1. Root Orchestrator Agent (`book_and_bill_agent`)
- **Greeting**: The agent greets the customer first before the user enters anything in the chat by pre-populating the session with the configured initial greeting: `${ACTIVE_CONFIG.welcomeMessage}`.
- **Routing**:
  - If user wants to check slot availability, book, reschedule, or cancel bookings, delegate to the `appointment_agent`.
  - If user wants to create an invoice, get a price quote, or generate a PDF of their invoice or quote, delegate to the `invoice_quote_agent`.
  - If the intent is unclear, ask clarifying questions.

#### 2. Appointment Agent (`appointment_agent`)
- **Services/Stylists**: Use `list_services` or `list_stylists` to show available services and stylists.
- **Pre-checks**: Verify service, stylist, date, and/or time before slot checks or booking. Check specialties if stylist isn't specified.
- **Booking**: Gather customer name, phone, service ID, stylist ID, date (YYYY-MM-DD), and time (HH:MM). Check availability using `check_availability` first. If available, summarize details and get explicit user confirmation before calling `book_appointment`. If unavailable, suggest alternative slots.
- **Cancellation**: Gather name, phone, date, and time. Must search using `search_appointments` (requires name, phone, date). Verify retrieved booking matches user details. Ask for explicit user confirmation before calling `cancel_appointment`.
- **Rescheduling**: Same search/verification guidelines as cancellation. Then verify new date/time availability and request explicit user confirmation before calling `reschedule_appointment`.
- **Dates**: Use `get_current_date` to calculate relative dates.

#### 3. Invoice/Quote Agent (`invoice_quote_agent`)
- **Invoices**: Create using `create_invoice` (requires appointment ID). If the appointment ID is missing, search for the appointment using `search_appointments` (requires customer name, phone, and appointment date).
- **Quotes**: Create using `create_quote` (requires customer name, phone, and service ID).
- **PDF Generation**: After creating an invoice or quote, call `generate_pdf` to generate the PDF file and return the absolute/file URL path so the user can download it.
- **Cross-Agent Hand-off**: If the user asks about bookings, availability, or stylists, hand control back to the `appointment_agent`.

---

## 8. Test Settings
- **Colocated tests**: Unit tests are colocated alongside implementations in `app/tools/*.test.ts` and `app/scheduler.test.ts`.
- **Sequential Execution**: In `vitest.config.ts`, `fileParallelism: false` is configured to prevent file-based conflicts on dynamic test database files when test files execute.

---

## 9. Multi-Tenant Business Configuration
The system supports multiple salon business configurations dynamically resolved via the `BUSINESS_ID` environment variable (defaults to `business_1`).

### Business Profiles
1. **Business 1 (Tony & Guy Saloon)**
   - Name: `Tony & Guy Saloon`
   - Initial greeting: `"Welcome to Tony & Guy Saloon"`
   - Booking Window: `1 month`
   - Operating Days: `All days` (Sunday - Saturday)
   - Services & Stylists: Default catalog (haircut, coloring, manicure, pedicure, facial; Alice, Bob, Charlie)

2. **Business 2 (Ray's SPA)**
   - Name: `Ray's SPA`
   - Initial greeting: `"Welcome to Ray's SPA. How can I help you?"`
   - Booking Window: `6 months`
   - Operating Days: `Weekdays only` (Monday - Friday)
   - Services & Stylists: Custom catalog
     - Services: `massage` (Full Body Massage, $100, 60 mins), `makeup` (Professional Makeup, $75, 45 mins)
     - Stylists: `david` (specialty: `massage`), `eva` (specialty: `makeup`)

### Scheduling Constraints & Validation
- **Booking Window Check**: Bookings are restricted from the current date up to `currentDate + bookingWindowMonths`. Violations return a validation error.
- **Operating Day Check**: If a booking is requested on a day the business is closed, the system returns a validation error detailing that the salon is closed and offering the next operating day in YYYY-MM-DD format.
- **Database Isolation**: Production data is stored in `data/appointments_${businessId}.json`. Unit and integration tests write to `data/appointments_${businessId}_test.json` to prevent modifying active production records.
