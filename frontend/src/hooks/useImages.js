import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchImages, uploadImage, updateImageCaption, deleteImage } from "../api/images";

export const useImages = (entryId) =>
  useQuery({
    queryKey: ["images", entryId],
    queryFn: () => fetchImages(entryId),
    enabled: !!entryId,
  });

export const useUploadImage = (entryId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => uploadImage(entryId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", entryId] }),
  });
};

export const useUpdateImageCaption = (entryId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, caption }) => updateImageCaption(imageId, caption),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", entryId] }),
  });
};

export const useDeleteImage = (entryId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId) => deleteImage(imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", entryId] }),
  });
};
