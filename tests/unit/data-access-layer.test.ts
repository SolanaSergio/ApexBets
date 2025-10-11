
import { dal } from '@/lib/data/data-access-layer'

describe('DataAccessLayer', () => {
  it('should be a singleton', () => {
    const instance1 = dal
    const instance2 = dal
    expect(instance1).toBe(instance2)
  })

  it('should query the database', async () => {
    const data = await dal.query('sports', { limit: 1 })
    expect(data).toBeInstanceOf(Array)
    expect(data.length).toBe(1)
  })

  it('should upsert data into the database', async () => {
    const data = [{ id: 'test', name: 'Test Sport', is_active: true }]
    const result = await dal.upsert('sports', data)
    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('test')
  })
})
