import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/settings";

export const useSettings = () =>
  useQuery({ queryKey: ["app-settings"], queryFn: api.getSettings, staleTime: 60000 });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-settings"] }),
  });
};
