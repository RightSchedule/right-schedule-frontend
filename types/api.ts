export interface ApiError {
  status: number;
  detail: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
}

export interface AvailabilityResponse {
  date: string;
  slots: Array<{ start: string; end: string }>;
}
