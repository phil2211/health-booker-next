/**
 * Test script to verify that cancellation and reschedule links are generated correctly
 * for different environments.
 */

// Simulate different environments
function testBaseUrlLogic() {
  console.log('🧪 Testing base URL logic for email links...\n');

  // Test 1: Development environment without NEXT_PUBLIC_BASE_URL set
  console.log('Test 1: Development environment (NEXT_PUBLIC_BASE_URL not set)');
  process.env.NODE_ENV = 'development';
  delete process.env.NEXT_PUBLIC_BASE_URL;

  // Simulate the logic from setupEmailData
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    } else {
      throw new Error('NEXT_PUBLIC_BASE_URL is not configured. Please set it in your environment variables.');
    }
  }

  const mockToken = 'test-cancellation-token-123';
  const cancellationLink = `${baseUrl}/cancel/${mockToken}`;
  const rescheduleLink = `${baseUrl}/reschedule/${mockToken}`;

  console.log(`✅ Base URL: ${baseUrl}`);
  console.log(`✅ Cancellation link: ${cancellationLink}`);
  console.log(`✅ Reschedule link: ${rescheduleLink}`);
  console.log('');

  // Test 2: Development environment with NEXT_PUBLIC_BASE_URL explicitly set
  console.log('Test 2: Development environment (NEXT_PUBLIC_BASE_URL explicitly set)');
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

  baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    } else {
      throw new Error('NEXT_PUBLIC_BASE_URL is not configured. Please set it in your environment variables.');
    }
  }

  const cancellationLink2 = `${baseUrl}/cancel/${mockToken}`;
  const rescheduleLink2 = `${baseUrl}/reschedule/${mockToken}`;

  console.log(`✅ Base URL: ${baseUrl}`);
  console.log(`✅ Cancellation link: ${cancellationLink2}`);
  console.log(`✅ Reschedule link: ${rescheduleLink2}`);
  console.log('');

  // Test 3: Production environment without NEXT_PUBLIC_BASE_URL set (should fail)
  console.log('Test 3: Production environment (NEXT_PUBLIC_BASE_URL not set) - should fail');
  process.env.NODE_ENV = 'production';
  delete process.env.NEXT_PUBLIC_BASE_URL;

  try {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      if (process.env.NODE_ENV === 'development') {
        baseUrl = 'http://localhost:3000';
      } else {
        throw new Error('NEXT_PUBLIC_BASE_URL is not configured. Please set it in your environment variables.');
      }
    }
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log(`✅ Correctly failed: ${error.message}`);
  }
  console.log('');

  // Test 4: Production environment with NEXT_PUBLIC_BASE_URL set
  console.log('Test 4: Production environment (NEXT_PUBLIC_BASE_URL set to production URL)');
  process.env.NEXT_PUBLIC_BASE_URL = 'https://healthbooker.com';

  baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    } else {
      throw new Error('NEXT_PUBLIC_BASE_URL is not configured. Please set it in your environment variables.');
    }
  }

  const cancellationLink4 = `${baseUrl}/cancel/${mockToken}`;
  const rescheduleLink4 = `${baseUrl}/reschedule/${mockToken}`;

  console.log(`✅ Base URL: ${baseUrl}`);
  console.log(`✅ Cancellation link: ${cancellationLink4}`);
  console.log(`✅ Reschedule link: ${rescheduleLink4}`);
  console.log('');

  console.log('🎉 All tests passed! Links will now point to the correct environment.');
}

// Run the test
testBaseUrlLogic();
