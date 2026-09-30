"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { staffApi, type StaffPayload, type WorkingHoursEntry, type ExceptionPayload } from "@/lib/api/staff";

export function useStaff() {
  return useQuery({
    queryKey: qk.staff.all,
    queryFn: staffApi.list,
  });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: qk.staff.one(id),
    queryFn: () => staffApi.get(id),
    enabled: !!id,
  });
}

export function useStaffServices(id: string) {
  return useQuery({
    queryKey: qk.staff.services(id),
    queryFn: () => staffApi.getServices(id),
    enabled: !!id,
  });
}

export function useWorkingHours(id: string) {
  return useQuery({
    queryKey: qk.staff.workingHours(id),
    queryFn: () => staffApi.getWorkingHours(id),
    enabled: !!id,
  });
}

export function useExceptions(id: string) {
  return useQuery({
    queryKey: qk.staff.exceptions(id),
    queryFn: () => staffApi.getExceptions(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffPayload) => staffApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: StaffPayload & { id: string }) =>
      staffApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staff.all }),
  });
}

export function useSetStaffServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, serviceIds }: { id: string; serviceIds: string[] }) =>
      staffApi.setServices(id, serviceIds),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: qk.staff.services(id) }),
  });
}

export function useSetWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entries }: { id: string; entries: WorkingHoursEntry[] }) =>
      staffApi.setWorkingHours(id, entries),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: qk.staff.workingHours(id) }),
  });
}

export function useAddException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ExceptionPayload & { id: string }) =>
      staffApi.addException(id, payload),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: qk.staff.exceptions(id) }),
  });
}

export function useDeleteException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, exceptionId }: { staffId: string; exceptionId: string }) =>
      staffApi.deleteException(staffId, exceptionId),
    onSuccess: (_, { staffId }) =>
      qc.invalidateQueries({ queryKey: qk.staff.exceptions(staffId) }),
  });
}
