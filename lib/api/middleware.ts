import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import logger from '@/lib/logger'
import type { Session } from 'next-auth'

type RouteContext = unknown

export type ApiHandler<C = RouteContext> = (req: Request, context: C) => Promise<Response> | Response

export type AuthenticatedApiHandler<C = RouteContext> = (
  req: Request,
  context: C,
  session: Session
) => Promise<Response> | Response

export function withErrorHandling<C = RouteContext>(route: string, handler: ApiHandler<C>): ApiHandler<C> {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      logger.error({ route, method: req.method, err: error }, 'Unhandled API route error')
      return errorResponse('Internal server error', 500)
    }
  }
}

export function withRequestLogging<C = RouteContext>(route: string, handler: ApiHandler<C>): ApiHandler<C> {
  return async (req, context) => {
    const startedAt = Date.now()
    const response = await handler(req, context)

    logger.info(
      {
        route,
        method: req.method,
        status: response.status,
        durationMs: Date.now() - startedAt,
      },
      'API request completed'
    )

    return response
  }
}

export function withAuth<C = RouteContext>(
  handler: AuthenticatedApiHandler<C>
): ApiHandler<C> {
  return async (req, context) => {
    const session = await auth()
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    return handler(req, context, session)
  }
}

export function withAdmin<C = RouteContext>(
  handler: AuthenticatedApiHandler<C>
): ApiHandler<C> {
  return withAuth(async (req, context, session) => {
    if (!session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    return handler(req, context, session)
  })
}
