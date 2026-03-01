import { describe, expect, it } from 'vitest'
import { errorResponse } from '../../lib/api-response'

describe('api-response integration', () => {
  it('returns consistent error payload and status', async () => {
    const response = errorResponse('Unauthorized', 401)

    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body).toEqual({
      error: 'Unauthorized',
      success: false,
    })
  })
})
