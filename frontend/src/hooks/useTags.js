import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/tags";

export const useTags = () =>
  useQuery({ queryKey: ["tags"], queryFn: api.listTags });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
};

export const useUpdateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateTag(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
};
