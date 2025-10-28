# HealthBooker - Functional Requirements

## Overview
HealthBooker is a multi-tenant appointment booking system for healthcare professionals. It enables therapists to manage their availability and allows patients to book appointments without requiring accounts.

## Target Users
- **Therapists**: Healthcare professionals who provide services and manage their schedules
- **Patients**: End users who book appointments with therapists

---

## Core Data Models

### Therapist Profile
A healthcare professional who provides services.

**Attributes:**
- Unique identifier (ID)
- Email address (must be unique, used for login)
- Password (hashed for security)
- Full name
- Specialization field (e.g., "Craniosacral Therapist")
- Bio/description
- Optional photo URL
- Weekly recurring availability schedule
- Blocked time slots
- Account creation timestamp
- Last update timestamp

**Weekly Availability Format:**
- Array of availability entries
- Each entry contains:
  - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  - Start time (HH:MM format, 24-hour)
  - End time (HH:MM format, 24-hour)

**Blocked Slots Format:**
- Array of blocked time periods
- Each entry contains:
  - Specific date (YYYY-MM-DD format)
  - Start time (HH:MM format)
  - End time (HH:MM format)

### Appointment Booking
A scheduled appointment between a patient and therapist.

**Attributes:**
- Unique identifier (ID)
- Therapist ID (references therapist)
- Patient full name
- Patient email address
- Patient phone number
- Appointment date (YYYY-MM-DD format)
- Appointment start time (HH:MM format)
- Appointment end time (HH:MM format)
- Status (pending, confirmed, cancelled)
- Unique cancellation token (UUID)
- Booking creation timestamp
- Last update timestamp

**Constraints:**
- Each appointment is 60 minutes in duration
- System generates 90-minute slots (60 min session + 30 min break)
- Cannot book appointments in the past
- Cannot have overlapping appointments for the same therapist

---

## Functional Requirements

### Phase 1: Authentication & Account Management

#### FR-1.1: Therapist Registration
**Actor:** Unauthenticated user  
**Goal:** Create a new therapist account

**Required Input:**
- Email address
- Password
- Full name
- Specialization
- Bio/description

**Process:**
1. Validate that email is not already registered
2. Validate that all required fields are provided
3. Hash password using a secure hashing algorithm (e.g., bcrypt with salt rounds)
4. Create therapist account with provided information
5. Initialize empty weekly availability and blocked slots arrays
6. Generate authentication token (JWT)
7. Return authentication token and basic therapist profile (without sensitive data)

**Output:**
- Authentication token
- Therapist profile (ID, email, name, specialization, bio)
- Success message

**Error Conditions:**
- Email already exists (409 Conflict)
- Missing required fields (400 Bad Request)
- Invalid email format (400 Bad Request)

---

#### FR-1.2: Therapist Login
**Actor:** Unauthenticated user  
**Goal:** Authenticate and obtain access to therapist account

**Required Input:**
- Email address
- Password

**Process:**
1. Validate that email and password are provided
2. Find therapist by email address
3. If therapist not found, return authentication error
4. Compare provided password with stored password hash
5. If password doesn't match, return authentication error
6. Generate authentication token (JWT) containing:
   - Therapist ID
   - Email address
7. Return authentication token and basic therapist profile

**Output:**
- Authentication token
- Therapist profile (ID, email, name, specialization, bio)
- Success message

**Error Conditions:**
- Therapist not found (401 Unauthorized)
- Invalid password (401 Unauthorized)
- Missing email or password (400 Bad Request)

---

#### FR-1.3: Token Verification
**Actor:** Authenticated therapist  
**Goal:** Verify authentication token is valid

**Required Input:**
- Authentication token (in request header)

**Process:**
1. Extract token from authorization header
2. Validate token signature and expiration
3. Extract therapist ID from token payload
4. Retrieve therapist from database using ID from token
5. If therapist not found, return error
6. Return current therapist profile

**Output:**
- Therapist profile (ID, email, name, specialization, bio)
- Token validation status

**Error Conditions:**
- Missing token (401 Unauthorized)
- Invalid/expired token (401 Unauthorized)
- Therapist not found (404 Not Found)

---

### Phase 2: Therapist Profile Management

#### FR-2.1: View Therapist Profile (Public)
**Actor:** Unauthenticated user  
**Goal:** View therapist's public profile information

**Required Input:**
- Therapist ID

**Process:**
1. Validate therapist ID format
2. Retrieve therapist by ID
3. If therapist not found, return error
4. Return therapist public information (name, specialization, bio, photo URL)

**Output:**
- Therapist public profile (name, specialization, bio, photo URL)

**Error Conditions:**
- Invalid therapist ID format (404 Not Found)
- Therapist not found (404 Not Found)

---

#### FR-2.2: Get Therapist Booking URL
**Actor:** Authenticated therapist  
**Goal:** Obtain unique booking URL for sharing with patients

**Process:**
1. Extract therapist ID from authentication token
2. Verify therapist exists
3. Generate booking URL using therapist ID
4. Return booking URL

**Output:**
- Booking URL (format: BASE_URL/book/{therapistId})

---

### Phase 3: Availability Management

#### FR-3.1: Update Weekly Availability
**Actor:** Authenticated therapist  
**Goal:** Set or modify recurring weekly availability schedule

**Required Input:**
- Weekly availability array (sent in request body)

**Process:**
1. Extract therapist ID from authentication token
2. Verify therapist exists
3. Validate weekly availability data:
   - Each entry must have valid day (0-6)
   - Each entry must have valid start and end times (HH:MM format)
   - Start time must be before end time
4. Update therapist's weekly availability
5. Save changes to database
6. Return updated weekly availability

**Output:**
- Updated weekly availability array
- Success message

**Error Conditions:**
- Unauthenticated request (401 Unauthorized)
- Invalid availability data format (400 Bad Request)
- Start time not before end time (400 Bad Request)
- Invalid day number (400 Bad Request)

---

#### FR-3.2: Update Blocked Slots
**Actor:** Authenticated therapist  
**Goal:** Block specific dates and times from being booked

**Required Input:**
- Blocked slots array (sent in request body)

**Process:**
1. Extract therapist ID from authentication token
2. Verify therapist exists
3. Validate blocked slots data:
   - Each entry must have valid date (YYYY-MM-DD format)
   - Each entry must have valid start and end times (HH:MM format)
   - Start time must be before end time
4. Update therapist's blocked slots
5. Save changes to database
6. Return updated blocked slots

**Output:**
- Updated blocked slots array
- Success message

**Error Conditions:**
- Unauthenticated request (401 Unauthorized)
- Invalid blocked slot data format (400 Bad Request)
- Start time not before end time (400 Bad Request)

---

#### FR-3.3: Get Current Availability
**Actor:** Authenticated therapist  
**Goal:** View current availability settings

**Required Input:**
- Authentication token (in request header)

**Process:**
1. Extract therapist ID from authentication token
2. Retrieve therapist from database
3. Return weekly availability and blocked slots

**Output:**
- Weekly availability array
- Blocked slots array

**Error Conditions:**
- Unauthenticated request (401 Unauthorized)
- Therapist not found (404 Not Found)

---

#### FR-3.4: Get Available Time Slots for Booking
**Actor:** Unauthenticated user  
**Goal:** Retrieve available appointment slots for a therapist within a date range

**Required Input:**
- Therapist ID
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)

**Process:**
1. Validate therapist ID format
2. Retrieve therapist from database
3. Validate start date and end date are provided and in correct format
4. Calculate available slots by:
   a. For each date in the range, determine day of week
   b. Find weekly availability for that day
   c. Generate 90-minute slots (60 min session + 30 min break)
   d. Filter out slots that overlap with:
      - Blocked slots
      - Existing non-cancelled bookings
   e. Limit to maximum 2 slots per day
   f. For past dates, only show booked slots (no available slots)
   g. Mark slots as:
      - 'available': Can be booked by patient
      - 'booked': Already has an appointment
      - 'blocked': Blocked by therapist
      - 'unavailable': No weekly availability for this day
5. Return array of time slots with status

**Time Slot Format:**
- Date (YYYY-MM-DD)
- Start time (HH:MM)
- End time (HH:MM)
- Status (available, booked, blocked, unavailable, break)
- For available slots: include session start/end times and break start/end times
- For booked slots: include booking ID and patient information

**Output:**
- Array of time slots with metadata

**Error Conditions:**
- Invalid therapist ID format (404 Not Found)
- Therapist not found (404 Not Found)
- Missing start date or end date (400 Bad Request)
- Invalid date format (400 Bad Request)

---

### Phase 4: Appointment Booking

#### FR-4.1: Create Appointment Booking
**Actor:** Unauthenticated user  
**Goal:** Book an appointment with a therapist

**Required Input:**
- Therapist ID
- Patient full name
- Patient email address
- Patient phone number
- Date (YYYY-MM-DD format)
- Start time (HH:MM format)
- End time (HH:MM format)

**Process:**
1. Validate all required fields are provided
2. Validate email format
3. Validate date is not in the past
4. Validate that therapist exists
5. Check if the time slot is already booked:
   - Query for existing booking with same therapist, date, and start time where status is not 'cancelled'
   - If found, return conflict error
6. Generate unique cancellation token (UUID)
7. Create booking record with status 'confirmed'
8. Save booking to database
9. Send confirmation emails (async, non-blocking):
   - Email to patient with appointment details and cancellation link
   - Email to therapist with patient details and appointment time
10. Return booking details including cancellation token

**Output:**
- Booking ID
- Cancellation token
- Appointment details (date, time, status)
- Success message

**Error Conditions:**
- Missing required fields (400 Bad Request)
- Invalid email format (400 Bad Request)
- Date in the past (400 Bad Request)
- Therapist not found (404 Not Found)
- Time slot already booked (409 Conflict)
- Server error during booking creation (500 Internal Server Error)

**Note:** Email sending failures should not cause booking creation to fail.

---

#### FR-4.2: View Booking Details
**Actor:** Unauthenticated user  
**Goal:** View details of a specific booking using cancellation token

**Required Input:**
- Cancellation token

**Process:**
1. Validate that cancellation token is provided
2. Retrieve booking by cancellation token
3. If booking not found, return error
4. Retrieve therapist information for the booking
5. Return booking and therapist details

**Output:**
- Booking details (patient info, date, time, status)
- Therapist details (name, specialization, bio)

**Error Conditions:**
- Missing cancellation token (400 Bad Request)
- Booking not found (404 Not Found)

---

#### FR-4.3: Cancel Appointment Booking
**Actor:** Unauthenticated user (patient)  
**Goal:** Cancel an existing appointment

**Required Input:**
- Cancellation token

**Process:**
1. Validate that cancellation token is provided
2. Retrieve booking by cancellation token
3. If booking not found, return error
4. Check if booking is already cancelled
   - If already cancelled, return error
5. Check 24-hour cancellation policy:
   - Calculate hours until appointment date/time
   - If less than 24 hours remaining, return error
6. Update booking status to 'cancelled'
7. Save changes to database
8. Send cancellation confirmation emails (async, non-blocking):
   - Email to patient confirming cancellation
   - Email to therapist notifying of cancellation
9. Return success message

**Output:**
- Success message

**Error Conditions:**
- Missing cancellation token (400 Bad Request)
- Booking not found (404 Not Found)
- Booking already cancelled (400 Bad Request)
- Less than 24 hours before appointment (400 Bad Request)

**Note:** Email sending failures should not cause cancellation to fail.

---

### Phase 5: Therapist Dashboard & Management

#### FR-5.1: View All Appointments
**Actor:** Authenticated therapist  
**Goal:** View all appointments associated with the therapist

**Required Input:**
- Authentication token (in request header)
- Optional: status filter
- Optional: limit (pagination)
- Optional: offset (pagination)

**Process:**
1. Extract therapist ID from authentication token
2. Build query for bookings filtered by therapist ID
3. If status filter provided, add status filter to query
4. If limit provided, apply pagination
5. Retrieve bookings from database
6. Return list of bookings with patient and appointment information

**Output:**
- Array of booking objects (patient name, email, phone, date, time, status, creation date)
- Total count (if pagination used)

**Error Conditions:**
- Unauthenticated request (401 Unauthorized)
- Therapist not found (404 Not Found)

---

### Phase 6: Email Notifications

#### FR-6.1: Send Booking Confirmation Email to Patient
**Actor:** System (automated)  
**Trigger:** Successful appointment booking creation

**Data Required:**
- Patient name
- Patient email
- Therapist name
- Therapist specialization
- Appointment date
- Appointment start time
- Appointment end time
- Cancellation URL

**Process:**
1. Create email HTML content with appointment details
2. Generate cancellation URL using base URL and cancellation token
3. Send email to patient's email address
4. Subject line: "Appointment Confirmed with {therapist_name}"

**Content Includes:**
- Greeting with patient name
- Confirmation message
- Appointment details box with date, time, therapist name, specialization
- Cancellation link button
- Note about 24-hour cancellation policy
- Thank you message

---

#### FR-6.2: Send Booking Confirmation Email to Therapist
**Actor:** System (automated)  
**Trigger:** Successful appointment booking creation

**Data Required:**
- Therapist email
- Patient name
- Patient email
- Patient phone
- Appointment date
- Appointment start time
- Appointment end time

**Process:**
1. Create email HTML content with appointment and patient details
2. Send email to therapist's email address
3. Subject line: "New Appointment Booking - {patient_name}"

**Content Includes:**
- Notification of new booking
- Appointment details box with date, time
- Patient information (name, email, phone)

---

#### FR-6.3: Send Cancellation Confirmation Email to Patient
**Actor:** System (automated)  
**Trigger:** Successful appointment cancellation

**Data Required:**
- Patient name
- Patient email
- Therapist name
- Appointment date
- Appointment start time
- Appointment end time

**Process:**
1. Create email HTML content with cancelled appointment details
2. Send email to patient's email address
3. Subject line: "Appointment Cancelled - {therapist_name}"

**Content Includes:**
- Greeting with patient name
- Cancellation message
- Cancelled appointment details box
- Invitation to book new appointment

---

#### FR-6.4: Send Cancellation Notification Email to Therapist
**Actor:** System (automated)  
**Trigger:** Successful appointment cancellation

**Data Required:**
- Therapist email
- Patient name
- Patient email
- Appointment date
- Appointment start time
- Appointment end time

**Process:**
1. Create email HTML content with cancelled appointment details
2. Send email to therapist's email address
3. Subject line: "Appointment Cancelled - {patient_name}"

**Content Includes:**
- Cancellation notification message
- Cancelled appointment details box
- Patient information (name, email)

---

## Business Rules

### BR-1: Appointment Slot Structure
- Each appointment slot is 90 minutes total
- First 60 minutes: actual therapy session
- Next 30 minutes: break/cleanup time
- Maximum 2 appointments per therapist per day
- Slots are generated dynamically based on:
  - Weekly recurring availability
  - Blocked slots
  - Existing bookings

### BR-2: Date and Time Validation
- Cannot book appointments for past dates
- Cannot book appointments for past times on current date
- Date format must be YYYY-MM-DD
- Time format must be HH:MM (24-hour format)

### BR-3: Cancellation Policy
- Appointments can only be cancelled if at least 24 hours remain before the appointment
- Cancellation is done via unique token link
- Once cancelled, appointments cannot be uncancelled (status change is permanent)

### BR-4: Conflict Resolution
- Multiple patients cannot book the same therapist at the same time
- If a slot is booked, it is immediately removed from available slots
- Blocked slots take precedence over weekly availability

### BR-5: Email Delivery
- Email sending failures should not prevent booking/cancellation operations
- All email operations are asynchronous
- Email errors should be logged but not block user operations

### BR-6: Authentication
- Therapist accounts require authentication for:
  - Viewing appointments
  - Updating availability
  - Accessing dashboard
- Patients do not require accounts (public booking)
- Authentication token expires after a set duration
- Each request to protected endpoints must include valid authentication token

### BR-7: Data Integrity
- Email addresses must be unique for therapists
- Cancellation tokens must be unique
- Therapist must exist before appointments can be booked
- Bookings must reference valid therapist IDs

---

## User Interface Requirements

### UI-1: Landing Page
- Display application name and description
- Navigation to therapist registration and login
- Navigation to therapist list (if listing feature exists)
- Responsive design for mobile and desktop

### UI-2: Therapist Registration Page
- Form with fields: email, password, name, specialization, bio
- Form validation for required fields
- Submit button
- Link to login page for existing users
- Error message display area

### UI-3: Therapist Login Page
- Form with fields: email, password
- Form validation for required fields
- Submit button
- Link to registration page
- Error message display area

### UI-4: Therapist Dashboard (Protected)
- Display therapist name and welcome message
- Show therapist profile card with:
  - Specialization
  - Bio
  - Unique booking URL (copyable)
- Quick actions section with buttons to:
  - Manage availability
  - Refresh bookings list
- Current availability display (collapsible)
- Availability management interface (expandable)
- Bookings table showing:
  - Patient name
  - Date
  - Time
  - Contact information (email, phone)
  - Status (pending/confirmed/cancelled)
  - Booking creation date
- Status chips with color coding:
  - Confirmed: green
  - Pending: yellow
  - Cancelled: red
- Responsive design

### UI-5: Availability Management Interface
- Weekly availability editor:
  - List of days (Sunday through Saturday)
  - For each day: start time and end time inputs
  - Add/remove/update weekly availability entries
- Blocked slots editor:
  - Add blocked dates/times
  - Remove blocked entries
  - Display list of current blocked slots
- Save button
- Cancel button to discard changes

### UI-6: Booking Page (Public)
- Therapist profile card at top showing:
  - Name
  - Specialization
  - Bio
- Multi-step booking form:
  - Step 1: Select date and time
  - Step 2: Enter patient details
  - Step 3: Confirmation
- Weekly calendar view showing available and booked slots
- Slot status indicators:
  - Available: clickable slots
  - Booked: grayed out
  - Blocked: marked as unavailable
- Navigation buttons to view different weeks
- Patient details form:
  - Full name (required)
  - Email (required, validated)
  - Phone number (required)
- Submit button
- Error and success message display
- Loading indicators during API calls
- Responsive design

### UI-7: Booking Confirmation Page
- Display confirmation message
- Show appointment details:
  - Therapist name, specialization, bio
  - Appointment date and time
  - Status
  - Booking ID
- Show patient information
- Action buttons (only if not cancelled):
  - Cancel appointment
  - Reschedule appointment (if implemented)
- Return to home button
- Responsive design

---

## API Endpoint Summary

### Authentication Endpoints
- `POST /auth/register` - Create therapist account
- `POST /auth/login` - Authenticate therapist
- `GET /auth/verify` - Verify authentication token

### Therapist Endpoints
- `GET /therapist/{id}/profile` - Get public therapist profile
- `GET /therapist/{id}/availability` - Get available time slots (with startDate and endDate query params)
- `PUT /therapist/availability` - Update availability (requires auth)
- `GET /therapist/availability` - Get current availability settings (requires auth)
- `GET /therapist/list` - List all therapists (optional feature)
- `GET /therapist/bookings` - Get therapist's bookings (requires auth, with optional status/limit/offset query params)

### Booking Endpoints
- `POST /booking/create` - Create new appointment booking
- `DELETE /booking/cancel/{token}` - Cancel booking by cancellation token
- `GET /booking/details/{token}` - Get booking details by cancellation token

---

## Implementation Phases

### Phase 1: Foundation
1. Set up project structure
2. Implement data models (Therapist, Booking)
3. Implement database connection
4. Implement authentication and authorization infrastructure

### Phase 2: Authentication
1. Implement therapist registration
2. Implement therapist login
3. Implement token verification
4. Implement JWT token generation and validation
5. Implement password hashing

### Phase 3: Basic Profile
1. Implement view therapist profile (public)
2. Implement therapist dashboard (protected)
3. Implement navigation and routing

### Phase 4: Availability Management
1. Implement weekly availability storage and retrieval
2. Implement blocked slots storage and retrieval
3. Implement availability calculation algorithm
4. Implement availability management UI

### Phase 5: Booking System
1. Implement create booking endpoint
2. Implement booking conflict checking
3. Implement date validation
4. Implement cancellation endpoint with 24-hour policy
5. Implement booking details endpoint

### Phase 6: Email Notifications
1. Set up email service (SMTP/SES)
2. Implement patient confirmation email
3. Implement therapist notification email
4. Implement cancellation emails

### Phase 7: UI Implementation
1. Implement landing page
2. Implement login/register pages
3. Implement therapist dashboard
4. Implement booking page with calendar
5. Implement booking confirmation page

### Phase 8: Testing & Refinement
1. Test all workflows end-to-end
2. Test edge cases (past dates, conflicts, cancellations)
3. Test email delivery
4. Performance testing
5. Security testing

---

## Success Criteria

### Functionality
✅ Therapists can register and log in  
✅ Therapists can set weekly recurring availability  
✅ Therapists can block specific dates/times  
✅ Therapists can view all their appointments  
✅ Patients can view available time slots  
✅ Patients can book appointments without logging in  
✅ Appointments cannot be double-booked  
✅ Patients receive confirmation emails  
✅ Therapists receive notification emails  
✅ Patients can cancel appointments via unique link  
✅ Cancellation requires 24-hour notice  
✅ Cancellation emails are sent to both parties  
✅ Past date booking is prevented  
✅ Booking conflicts are prevented  
✅ Maximum 2 appointments per day enforced  

### User Experience
✅ Clear, intuitive interface  
✅ Responsive design for mobile and desktop  
✅ Clear error messages  
✅ Loading indicators during operations  
✅ Success confirmations  
✅ Accessible design  

### Technical
✅ Secure password storage  
✅ JWT token authentication  
✅ API input validation  
✅ Proper error handling  
✅ Email sending (graceful failure on email errors)  
✅ Cross-origin resource sharing (CORS) support  

---

## Non-Functional Requirements

### Security
- Passwords must be hashed using industry-standard algorithms (e.g., bcrypt)
- Authentication tokens must have expiration times
- All user inputs must be validated and sanitized
- Protected routes require valid authentication tokens
- CORS must be properly configured
- Sensitive data (passwords) must never be returned in API responses

### Performance
- API responses should be under 500ms for most operations
- Database queries should be optimized with appropriate indexes
- Pagination should be implemented for large datasets

### Reliability
- Email sending failures should not prevent booking/cancellation operations
- System should gracefully handle missing or invalid data
- Appropriate error messages should be returned for all error conditions

### Maintainability
- Code should be well-organized and documented
- Separation of concerns (models, services, controllers)
- Reusable utility functions

### Scalability
- System should support multiple therapists
- System should handle concurrent bookings
- Database should be indexed for performance

---

## Out of Scope (Future Enhancements)
- Payment processing
- SMS notifications
- Calendar integrations (Google Calendar, Outlook)
- Patient accounts and login
- Recurring appointment series
- Waiting list functionality
- Reminder notifications (pre-appointment)
- Multi-language support
- Admin dashboard
- Analytics and reporting
- Video consultation integration
- Document upload and sharing

