import client from "./client";

export const listTags = () => client.get("/api/tags/").then((r) => r.data);
export const createTag = (data) => client.post("/api/tags/", data).then((r) => r.data);
export const updateTag = (id, data) => client.put(`/api/tags/${id}`, data).then((r) => r.data);
export const deleteTag = (id) => client.delete(`/api/tags/${id}`);
