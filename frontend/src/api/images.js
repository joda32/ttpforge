import client from "./client";

export const uploadImage = (entryId, file) => {
  const form = new FormData();
  form.append("entry_id", entryId);
  form.append("file", file);
  return client
    .post("/api/images/", form, { headers: { "Content-Type": undefined } })
    .then((r) => r.data);
};

export const fetchImages = (entryId) =>
  client.get("/api/images/", { params: { entry_id: entryId } }).then((r) => r.data);

export const updateImageCaption = (imageId, caption) =>
  client.patch(`/api/images/${imageId}`, { caption }).then((r) => r.data);

export const deleteImage = (imageId) => client.delete(`/api/images/${imageId}`);
