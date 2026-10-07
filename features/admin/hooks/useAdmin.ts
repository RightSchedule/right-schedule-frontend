"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UserStatusFilter } from "@/lib/api/admin";
import { qk } from "@/lib/query/keys";
import type { AdminBusinessDetail, BusinessStatus } from "@/types/domain";

export function usePlatformOverview(enabled = true) {
  return useQuery({ queryKey: qk.admin.overview, queryFn: adminApi.overview, enabled });
}

export function useAdminBusinesses(search: string, status: BusinessStatus | null, page: number) {
  return useQuery({
    queryKey: qk.admin.businesses(search, status, page),
    queryFn: () => adminApi.businesses({ search, status, page }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminBusiness(id: string) {
  return useQuery({
    queryKey: qk.admin.business(id),
    queryFn: () => adminApi.business(id),
    enabled: !!id,
  });
}

export function useAdminUsers(search: string, status: UserStatusFilter | null, page: number) {
  return useQuery({
    queryKey: qk.admin.users(search, status, page),
    queryFn: () => adminApi.users({ search, status, page }),
    placeholderData: keepPreviousData,
  });
}

/** Whole log when targetId is null, otherwise only the entries about that business or account. */
export function useAuditLog(targetId: string | null, page: number) {
  return useQuery({
    queryKey: qk.admin.audit(targetId, page),
    queryFn: () => adminApi.auditLog({ targetId: targetId ?? undefined, page }),
    placeholderData: keepPreviousData,
  });
}

/** Every admin write changes counters, lists and the audit log, so all admin queries are refreshed. */
function useAdminMutation<TVars, TData>(mutationFn: (vars: TVars) => Promise<TData>, onData?: (data: TData) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      onData?.(data);
      return qc.invalidateQueries({ queryKey: qk.admin.all });
    },
  });
}

function useBusinessTransition<TVars>(mutationFn: (vars: TVars) => Promise<AdminBusinessDetail>) {
  const qc = useQueryClient();
  return useAdminMutation(mutationFn, (business: AdminBusinessDetail) =>
    qc.setQueryData(qk.admin.business(business.id), business)
  );
}

export function useApproveBusiness() {
  return useBusinessTransition((id: string) => adminApi.approveBusiness(id));
}

export function useRejectBusiness() {
  return useBusinessTransition(({ id, reason }: { id: string; reason: string }) =>
    adminApi.rejectBusiness(id, reason)
  );
}

export function useSuspendBusiness() {
  return useBusinessTransition(({ id, reason }: { id: string; reason: string }) =>
    adminApi.suspendBusiness(id, reason)
  );
}

export function useReactivateBusiness() {
  return useBusinessTransition((id: string) => adminApi.reactivateBusiness(id));
}

export function useDisableUser() {
  return useAdminMutation(({ id, reason }: { id: string; reason: string }) => adminApi.disableUser(id, reason));
}

export function useEnableUser() {
  return useAdminMutation((id: string) => adminApi.enableUser(id));
}
