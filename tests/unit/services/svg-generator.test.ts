/**
 * Unit tests for SVG Generator Service
 */

import { svgGenerator, SVGGenerator } from '@/lib/services/svg-generator'

describe('SVGGenerator', () => {
  let generator: SVGGenerator

  beforeEach(() => {
    generator = SVGGenerator.getInstance()
  })

  describe('generateTeamLogo', () => {
    it('should generate valid SVG for team logo', async () => {
      const svg = await generator.generateTeamLogo('Lakers', 'basketball', 'NBA')
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
      expect(svg).toContain('Lakers')
      expect(svg).toContain('NBA')
    })

    it('should handle team colors', async () => {
      const colors = { primary: '#FF0000', secondary: '#0000FF' }
      const svg = await generator.generateTeamLogo('Test Team', 'basketball', 'NBA', colors)
      
      expect(svg).toContain('#FF0000')
      expect(svg).toContain('#0000FF')
    })

    it('should generate fallback SVG on error', async () => {
      // Mock an error scenario
      const svg = await generator.generateTeamLogo('', '', '')
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
    })

    it('should handle different shapes', async () => {
      const circleSvg = await generator.generateTeamLogo('Test', 'basketball', 'NBA', undefined, { shape: 'circle' })
      const shieldSvg = await generator.generateTeamLogo('Test', 'basketball', 'NBA', undefined, { shape: 'shield' })
      
      expect(circleSvg).toContain('<circle')
      expect(shieldSvg).toContain('<path')
    })
  })

  describe('generatePlayerPhoto', () => {
    it('should generate valid SVG for player photo', async () => {
      const svg = await generator.generatePlayerPhoto('LeBron James', 'basketball')
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
      expect(svg).toContain('LJ') // Player initials
    })

    it('should handle player with team', async () => {
      const svg = await generator.generatePlayerPhoto('LeBron James', 'basketball', 'Lakers')
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
    })

    it('should generate fallback SVG on error', async () => {
      const svg = await generator.generatePlayerPhoto('', '')
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
    })
  })

  describe('svgToDataUri', () => {
    it('should convert SVG to data URI', () => {
      const svg = '<svg><circle/></svg>'
      const dataUri = generator.svgToDataUri(svg)
      
      expect(dataUri).toContain('data:image/svg+xml,')
      expect(dataUri).toContain(encodeURIComponent(svg))
    })
  })

  describe('getTeamInitials', () => {
    it('should extract initials from team name', () => {
      // Access private method through any cast for testing
      const generator = SVGGenerator.getInstance() as any
      
      expect(generator.getTeamInitials('Los Angeles Lakers')).toBe('LAL')
      expect(generator.getTeamInitials('Lakers')).toBe('LAK')
      expect(generator.getTeamInitials('Boston Celtics')).toBe('BC')
    })
  })

  describe('getPlayerInitials', () => {
    it('should extract initials from player name', () => {
      const generator = SVGGenerator.getInstance() as any
      
      expect(generator.getPlayerInitials('LeBron James')).toBe('LJ')
      expect(generator.getPlayerInitials('Kobe Bryant')).toBe('KB')
      expect(generator.getPlayerInitials('Michael')).toBe('MI')
    })
  })
})
