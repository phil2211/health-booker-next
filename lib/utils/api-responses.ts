import { NextResponse } from 'next/server';

/**
 * Standardized API response utilities
 */

// Common HTTP status codes and their messages
const STATUS_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
} as const;

/**
 * Create a standardized error response
 */
export function createApiError(
  message: string,
  status: keyof typeof STATUS_MESSAGES = 500,
  details?: any
): NextResponse {
  const response = {
    error: message,
    ...(details && { details }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized success response
 */
export function createApiSuccess(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create a validation error response
 */
export function createValidationError(field: string, message: string): NextResponse {
  return createApiError(`Validation failed: ${field} - ${message}`, 400);
}

/**
 * Create a not found error response
 */
export function createNotFoundError(resource: string): NextResponse {
  return createApiError(`${resource} not found`, 404);
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedError(message: string = 'Authentication required'): NextResponse {
  return createApiError(message, 401);
}

/**
 * Create a conflict error response
 */
export function createConflictError(message: string): NextResponse {
  return createApiError(message, 409);
}

/**
 * Create a service unavailable error response (for email/external service failures)
 */
export function createServiceUnavailableError(message: string, details?: any): NextResponse {
  return createApiError(message, 503, details);
}

/**
 * Handle common API errors and return appropriate responses
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`${context} error:`, error);

  if (error instanceof Error) {
    // Email service errors
    if (error.message.includes('Resend API error') || error.message.includes('Failed to send')) {
      return createServiceUnavailableError(
        'Unable to send email. Please try again or contact support.',
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    }

    // Authentication errors
    if (error.message.includes('Unauthorized')) {
      return createUnauthorizedError();
    }

    // Validation errors
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return createApiError(error.message, 400);
    }

    // Conflict errors
    if (error.message.includes('conflict') || error.message.includes('already booked')) {
      return createConflictError('This time slot is already booked');
    }

    // Booking validation errors
    if (error.message.includes('Invalid booking data')) {
      return createApiError('Invalid booking information. Please check your details and try again.', 400);
    }
  }

  // Generic error
  return createApiError(
    'An unexpected error occurred. Please try again or contact support.',
    500,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}
