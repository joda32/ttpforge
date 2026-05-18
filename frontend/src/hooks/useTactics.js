import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTactics, refreshMitre } from "../api/tactics";

export const useTactics = (params) =>
  useQuery({ queryKey: ["tactics", params], queryFn: () => listTactics(params) });

export const useMitreRefresh = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refreshMitre,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ttps"] });
      qc.invalidateQueries({ queryKey: ["tactics"] });
      qc.invalidateQueries({ queryKey: ["ttp-coverage"] });
    },
  });
};
