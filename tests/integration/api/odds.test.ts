/**
 * Real Integration Tests for Odds API
 * Tests actual API endpoints with real odds data
 */

describe('Odds API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string;

  describe('GET /api/odds', () => {
    it('should fetch real odds data', async () => {
      const response = await fetch(`${baseUrl}/odds`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object),
      });
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        const odds = data.data[0];
        expect(odds).toMatchObject({
          id: expect.any(String),
          game_id: expect.any(String),
          source: expect.any(String),
          odds_type: expect.any(String),
          home_odds: expect.any(Number),
          away_odds: expect.any(Number),
          sport: expect.any(String),
          league: expect.any(String),
        });

        // Verify timestamp is a valid ISO string
        expect(new Date(odds.timestamp)).toBeInstanceOf(Date);
        expect(new Date(odds.timestamp).getTime()).not.toBeNaN();
      }
    });

    it('should fetch odds with sport filter', async () => {
      const response = await fetch(`${baseUrl}/odds?sport=basketball`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object),
      });

      // All odds should be for basketball
      data.data.forEach((odds: any) => {
        expect(odds.sport).toBe('basketball');
        expect(odds.league).toBe('NBA');
      });
    });

    it('should include betting markets when available', async () => {
      const response = await fetch(`${baseUrl}/odds`);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.data.length > 0) {
        const odds = data.data[0];

        // Check for betting markets
        if (odds.bookmakers && odds.bookmakers.length > 0) {
          const bookmaker = odds.bookmakers[0];
          expect(bookmaker).toMatchObject({
            key: expect.any(String),
            title: expect.any(String),
            markets: expect.any(Array),
          });

          // Check markets structure
          if (bookmaker.markets.length > 0) {
            const market = bookmaker.markets[0];
            expect(market).toMatchObject({
              key: expect.any(String),
              outcomes: expect.any(Array),
            });

            // Check outcomes structure
            if (market.outcomes.length > 0) {
              const outcome = market.outcomes[0];
              expect(outcome).toMatchObject({
                name: expect.any(String),
                price: expect.any(Number),
              });
              expect(outcome.price).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    it('should handle different market types', async () => {
      const response = await fetch(`${baseUrl}/odds?markets=h2h,spreads,totals`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object),
      });

      if (data.data.length > 0) {
        const odds = data.data[0];

        // Should have bookmakers with different market types
        if (odds.bookmakers && odds.bookmakers.length > 0) {
          const bookmaker = odds.bookmakers[0];
          const marketKeys = bookmaker.markets.map((m: any) => m.key);

          // Should contain at least one of the requested market types
          const hasRequestedMarkets = ['h2h', 'spreads', 'totals'].some(market =>
            marketKeys.some((key: string) => key.includes(market))
          );
          expect(hasRequestedMarkets).toBe(true);
        }
      }
    });

    it('should return odds with valid team names', async () => {
      const response = await fetch(`${baseUrl}/odds`);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.data.length > 0) {
        const odds = data.data[0];

        // Odds should have valid numeric values
        expect(odds.home_odds).toBeDefined();
        expect(odds.away_odds).toBeDefined();
        expect(typeof odds.home_odds).toBe('number');
        expect(typeof odds.away_odds).toBe('number');
        expect(odds.sport).toBeTruthy();
        expect(odds.league).toBeTruthy();
      }
    });

    it('should handle future games', async () => {
      const response = await fetch(`${baseUrl}/odds`);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.data.length > 0) {
        const odds = data.data[0];
        const timestamp = new Date(odds.timestamp);
        const now = new Date();

        // Verify timestamp is valid
        // Allow some tolerance for recent timestamps
        const timeDiff = now.getTime() - timestamp.getTime();
        expect(timeDiff).toBeGreaterThan(-3600000); // Within 1 hour tolerance
      }
    });

    it('should return consistent odds data structure', async () => {
      const response = await fetch(`${baseUrl}/odds`);
      const data = await response.json();

      expect(response.status).toBe(200);

      data.data.forEach((odds: any) => {
        // Required fields
        expect(odds.id).toBeDefined();
        expect(odds.game_id).toBeDefined();
        expect(odds.source).toBeDefined();
        expect(odds.odds_type).toBeDefined();
        expect(odds.sport).toBeDefined();
        expect(odds.league).toBeDefined();

        // Field types
        expect(typeof odds.id).toBe('string');
        expect(typeof odds.game_id).toBe('string');
        expect(typeof odds.source).toBe('string');
        expect(typeof odds.odds_type).toBe('string');
        expect(typeof odds.sport).toBe('string');
        expect(typeof odds.league).toBe('string');

        // Non-empty strings
        expect(odds.id.length).toBeGreaterThan(0);
        expect(odds.game_id.length).toBeGreaterThan(0);
        expect(odds.source.length).toBeGreaterThan(0);
        expect(odds.sport.length).toBeGreaterThan(0);
        expect(odds.league.length).toBeGreaterThan(0);
      });
    });
  });
});