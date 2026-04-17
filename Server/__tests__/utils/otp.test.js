import { jest } from '@jest/globals';

// Mock the email service so no real emails are sent during tests
jest.unstable_mockModule('../../utils/emailService.js', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendTemporaryPasswordEmail: jest.fn().mockResolvedValue(true),
}));

const { sendLoginOtp, verifyOtp, resendOtp, generateSecurePassword } = 
  await import('../../utils/otp.js');

describe('OTP Service', () => {
  test('sendLoginOtp should return true', async () => {
    const result = await sendLoginOtp('test@example.com');
    expect(result).toBe(true);
  });

  test('verifyOtp should accept correct OTP after send', async () => {
    // We need to access the internal store, so we use sendOtp which returns the code
    const { sendOtp } = await import('../../utils/otp.js');
    const code = await sendOtp('verify@test.com');
    const result = verifyOtp('verify@test.com', code);
    expect(result.ok).toBe(true);
  });

  test('verifyOtp should reject wrong OTP', async () => {
    const { sendOtp } = await import('../../utils/otp.js');
    await sendOtp('wrong@test.com');
    const result = verifyOtp('wrong@test.com', '000000');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('mismatch');
  });

  test('verifyOtp should return not_found for unknown email', () => {
    const result = verifyOtp('nobody@test.com', '123456');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_found');
  });

  test('verifyOtp should reject after too many attempts', async () => {
    const { sendOtp } = await import('../../utils/otp.js');
    await sendOtp('attempts@test.com');
    for (let i = 0; i < 6; i++) {
      verifyOtp('attempts@test.com', '000000');
    }
    const result = verifyOtp('attempts@test.com', '000000');
    expect(result.ok).toBe(false);
    // After max attempts, record is deleted
    expect(result.reason).toBe('not_found');
  });

  test('verifyOtp should clean up after successful verification', async () => {
    const { sendOtp } = await import('../../utils/otp.js');
    const code = await sendOtp('cleanup@test.com');
    verifyOtp('cleanup@test.com', code); // success — should delete
    const result = verifyOtp('cleanup@test.com', code); // second attempt
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_found');
  });

  test('resendOtp should generate a new OTP', async () => {
    const result = await resendOtp('resend@test.com');
    expect(result).toBe(true);
  });

  test('generateSecurePassword should include email prefix', () => {
    const password = generateSecurePassword('john.doe@example.com');
    expect(password).toMatch(/^john_.{8}$/);
    expect(password).toHaveLength(13); // 4 chars + _ + 8 chars
  });
});