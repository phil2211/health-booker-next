// Jest mock for the 'resend' package
// This prevents actual network calls to Resend API during tests

const mockSend = jest.fn().mockResolvedValue({
  data: {
    id: 'test-email-id-12345'
  },
  error: null
});

class Resend {
  constructor(apiKey) {
    // Store API key for potential validation in tests
    this.apiKey = apiKey;
  }

  emails = {
    send: mockSend
  };
}

module.exports = { Resend, __mockSend: mockSend };
