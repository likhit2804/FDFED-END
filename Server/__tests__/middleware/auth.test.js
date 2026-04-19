import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-secret-key-for-jest';

// Import auth middleware
const auth = (await import('../../controllers/shared/auth.js')).default;

// Helper to create mock req/res/next
function createMocks(overrides = {}) {
  const req = {
    cookies: {},
    headers: {},
    originalUrl: '/api/test',
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
    clearCookie: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('Auth Middleware', () => {
  test('should reject request with no token (API request)', async () => {
    const { req, res, next } = createMocks();
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject invalid/expired token', async () => {
    const { req, res, next } = createMocks({
      cookies: { token: 'invalid-token-string' },
    });
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
  });

  test('should set req.user on valid token from cookie', async () => {
    const payload = { id: '123', email: 'test@test.com', userType: 'Resident' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next } = createMocks({
      cookies: { token },
    });
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.email).toBe('test@test.com');
    expect(req.user.userType).toBe('Resident');
  });

  test('should accept token from Authorization header', async () => {
    const payload = { id: '456', email: 'bearer@test.com', userType: 'CommunityManager' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next } = createMocks({
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    });
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.email).toBe('bearer@test.com');
  });

  test('should prefer Authorization header token when both cookie and header exist', async () => {
    const cookiePayload = { id: '1', email: 'cookie@test.com', userType: 'Resident' };
    const headerPayload = { id: '2', email: 'header@test.com', userType: 'Worker' };
    const { req, res, next } = createMocks({
      cookies: { token: jwt.sign(cookiePayload, process.env.JWT_SECRET) },
      headers: { authorization: `Bearer ${jwt.sign(headerPayload, process.env.JWT_SECRET)}` },
    });
    await auth(req, res, next);
    expect(req.user.email).toBe('header@test.com');
  });
});
