import client from "./client";

export const getExercises = () => client.get("/api/exercises/").then((r) => r.data);
export const getExercise = (id) => client.get(`/api/exercises/${id}`).then((r) => r.data);
export const createExercise = (data) => client.post("/api/exercises/", data).then((r) => r.data);
export const updateExercise = (id, data) => client.put(`/api/exercises/${id}`, data).then((r) => r.data);
export const deleteExercise = (id) => client.delete(`/api/exercises/${id}`);
export const getExerciseSummary = (id) => client.get(`/api/exercises/${id}/summary`).then((r) => r.data);
export const getExerciseEntries = (id, params) =>
  client.get(`/api/exercises/${id}/entries`, { params }).then((r) => r.data);
