/**
 * Product Service
 * API calls for fetching products
 */

import { apiGet } from './apiClient';
import type { Product } from '../types/product';

const API_PATH = '/public/v1/products';

/**
 * Fetch all available products
 * @returns Array of products with their fees
 */
export async function getProducts(): Promise<Product[]> {
  const response = await apiGet<Product[]>(API_PATH);
  
  if (!response.data) {
    throw new Error('Failed to fetch products: No data returned');
  }
  
  return response.data;
}
