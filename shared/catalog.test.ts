import { describe, it, expect } from 'vitest';
import { Product, Category } from './catalog';

describe('Catalog Interfaces', () => {
  it('should define Product and Category interfaces', () => {
    const product: Product = {
      title: 'Test Product',
      imageUrl: 'test.jpg'
    };
    const category: Category = {
      title: 'Test Category',
      products: [product]
    };
    expect(product.title).toBe('Test Product');
    expect(category.title).toBe('Test Category');
  });
});
