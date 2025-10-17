/**
 * Logo Verification Tests
 * Verifies that team logos are accessible and valid
 */

import { createClient } from '@supabase/supabase-js';
import { ImageService } from '@/lib/services/image-service';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and anon key are required for this test');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe('Logo Verification', () => {
  let teams: any[] = [];

  beforeAll(async () => {
    // Fetch all teams from the database
    const { data, error } = await supabase.from('teams').select('*');
    if (error) {
      throw new Error(`Error fetching teams: ${error.message}`);
    }
    teams = data || [];
  });

  test('should have teams to test', () => {
    expect(teams.length).toBeGreaterThan(0);
  });

  test('should have valid logo URLs for all teams', () => {
    teams.forEach(team => {
      if (team.logo_url) {
        expect(typeof team.logo_url).toBe('string');
        expect(team.logo_url).toMatch(/^https?:\/\//);
      }
    });
  });

  test('should be able to fetch logo for each team', async () => {
    for (const team of teams) {
      if (team.logo_url) {
        try {
          const response = await fetch(team.logo_url);
          expect(response.ok).toBe(true);
          // Check content type to ensure it is an image
          const contentType = response.headers.get('content-type');
          expect(contentType).toMatch(/^image\//);
        } catch (error) {
          // Fail the test if any logo fails to fetch
          fail(`Failed to fetch logo for team ${team.name}: ${error}`);
        }
      }
    }
  }, 30000); // 30 second timeout for all logos

  test('ImageService should return valid logo URLs', () => {
    const imageService = new ImageService();
    teams.forEach(team => {
      const logoResult = imageService.getTeamLogoUrl(team.name, team.sport, team.league);
      expect(logoResult).toBeDefined();
      expect(logoResult.url).toBeDefined();
      expect(typeof logoResult.url).toBe('string');
      expect(logoResult.url).not.toBe('https://example.com/default-logo.png');
    });
  });
});