import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/attackPlan";

export const useLLMConfig = () =>
  useQuery({ queryKey: ["llm-config"], queryFn: api.getLLMConfig, staleTime: 60000 });

export const useUpdateLLMConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateLLMConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["llm-config"] }),
  });
};

export const useAnalyzeReport = () =>
  useMutation({ mutationFn: ({ sourceType, content }) => {
    if (sourceType === "url")  return api.analyzeUrl(content);
    if (sourceType === "pdf")  return api.analyzePdf(content);
    return api.analyzeText(content);
  }});

export const useConvertPlan = () =>
  useMutation({ mutationFn: api.convertPlan });
