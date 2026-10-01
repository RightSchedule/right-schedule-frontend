"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

/** Mutation that invalidates the given query keys once it succeeds. */
export function useInvalidatingMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  keys: (vars: TVars) => QueryKey
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: keys(vars) }),
  });
}
