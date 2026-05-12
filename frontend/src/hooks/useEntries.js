import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/entries";

export const useCreateEntry = (exerciseId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "summary"] });
    },
  });
};

export const useUpdateEntry = (exerciseId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateEntry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "summary"] });
    },
  });
};

export const useDeleteEntry = (exerciseId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "summary"] });
    },
  });
};
