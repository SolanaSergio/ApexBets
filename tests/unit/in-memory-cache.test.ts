
import inMemoryCache from '@/lib/cache/in-memory-cache'

describe('inMemoryCache', () => {
  it('should set and get a value', () => {
    inMemoryCache.set('test', 'test')
    const value = inMemoryCache.get('test')
    expect(value).toBe('test')
  })

  it('should expire a value after the TTL', (done) => {
    inMemoryCache.set('test', 'test', 1)
    setTimeout(() => {
      const value = inMemoryCache.get('test')
      expect(value).toBeUndefined()
      done()
    }, 1100)
  })
})
