import {
  Client,
  Status,
  LoginRequest,
  LoginResponse,
  ApiError,
  CreateClientRequest,
  CreateClientResponse,
  DeleteClientResponse,
  RestartServiceResponse,
  GetClientConfigResponse,
  QRCodeResponse,
  HealthResponse
} from '@/app/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface ApiResult<T> {
  data: T | null
  error: string | null
  status: number
}

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('umbra_token', token)
    } else {
      localStorage.removeItem('umbra_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('umbra_token')
    }
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('umbra_token')
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      })

      const status = response.status

      if (status === 401) {
        this.clearToken()
        return { data: null, error: 'Session expired. Please login again.', status }
      }

      if (status === 429) {
        const errorData = await response.json().catch(() => ({}))
        return {
          data: null,
          error: errorData.message || 'Rate limit exceeded. Please try again later.',
          status
        }
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }))
        return { data: null, error: errorData.error || errorData.message || 'Request failed', status }
      }

      const data: T = await response.json()
      return { data, error: null, status }
    } catch (err) {
      return {
        data: null,
        error: 'Network error. Please check your connection.',
        status: 0
      }
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResult<LoginResponse>> {
    const result = await this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (result.data?.token) {
      this.setToken(result.data.token)
    }

    return result
  }

  async logout() {
    this.clearToken()
  }

  async getStatus(): Promise<ApiResult<Status>> {
    return await this.request<Status>('/status')
  }

  async getClients(): Promise<ApiResult<Client[]>> {
    const result = await this.request<{ clients: Client[] }>('/clients')
    return { data: result.data?.clients || null, error: result.error, status: result.status }
  }

  async getClientConfig(name: string): Promise<ApiResult<string>> {
    const result = await this.request<GetClientConfigResponse>(`/clients/${name}`)
    return { data: result.data?.config || null, error: result.error, status: result.status }
  }

  async createClient(name: string): Promise<ApiResult<CreateClientResponse>> {
    return await this.request<CreateClientResponse>('/clients', {
      method: 'POST',
      body: JSON.stringify({ name } as CreateClientRequest),
    })
  }

  async deleteClient(name: string): Promise<ApiResult<DeleteClientResponse>> {
    return await this.request<DeleteClientResponse>(`/clients/${name}`, {
      method: 'DELETE',
    })
  }

  async restartService(): Promise<ApiResult<RestartServiceResponse>> {
    return await this.request<RestartServiceResponse>('/restart', {
      method: 'POST',
    })
  }

  async getQRCode(name: string): Promise<ApiResult<string>> {
    const result = await this.request<QRCodeResponse>(`/clients/${name}/qr`)
    return { data: result.data?.qr_code || null, error: result.error, status: result.status }
  }

  async healthCheck(): Promise<ApiResult<HealthResponse>> {
    return await this.request<HealthResponse>('/health')
  }
}

export const api = new ApiClient()
