import client from "./client";

export const getTTPs = (params) => client.get("/api/ttps/", { params }).then((r) => r.data);
export const getTTP = (id) => client.get(`/api/ttps/${id}`).then((r) => r.data);
export const createTTP = (data) => client.post("/api/ttps/", data).then((r) => r.data);
export const updateTTP = (id, data) => client.put(`/api/ttps/${id}`, data).then((r) => r.data);
export const deleteTTP = (id) => client.delete(`/api/ttps/${id}`);
