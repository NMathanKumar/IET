/**
 * Product Types
 * Matching OpenAPI schema: ProductWithFees, Fee, ProductStatus
 */

export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Fee {
  country: string;        // ISO 3166-1 alpha-3, e.g. AUS, USA, IND
  currency: string;       // ISO 4217, e.g. AUD, USD, INR
  basePrice: number;      // The base price in the given currency
}

export interface Product {
  id: string;             // Unique identifier of the product
  name: string;           // HST, MST or LST
  description: string;    // Human-readable description
  status: ProductStatus;
  fees: Fee[];            // The price of the product in each supported country
}
