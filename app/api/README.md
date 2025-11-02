# API Routes

This directory contains Next.js API routes for backend functionality.

## Available Endpoints

### `/api/health`
- **Method**: GET
- **Description**: Health check endpoint for monitoring and load balancers
- **Response**: 
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "health-booker-api"
  }
  ```

### Authentication Endpoints

#### `/api/auth/register`
- **Method**: POST
- **Description**: Register a new therapist account
- **Auth**: None required
- **Request Body**:
  ```json
  {
    "email": "therapist@example.com",
    "password": "secure-password",
    "name": "Dr. Jane Smith",
    "specialization": "Craniosacral Therapist",
    "bio": "Experienced therapist with 10 years..."
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "message": "Therapist registered successfully",
    "therapist": {
      "_id": "therapist-id",
      "email": "therapist@example.com",
      "name": "Dr. Jane Smith",
      "specialization": "Craniosacral Therapist",
      "bio": "Experienced therapist..."
    }
  }
  ```
- **Errors**: 400 Bad Request, 409 Conflict (email exists)

#### `/api/auth/verify`
- **Method**: GET
- **Description**: Verify authentication token and get current therapist profile
- **Auth**: Required (Bearer token via NextAuth)
- **Response**: 200 OK
  ```json
  {
    "therapist": {
      "_id": "therapist-id",
      "email": "therapist@example.com",
      "name": "Dr. Jane Smith",
      "specialization": "Craniosacral Therapist",
      "bio": "Experienced therapist..."
    },
    "authenticated": true
  }
  ```
- **Errors**: 401 Unauthorized, 404 Not Found

### Therapist Endpoints

#### `/api/therapist/[id]`
- **Method**: GET
- **Description**: Get public therapist profile by ID
- **Auth**: None required
- **URL Parameters**: `id` - Therapist ID (MongoDB ObjectId)
- **Response**: 200 OK
  ```json
  {
    "therapist": {
      "_id": "therapist-id",
      "email": "therapist@example.com",
      "name": "Dr. Jane Smith",
      "specialization": "Craniosacral Therapist",
      "bio": "Experienced therapist...",
      "photoUrl": "https://example.com/photo.jpg",
      "weeklyAvailability": [],
      "blockedSlots": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Errors**: 404 Not Found (invalid ID or therapist not found)

#### `/api/therapist/booking-url`
- **Method**: GET
- **Description**: Get booking URL for authenticated therapist
- **Auth**: Required (Bearer token via NextAuth)
- **Response**: 200 OK
  ```json
  {
    "bookingUrl": "https://your-domain.com/book/therapist-id",
    "therapistId": "therapist-id"
  }
  ```
- **Errors**: 401 Unauthorized

#### `/api/therapist/availability`
- **Method**: PUT
- **Description**: Update therapist's weekly availability and/or blocked slots
- **Auth**: Required (Bearer token via NextAuth)
- **Request Body**:
  ```json
  {
    "weeklyAvailability": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ],
    "blockedSlots": [
      {
        "date": "2024-01-15",
        "startTime": "12:00",
        "endTime": "13:00"
      }
    ]
  }
  ```
  - Either `weeklyAvailability` or `blockedSlots` (or both) must be provided
  - `dayOfWeek`: 0-6 (Sunday-Saturday)
  - Times must be in HH:MM format (24-hour)
- **Response**: 200 OK
  ```json
  {
    "weeklyAvailability": [...],
    "blockedSlots": [...],
    "message": "Availability updated successfully"
  }
  ```
- **Errors**: 400 Bad Request (invalid data), 401 Unauthorized, 404 Not Found

- **Method**: GET
- **Description**: Get current availability settings for authenticated therapist
- **Auth**: Required (Bearer token via NextAuth)
- **Response**: 200 OK
  ```json
  {
    "weeklyAvailability": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ],
    "blockedSlots": [
      {
        "date": "2024-01-15",
        "startTime": "12:00",
        "endTime": "13:00"
      }
    ]
  }
  ```
- **Errors**: 401 Unauthorized, 404 Not Found

#### `/api/therapist/[id]/availability`
- **Method**: GET
- **Description**: Get available time slots for booking within a date range
- **Auth**: None required (public endpoint)
- **URL Parameters**: `id` - Therapist ID (MongoDB ObjectId)
- **Query Parameters**:
  - `startDate` (required): YYYY-MM-DD format
  - `endDate` (required): YYYY-MM-DD format
- **Response**: 200 OK
  ```json
  {
    "slots": [
      {
        "date": "2024-01-15",
        "startTime": "09:00",
        "endTime": "10:30",
        "status": "available",
        "sessionStart": "09:00",
        "sessionEnd": "10:00",
        "breakStart": "10:00",
        "breakEnd": "10:30"
      },
      {
        "date": "2024-01-15",
        "startTime": "10:30",
        "endTime": "12:00",
        "status": "booked",
        "bookingId": "booking-id",
        "patientName": "John Doe",
        "patientEmail": "john@example.com"
      },
      {
        "date": "2024-01-16",
        "startTime": "00:00",
        "endTime": "00:00",
        "status": "unavailable"
      }
    ],
    "therapistId": "therapist-id",
    "startDate": "2024-01-15",
    "endDate": "2024-01-20"
  }
  ```
- **Slot Statuses**:
  - `available`: Can be booked by patient (includes session and break times)
  - `booked`: Already has an appointment (includes booking info)
  - `blocked`: Blocked by therapist
  - `unavailable`: No weekly availability for this day
  - `break`: Break time (30 min after session)
- **Errors**: 400 Bad Request (missing/invalid dates), 404 Not Found (invalid ID or therapist not found)

## Future Endpoints

Additional API routes will be added here as features are developed:
- `/api/therapist/list` - List all therapists
- `/api/booking/create` - Create appointment booking
- `/api/booking/cancel` - Cancel booking by token

