/**
 * API Performance Tests
 * Measures response times and concurrent request handling
 */

describe('API Performance Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string;

  describe('Response Time Tests', () => {
    it('should respond to health endpoint within 500ms', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/health`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500); // 500ms
    });

    it('should respond to games endpoint within 3000ms', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/games`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds
    });

    it('should respond to teams endpoint within 2000ms', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/teams`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    it('should respond to predictions endpoint within 4000ms', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/predictions`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(4000); // 4 seconds
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent requests to health endpoint', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => fetch(`${baseUrl}/health`));

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 5 concurrent requests to games endpoint', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => fetch(`${baseUrl}/games`));

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 5 concurrent requests to teams endpoint', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => fetch(`${baseUrl}/teams`));

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Load Tests', () => {
    it('should handle large result sets from games endpoint', async () => {
      const response = await fetch(`${baseUrl}/games?limit=200`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(200);
    });

    it('should handle large result sets from teams endpoint', async () => {
      const response = await fetch(`${baseUrl}/teams?limit=100`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(100);
    });
  });
});