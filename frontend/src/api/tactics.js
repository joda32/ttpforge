import client from "./client";

export const listTactics = (params) => client.get("/api/tactics/", { params }).then((r) => r.data);
export const refreshMitre = (framework) =>
  client.post("/api/mitre/refresh", framework ? { framework } : {}).then((r) => r.data);
