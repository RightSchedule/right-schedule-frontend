"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { useInvalidatingMutation } from "@/lib/query/useInvalidatingMutation";
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

const staffKey = () => qk.staff.all;

export function useCreateStaff() {
  return useInvalidatingMutation((payload: StaffPayload) => staffApi.create(payload), staffKey);
}

export function useUpdateStaff() {
  return useInvalidatingMutation(
    ({ id, ...payload }: StaffPayload & { id: string }) => staffApi.update(id, payload),
    staffKey
  );
}

export function useDeactivateStaff() {
  return useInvalidatingMutation((id: string) => staffApi.deactivate(id), staffKey);
}

export function useSetStaffServices() {
  return useInvalidatingMutation(
    ({ id, serviceIds }: { id: string; serviceIds: string[] }) => staffApi.setServices(id, serviceIds),
    ({ id }) => qk.staff.services(id)
  );
}

export function useSetWorkingHours() {
  return useInvalidatingMutation(
    ({ id, entries }: { id: string; entries: WorkingHoursEntry[] }) => staffApi.setWorkingHours(id, entries),
    ({ id }) => qk.staff.workingHours(id)
  );
}

export function useAddException() {
  return useInvalidatingMutation(
    ({ id, ...payload }: ExceptionPayload & { id: string }) => staffApi.addException(id, payload),
    ({ id }) => qk.staff.exceptions(id)
  );
}

export function useDeleteException() {
  return useInvalidatingMutation(
    ({ staffId, exceptionId }: { staffId: string; exceptionId: string }) =>
      staffApi.deleteException(staffId, exceptionId),
    ({ staffId }) => qk.staff.exceptions(staffId)
  );
}
