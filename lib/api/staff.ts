import { apiClient } from "./client";
import { listAll } from "./page";
import type { Staff, WorkingHours, AvailabilityException, DayOfWeek, ExceptionType } from "@/types/domain";

export interface StaffPayload {
  name: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface WorkingHoursEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ExceptionPayload {
  date: string;
  startTime?: string;
  endTime?: string;
  type: ExceptionType;
  reason?: string;
}

export const staffApi = {
  list: () => listAll<Staff>("/api/v1/staff"),

  get: (id: string) => apiClient.get<Staff>(`/api/v1/staff/${id}`),

  create: (payload: StaffPayload) =>
    apiClient.post<Staff>("/api/v1/staff", payload),

  update: (id: string, payload: StaffPayload) =>
    apiClient.put<Staff>(`/api/v1/staff/${id}`, payload),

  deactivate: (id: string) => apiClient.delete<void>(`/api/v1/staff/${id}`),

  // Service assignments
  getServices: (id: string) =>
    apiClient.get<string[]>(`/api/v1/staff/${id}/services`),

  setServices: (id: string, serviceIds: string[]) =>
    apiClient.put<void>(`/api/v1/staff/${id}/services`, { serviceIds }),

  addService: (staffId: string, serviceId: string) =>
    apiClient.post<void>(`/api/v1/staff/${staffId}/services/${serviceId}`, {}),

  removeService: (staffId: string, serviceId: string) =>
    apiClient.delete<void>(`/api/v1/staff/${staffId}/services/${serviceId}`),

  // Working hours
  getWorkingHours: (id: string) =>
    apiClient.get<WorkingHours[]>(`/api/v1/staff/${id}/working-hours`),

  setWorkingHours: (id: string, entries: WorkingHoursEntry[]) =>
    apiClient.put<WorkingHours[]>(`/api/v1/staff/${id}/working-hours`, { entries }),

  deleteWorkingHours: (staffId: string, hoursId: string) =>
    apiClient.delete<void>(`/api/v1/staff/${staffId}/working-hours/${hoursId}`),

  // Availability exceptions
  getExceptions: (id: string) =>
    apiClient.get<AvailabilityException[]>(`/api/v1/staff/${id}/availability-exceptions`),

  addException: (id: string, payload: ExceptionPayload) =>
    apiClient.post<AvailabilityException>(
      `/api/v1/staff/${id}/availability-exceptions`,
      payload
    ),

  deleteException: (staffId: string, exceptionId: string) =>
    apiClient.delete<void>(
      `/api/v1/staff/${staffId}/availability-exceptions/${exceptionId}`
    ),
};
