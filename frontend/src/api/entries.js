import client from "./client";

export const createEntry = (data) => client.post("/api/entries/", data).then((r) => r.data);
export const getEntryChangelog = (entryId) => client.get(`/api/entries/${entryId}/changelog`).then((r) => r.data);
export const importTemplate = (exerciseId, entries) =>
  client.post(`/api/exercises/${exerciseId}/import-template`, { entries }).then((r) => r.data);
export const updateEntry = (id, data) => client.put(`/api/entries/${id}`, data).then((r) => r.data);
export const deleteEntry = (id) => client.delete(`/api/entries/${id}`);

export const importNavigatorLayer = (exerciseId, layer) =>
  client.post(`/api/exercises/${exerciseId}/import-navigator`, layer).then((r) => r.data);

export const reorderAttackPath = (exerciseId, steps) =>
  client.patch(`/api/exercises/${exerciseId}/attack-path`, { steps }).then((r) => r.data);

export const removeFromAttackPath = (exerciseId, entryId) =>
  client.delete(`/api/exercises/${exerciseId}/attack-path/${entryId}`).then((r) => r.data);

export const exportEntriesCSV = async (exerciseId, exerciseName) => {
  const response = await client.get(`/api/exercises/${exerciseId}/entries`);
  const entries = response.data.data;

  const headers = [
    "MITRE ID", "TTP Name", "Tactic", "Tool Used", "Source", "Destination",
    "Command Used", "Executed At", "Detected (Y/N)", "Detection Method",
    "Alert Name", "Time to Detect (min)", "Outcome", "Gap Identified",
  ];

  const rows = entries.map((e) => [
    e.ttp?.mitre_id ?? "",
    e.ttp?.name ?? "",
    e.ttp?.tactic ?? "",
    e.tool_used ?? "",
    e.source ?? "",
    e.destination ?? "",
    e.command_used ?? "",
    e.executed_at ?? "",
    e.detected === true ? "Y" : e.detected === false ? "N" : "",
    e.detection_method ?? "",
    e.alert_name ?? "",
    e.time_to_detect_minutes ?? "",
    e.outcome ?? "",
    e.gap_identified ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exerciseName ?? "exercise"}-entries.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
