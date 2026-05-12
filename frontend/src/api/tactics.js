import client from "./client";

export const listTactics = () => client.get("/api/tactics/").then((r) => r.data);
export const refreshMitre = () => client.post("/api/mitre/refresh").then((r) => r.data);
