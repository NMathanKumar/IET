/**
 * Payment Service Tests
 * Tests for payment API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiRequest } from '../apiClient';
import { createPaymentSession } from './payment';

// Mock apiRequest
vi.mock('../apiClient');

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentSession', () => {
    const mockEnrolmentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockPaymentSessionResponse = {
      enrolmentId: mockEnrolmentId,
      checkoutSessionId: 'cs_test_abc123xyz',
      clientSecret: 'sk_test_abc123xyz',
      publishableKey: 'pk_test_abc123xyz',
      status: 'PENDING',
    };

    it('should create a payment session for a valid enrolment', async () => {
      (apiRequest as any).mockResolvedValue({
        data: mockPaymentSessionResponse,
        status: 200,
        statusText: 'OK',
      });

      const result = await createPaymentSession(mockEnrolmentId);

      expect(apiRequest).toHaveBeenCalledWith(
        `/test-takers/v1/me/enrolments/${mockEnrolmentId}/payments`,
        'POST',
        undefined
      );
      expect(result).toEqual(mockPaymentSessionResponse);
    });

    it('should return null when no data is returned', async () => {
      (apiRequest as any).mockResolvedValue({
        data: null,
        status: 200,
        statusText: 'OK',
      });

      const result = await createPaymentSession(mockEnrolmentId);

      expect(result).toBeNull();
    });

    it('should throw error on 400 Bad Request', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Bad Request'));

      await expect(createPaymentSession(mockEnrolmentId)).rejects.toThrow('Bad Request');
    });

    it('should throw error on 401 Unauthorized', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Unauthorized'));

      await expect(createPaymentSession(mockEnrolmentId)).rejects.toThrow('Unauthorized');
    });

    it('should throw error on 404 Not Found (enrolment not found)', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Not Found'));

      await expect(createPaymentSession(mockEnrolmentId)).rejects.toThrow('Not Found');
    });

    it('should throw error on 409 Conflict (already paid)', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Conflict'));

      await expect(createPaymentSession(mockEnrolmentId)).rejects.toThrow('Conflict');
    });

    it('should handle error with status code in error object', async () => {
      const error = {
        status: 409,
        message: 'The enrolment is already paid',
      };

      (apiRequest as any).mockRejectedValue(error);

      await expect(createPaymentSession(mockEnrolmentId)).rejects.toThrow('The enrolment is already paid');
    });
  });
});
