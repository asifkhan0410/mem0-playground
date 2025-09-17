import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const text = 'Hello, World!';
    expect(text.toLowerCase()).toBe('hello, world!');
    expect(text.length).toBe(13);
  });

  it('should handle array operations', () => {
    const items = ['apple', 'banana', 'cherry'];
    expect(items.length).toBe(3);
    expect(items.includes('banana')).toBe(true);
    expect(items.filter(item => item.startsWith('c'))).toEqual(['cherry']);
  });

  it('should handle object operations', () => {
    const user = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    };
    
    expect(user.id).toBe('123');
    expect(user.name).toBe('John Doe');
    expect(Object.keys(user)).toEqual(['id', 'name', 'email']);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});
