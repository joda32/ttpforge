import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/ttps";

export const useTTPs = (params) =>
  useQuery({ queryKey: ["ttps", params], queryFn: () => api.getTTPs(params), staleTime: 30000 });

export const useCreateTTP = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTTP,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ttps"] }),
  });
};

export const useDeleteTTP = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTTP,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ttps"] }),
  });
};
