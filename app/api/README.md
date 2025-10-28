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

## Future Endpoints

Additional API routes will be added here as features are developed:
- `/api/therapist/availability` - Get available time slots for booking
- `/api/therapist/list` - List all therapists
- `/api/booking/create` - Create appointment booking
- `/api/booking/cancel` - Cancel booking by token

