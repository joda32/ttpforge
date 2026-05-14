import client from "./client";

export const login = (username, password) =>
  client.post("/api/auth/login", { username, password }).then((r) => r.data);

export const signup = (data) =>
  client.post("/api/auth/signup", data).then((r) => r.data);

export const fetchMe = () =>
  client.get("/api/auth/me").then((r) => r.data);

export const logout = () =>
  client.post("/api/auth/logout").catch(() => {});

export const listUsers = () =>
  client.get("/api/admin/users").then((r) => r.data);

export const updateUser = (id, data) =>
  client.put(`/api/admin/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id) =>
  client.delete(`/api/admin/users/${id}`);
