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

## Future Endpoints

Additional API routes will be added here as features are developed:
- `/api/providers` - CRUD operations for health providers
- `/api/bookings` - Booking management endpoints
- `/api/patients` - Patient management endpoints

