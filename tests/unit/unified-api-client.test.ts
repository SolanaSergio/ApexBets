
import { unifiedApiClient } from '@/lib/sports-apis/unified-client'

describe('unifiedApiClient', () => {
  it('should have a sportsdb client', () => {
    expect(unifiedApiClient.sportsdb).toBeDefined()
  })

  it('should have an espn client', () => {
    expect(unifiedApiClient.espn).toBeDefined()
  })

  it('should have an odds client', () => {
    expect(unifiedApiClient.odds).toBeDefined()
  })
})
