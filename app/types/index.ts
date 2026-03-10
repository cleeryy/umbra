export interface Client {
  name: string
  config_file: string
  created_at?: string
}

export interface Status {
  vpn_status: string
  details: string
  clients_count: number
}

export interface Alert {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  message: string
}

export interface ApiError {
  error: string
  message?: string
}

export interface CreateClientRequest {
  name: string
}

export interface CreateClientResponse {
  message: string
}

export interface DeleteClientResponse {
  message: string
}

export interface RestartServiceResponse {
  message: string
}

export interface GetClientConfigResponse {
  config: string
}

export interface QRCodeResponse {
  qr_code: string
}

export interface HealthResponse {
  status: string
  service: string
}
