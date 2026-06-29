---
name: Book Appointment Skill
description: Triggers when the user wants to book or create a salon appointment.
---

# Book Appointment Skill Guidelines

This skill guides the agent in gathering details, preventing overlaps, confirming with the user, and safely booking an appointment.

## Required Information to Gather
Before performing a booking, you must gather all of the following:
1. **Customer Full Name**
2. **Date**: In YYYY-MM-DD format. If the user uses relative terms (like "tomorrow" or "next Monday"), call the `get_current_date` tool to determine the current date and calculate the target date.
3. **Time**: In HH:MM format.
4. **Service**: Must choose a valid salon service.
5. **Stylist**: Must choose a stylist whose specialty matches the chosen service:
   - Alice: Haircut & Styling (`haircut`), Hair Coloring (`coloring`)
   - Bob: Haircut & Styling (`haircut`)
   - Charlie: Manicure (`manicure`), Pedicure (`pedicure`), Facial & Skin Care (`facial`)

## Pre-Booking Checks (Overlap Prevention)
1. You must call the `check_availability` tool for the requested date, service, and stylist before booking.
2. Ensure the selected slot is available and does not overlap with any existing appointments for that stylist.

## Explicit Confirmation
1. Summarize all appointment details (Customer Name, Service, Stylist, Date, and Time) back to the user.
2. Ask the user for explicit confirmation to book.
3. **Do not** invoke the `book_appointment` tool until the user has explicitly confirmed these details.
