def _create_exercise(client, name="Exercise 1"):
    return client.post("/api/exercises/", json={"name": name}).json


def _create_ttp(client):
    return client.post("/api/ttps/", json={
        "mitre_id": "T1059.001", "name": "PowerShell", "tactic": "Execution"
    }).json


def test_create_entry(client):
    ex = _create_exercise(client)
    ttp = _create_ttp(client)
    r = client.post("/api/entries/", json={
        "exercise_id": ex["id"],
        "ttp_id": ttp["id"],
        "tool_used": "Cobalt Strike",
        "outcome": "detected",
    })
    assert r.status_code == 201
    assert r.json["tool_used"] == "Cobalt Strike"
    assert r.json["outcome"] == "detected"


def test_create_entry_missing_fields(client):
    r = client.post("/api/entries/", json={"exercise_id": 1})
    assert r.status_code == 400


def test_update_entry(client):
    ex = _create_exercise(client)
    ttp = _create_ttp(client)
    entry = client.post("/api/entries/", json={"exercise_id": ex["id"], "ttp_id": ttp["id"]}).json
    r = client.put(f"/api/entries/{entry['id']}", json={"detected": True, "outcome": "detected"})
    assert r.status_code == 200
    assert r.json["detected"] is True


def test_delete_entry(client):
    ex = _create_exercise(client)
    ttp = _create_ttp(client)
    entry = client.post("/api/entries/", json={"exercise_id": ex["id"], "ttp_id": ttp["id"]}).json
    r = client.delete(f"/api/entries/{entry['id']}")
    assert r.status_code == 204


def test_exercise_summary(client):
    ex = _create_exercise(client)
    ttp = _create_ttp(client)
    client.post("/api/entries/", json={"exercise_id": ex["id"], "ttp_id": ttp["id"], "outcome": "detected"})
    client.post("/api/entries/", json={"exercise_id": ex["id"], "ttp_id": ttp["id"], "outcome": "missed"})
    r = client.get(f"/api/exercises/{ex['id']}/summary")
    assert r.status_code == 200
    assert r.json["total_entries"] == 2
    assert r.json["detected"] == 1
    assert r.json["missed"] == 1
