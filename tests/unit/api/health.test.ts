/**
 * Health API Unit Tests
 * Tests the health endpoint with real data only
 */

describe('Health API Unit Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string;

  it('should return health status with real data', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  it('should return timestamp in health response', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  it('should respond within acceptable time limit', async () => {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/health`);
    const endTime = Date.now();
    
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
  });
});