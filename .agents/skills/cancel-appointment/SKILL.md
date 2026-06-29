---
name: Cancel Appointment Skill
description: Triggers when the user asks to cancel an existing appointment.
---

# Cancel Appointment Skill Guidelines

This skill guides the agent in safely locating, verifying, and canceling a customer's existing appointment.

## Required Information to Gather
When a user asks to cancel an appointment, you must ask for and obtain all of the following verification details:
1. **Customer Full Name**
2. **Customer Phone Number**
3. **Date of the Appointment** (in YYYY-MM-DD format; resolve relative dates first)
4. **Time of the Appointment** (in HH:MM format)

## Search & Verification Process
1. **Search Constraint**: You must ONLY search for an existing appointment (i.e. by calling the `search_appointments` tool) if the user has provided at least the **Customer Full Name**, the **Customer Phone Number**, and the **Date of the Appointment**.
2. **If Details are Missing**: If the user has not provided all of these three details, DO NOT perform the search. Instead, inform the user that all four details (Customer Full Name, Customer Phone Number, Date of the Appointment, and Time of the Appointment) are required to proceed.
3. Call the `search_appointments` tool using the provided verification details (`customerName`, `customerPhone`, `date` and optionally `time`) to search the database. For optional parameters, if the value is not available, do not pass that parameter when calling.
4. Validate that the returned appointment record matches the details provided by the user (name, phone, date, and time).
5. If no matching appointment is found, or if any of the provided details do not match the database record, politely inform the user that you cannot find a matching appointment and **do not** proceed with the cancellation.

## Explicit Confirmation
1. Once a matching appointment is located and successfully verified:
   - Present the summarized details of the appointment to the user (e.g., "I found your Hair Coloring appointment with Alice on 2026-07-04 at 10:00.").
   - Ask the user for explicit confirmation to cancel (e.g., "Would you like me to go ahead and cancel this appointment?").
2. **Do not** invoke the `cancel_appointment` tool until the user has explicitly confirmed the cancellation.
