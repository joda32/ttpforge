import client from "./client";

export const getLLMConfig = () =>
  client.get("/api/attack-plan/config").then((r) => r.data);

export const updateLLMConfig = (data) =>
  client.put("/api/attack-plan/config", data).then((r) => r.data);

export const analyzeText = (text) =>
  client
    .post("/api/attack-plan/analyze", { source_type: "text", text })
    .then((r) => r.data);

export const analyzeUrl = (url) =>
  client
    .post("/api/attack-plan/analyze", { source_type: "url", url })
    .then((r) => r.data);

export const analyzePdf = (file) => {
  const form = new FormData();
  form.append("source_type", "pdf");
  form.append("file", file);
  return client.post("/api/attack-plan/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const convertPlan = (data) =>
  client.post("/api/attack-plan/convert", data).then((r) => r.data);
