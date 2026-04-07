import crypto from 'crypto'
import type { Logger } from 'pino'
import type { WorkerConfig } from './config.js'
import type {
  ClaimJobsResponse,
  ClaimedSyncJob,
  CompleteJobPayload,
  FailJobPayload,
  InternalApiEnvelope,
  ReconcileExecuteResponse,
  ReconcileScanResponse,
} from './types.js'

class InternalApiError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'InternalApiError'
    this.status = status
    this.payload = payload
  }
}

function buildBodyHash(body: string) {
  return crypto.createHash('sha256').update(body).digest('hex')
}

function buildSignature(params: {
  timestamp: number
  nonce: string
  method: string
  path: string
  body: string
  signingSecret: string
}) {
  const canonical = [
    String(params.timestamp),
    params.nonce,
    params.method.toUpperCase(),
    params.path,
    buildBodyHash(params.body),
  ].join('.')

  return crypto.createHmac('sha256', params.signingSecret).update(canonical).digest('hex')
}

export class InternalApiClient {
  constructor(
    private readonly config: WorkerConfig,
    private readonly logger: Logger
  ) {}

  private async signedRequest<T>(params: {
    path: string
    method: 'GET' | 'POST'
    body?: Record<string, unknown>
    correlationId: string
  }): Promise<T> {
    const bodyString = params.body ? JSON.stringify(params.body) : ''
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = crypto.randomUUID()
    const signature = buildSignature({
      timestamp,
      nonce,
      method: params.method,
      path: params.path,
      body: bodyString,
      signingSecret: this.config.internalSigningSecret,
    })

    const url = `${this.config.internalApiBaseUrl}${params.path}`
    const response = await fetch(url, {
      method: params.method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service-token': this.config.internalServiceToken,
        'x-internal-timestamp': String(timestamp),
        'x-internal-nonce': nonce,
        'x-internal-signature': signature,
        'x-internal-service-name': this.config.serviceName,
        'x-correlation-id': params.correlationId,
      },
      body: bodyString || undefined,
    })

    let parsedPayload: unknown
    try {
      parsedPayload = await response.json()
    } catch {
      parsedPayload = undefined
    }

    if (!response.ok) {
      const errorMessage =
        typeof parsedPayload === 'object' && parsedPayload && 'error' in parsedPayload
          ? String((parsedPayload as { error: unknown }).error)
          : `Internal API request failed with status ${response.status}`

      throw new InternalApiError(errorMessage, response.status, parsedPayload)
    }

    return parsedPayload as T
  }

  async claimJobs(params: {
    workerId: string
    guildId?: string
    limit: number
    correlationId: string
  }): Promise<ClaimedSyncJob[]> {
    const envelope = await this.signedRequest<InternalApiEnvelope<ClaimJobsResponse>>({
      path: '/api/internal/discord-sync/jobs/claim',
      method: 'POST',
      correlationId: params.correlationId,
      body: {
        workerId: params.workerId,
        guildId: params.guildId,
        limit: params.limit,
      },
    })

    if (!envelope.success || !envelope.data) {
      this.logger.warn(
        {
          correlationId: params.correlationId,
          response: envelope,
        },
        'Claim endpoint returned unsuccessful envelope'
      )
      return []
    }

    return envelope.data.jobs || []
  }

  async completeJob(params: {
    jobId: string
    payload: CompleteJobPayload
    correlationId: string
  }) {
    return this.signedRequest<InternalApiEnvelope<unknown>>({
      path: `/api/internal/discord-sync/jobs/${encodeURIComponent(params.jobId)}/complete`,
      method: 'POST',
      correlationId: params.correlationId,
      body: params.payload,
    })
  }

  async failJob(params: {
    jobId: string
    payload: FailJobPayload
    correlationId: string
  }) {
    return this.signedRequest<InternalApiEnvelope<unknown>>({
      path: `/api/internal/discord-sync/jobs/${encodeURIComponent(params.jobId)}/fail`,
      method: 'POST',
      correlationId: params.correlationId,
      body: params.payload,
    })
  }

  async scanReconcileCandidates(params: {
    guildId: string
    userId?: string
    limit?: number
    correlationId: string
  }) {
    const envelope = await this.signedRequest<InternalApiEnvelope<ReconcileScanResponse>>({
      path: '/api/internal/discord-sync/reconcile/scan',
      method: 'POST',
      correlationId: params.correlationId,
      body: {
        guildId: params.guildId,
        userId: params.userId,
        limit: params.limit,
      },
    })

    if (!envelope.success || !envelope.data) {
      throw new InternalApiError('Reconcile scan endpoint returned unsuccessful envelope', 500, envelope)
    }

    return envelope.data
  }

  async executeReconcile(params: {
    guildId: string
    userId?: string
    dryRun: boolean
    mode: 'scheduled' | 'targeted' | 'manual'
    reason?: string
    correlationId: string
  }) {
    const envelope = await this.signedRequest<InternalApiEnvelope<ReconcileExecuteResponse>>({
      path: '/api/internal/discord-sync/reconcile',
      method: 'POST',
      correlationId: params.correlationId,
      body: {
        guildId: params.guildId,
        userId: params.userId,
        dryRun: params.dryRun,
        mode: params.mode,
        reason: params.reason,
      },
    })

    if (!envelope.success || !envelope.data) {
      throw new InternalApiError('Reconcile execute endpoint returned unsuccessful envelope', 500, envelope)
    }

    return envelope.data
  }
}

export { InternalApiError }
