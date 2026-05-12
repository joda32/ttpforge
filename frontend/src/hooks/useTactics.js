import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTactics, refreshMitre } from "../api/tactics";

export const useTactics = () =>
  useQuery({ queryKey: ["tactics"], queryFn: listTactics });

export const useMitreRefresh = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refreshMitre,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ttps"] });
      qc.invalidateQueries({ queryKey: ["tactics"] });
    },
  });
};
