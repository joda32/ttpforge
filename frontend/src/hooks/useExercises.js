import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/exercises";

export const useExercises = () =>
  useQuery({ queryKey: ["exercises"], queryFn: api.getExercises, staleTime: 5000 });

export const useExercise = (id) =>
  useQuery({ queryKey: ["exercises", id], queryFn: () => api.getExercise(id), enabled: !!id });

export const useExerciseSummary = (id) =>
  useQuery({
    queryKey: ["exercises", id, "summary"],
    queryFn: () => api.getExerciseSummary(id),
    enabled: !!id,
    staleTime: 5000,
  });

export const useExerciseEntries = (id, params) =>
  useQuery({
    queryKey: ["exercises", id, "entries", params],
    queryFn: () => api.getExerciseEntries(id, params),
    enabled: !!id,
    staleTime: 5000,
  });

export const useCreateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};

export const useUpdateExercise = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id
      ? (data) => api.updateExercise(id, data)
      : ({ id: dynId, data }) => api.updateExercise(dynId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};

export const useDeleteExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};
