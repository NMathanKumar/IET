/**
 * Enrolment Service Tests
 * Tests for enrolment API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiRequest } from '../apiClient';
import { createEnrolment, getEnrolments } from './enrolment';

// Mock apiRequest
vi.mock('../apiClient');

describe('Enrolment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEnrolment', () => {
    const mockEnrolmentResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userProfileId: '123e4567-e89b-12d3-a456-426614174000',
      userProfile: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sub: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
        givenName: 'John',
        familyName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
      },
      product: {
        id: 'product-123',
        name: 'HST',
        fee: {
          country: 'AUS',
          currency: 'AUD',
          basePrice: 89.99,
        },
      },
      status: 'IN_PROGRESS',
      enrolmentDateTime: '2025-01-15T10:30:00Z',
      createdOn: '2025-01-15T10:30:00Z',
      modifiedOn: '2025-01-15T10:30:00Z',
      createdBy: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
      modifiedBy: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
    };

    it('should create an enrolment with valid productId', async () => {
      const mockRequest = {
        productId: 'product-123',
      };

      (apiRequest as any).mockResolvedValue({
        data: mockEnrolmentResponse,
        status: 200,
        statusText: 'OK',
      });

      const result = await createEnrolment(mockRequest);

      expect(apiRequest).toHaveBeenCalledWith(
        '/test-takers/v1/me/enrolments',
        'POST',
        mockRequest
      );
      expect(result).toEqual(mockEnrolmentResponse);
    });

    it('should return null when no data is returned', async () => {
      const mockRequest = {
        productId: 'product-123',
      };

      (apiRequest as any).mockResolvedValue({
        data: null,
        status: 200,
        statusText: 'OK',
      });

      const result = await createEnrolment(mockRequest);

      expect(result).toBeNull();
    });

    it('should throw error on 400 Bad Request', async () => {
      const mockRequest = {
        productId: 'product-123',
      };

      (apiRequest as any).mockRejectedValue(new Error('Bad Request'));

      await expect(createEnrolment(mockRequest)).rejects.toThrow('Bad Request');
    });

    it('should throw error on 401 Unauthorized', async () => {
      const mockRequest = {
        productId: 'product-123',
      };

      (apiRequest as any).mockRejectedValue(new Error('Unauthorized'));

      await expect(createEnrolment(mockRequest)).rejects.toThrow('Unauthorized');
    });

    it('should throw error on 404 Not Found', async () => {
      const mockRequest = {
        productId: 'product-123',
      };

      (apiRequest as any).mockRejectedValue(new Error('Not Found'));

      await expect(createEnrolment(mockRequest)).rejects.toThrow('Not Found');
    });
  });

  describe('getEnrolments', () => {
    const mockEnrolments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userProfileId: '123e4567-e89b-12d3-a456-426614174000',
        userProfile: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sub: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
          givenName: 'John',
          familyName: 'Doe',
          email: 'john.doe@example.com',
          dateOfBirth: '1990-01-15',
        },
        product: {
          id: 'product-123',
          name: 'HST',
          fee: {
            country: 'AUS',
            currency: 'AUD',
            basePrice: 89.99,
          },
        },
        status: 'IN_PROGRESS',
        enrolmentDateTime: '2025-01-15T10:30:00Z',
        createdOn: '2025-01-15T10:30:00Z',
        modifiedOn: '2025-01-15T10:30:00Z',
        createdBy: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
        modifiedBy: 'ap-southeast-1_AbCdEf123:12345678-1234-1234-1234-123456789012',
      },
    ];

    it('should fetch all enrolments for the current user', async () => {
      (apiRequest as any).mockResolvedValue({
        data: mockEnrolments,
        status: 200,
        statusText: 'OK',
      });

      const result = await getEnrolments();

      expect(apiRequest).toHaveBeenCalledWith('/test-takers/v1/me/enrolments', 'GET');
      expect(result).toEqual(mockEnrolments);
    });

    it('should return empty array when no enrolments exist', async () => {
      (apiRequest as any).mockResolvedValue({
        data: [],
        status: 200,
        statusText: 'OK',
      });

      const result = await getEnrolments();

      expect(result).toEqual([]);
    });

    it('should throw error on 401 Unauthorized', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Unauthorized'));

      await expect(getEnrolments()).rejects.toThrow('Unauthorized');
    });
  });
});
