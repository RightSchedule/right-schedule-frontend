import { apiClient } from "./client";
import { fetchPage } from "./page";
import type {
  AdminBusiness,
  AdminBusinessDetail,
  AdminUser,
  AuditEntry,
  AuditTargetType,
  BusinessStatus,
  PlatformOverview,
} from "@/types/domain";
export type UserStatusFilter = "ACTIVE" | "DISABLED";

export const ADMIN_PAGE_SIZE = 25;

const base = "/api/v1/admin";

export const adminApi = {
  overview: () => apiClient.get<PlatformOverview>(`${base}/overview`),

  businesses: (params: { search?: string; status?: BusinessStatus | null; page?: number; size?: number }) =>
    fetchPage<AdminBusiness>(`${base}/businesses`, { size: ADMIN_PAGE_SIZE, ...params }),

  business: (id: string) => apiClient.get<AdminBusinessDetail>(`${base}/businesses/${id}`),

  approveBusiness: (id: string) =>
    apiClient.post<AdminBusinessDetail>(`${base}/businesses/${id}/approve`, undefined),

  rejectBusiness: (id: string, reason: string) =>
    apiClient.post<AdminBusinessDetail>(`${base}/businesses/${id}/reject`, { reason }),

  suspendBusiness: (id: string, reason: string) =>
    apiClient.post<AdminBusinessDetail>(`${base}/businesses/${id}/suspend`, { reason }),

  reactivateBusiness: (id: string) =>
    apiClient.post<AdminBusinessDetail>(`${base}/businesses/${id}/reactivate`, undefined),

  users: (params: { search?: string; status?: UserStatusFilter | null; page?: number; size?: number }) =>
    fetchPage<AdminUser>(`${base}/users`, { size: ADMIN_PAGE_SIZE, ...params }),

  disableUser: (id: string, reason: string) =>
    apiClient.post<AdminUser>(`${base}/users/${id}/disable`, { reason }),

  enableUser: (id: string) => apiClient.post<AdminUser>(`${base}/users/${id}/enable`, undefined),

  auditLog: (params: { targetType?: AuditTargetType; targetId?: string; page?: number; size?: number }) =>
    fetchPage<AuditEntry>(`${base}/audit-log`, { size: ADMIN_PAGE_SIZE, ...params }),
};
