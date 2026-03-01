import { expect, test } from '@playwright/test'

test('home route responds successfully', async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/`)

  expect(response.ok()).toBeTruthy()
  expect(response.status()).toBe(200)
})
