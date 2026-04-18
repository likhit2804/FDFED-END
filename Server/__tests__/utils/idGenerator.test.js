import { jest } from '@jest/globals';
import { 
  generateCustomID, 
  generateVisitorID, 
  generateTransactionId, 
  generateRefundId 
} from '../../utils/idGenerator.js';

describe('ID Generator', () => {
  test('generateCustomID returns correct format: BASE-PREFIX-SUFFIX', () => {
    const id = generateCustomID('64a3f1c2d5e6', 'CS', 42);
    expect(id).toMatch(/^[A-Z0-9]+-[A-Z]{2}-\d{4}$/);
    expect(id).toContain('-CS-');
    expect(id).toContain('0042');
  });

  test('generateCustomID with random suffix has 4 digits', () => {
    const id = generateCustomID('abc123', 'PY');
    const suffix = id.split('-')[2];
    expect(suffix).toHaveLength(4);
    expect(Number(suffix)).toBeGreaterThanOrEqual(1000);
  });

  test('generateVisitorID returns UE-prefixed format', () => {
    const id = generateVisitorID('John', 1234);
    expect(id).toMatch(/^UE-[A-Z]{2}PA\d{4}$/);
  });

  test('generateTransactionId includes timestamp', () => {
    const id = generateTransactionId('TXN');
    expect(id).toMatch(/^TXN_\d+_[a-z0-9]+$/);
    const timestamp = id.split('_')[1];
    expect(Number(timestamp)).toBeGreaterThan(Date.now() - 5000);
  });

  test('generateRefundId uses RF prefix', () => {
    const id = generateRefundId('64a3f1c2');
    expect(id).toContain('-RF-');
  });
});