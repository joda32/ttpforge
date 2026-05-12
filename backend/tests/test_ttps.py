def test_list_ttps_empty(client):
    r = client.get("/api/ttps/")
    assert r.status_code == 200
    assert r.json["data"] == []


def test_create_ttp(client):
    r = client.post("/api/ttps/", json={
        "mitre_id": "T1059.001",
        "name": "PowerShell",
        "tactic": "Execution",
        "platform": "Windows",
    })
    assert r.status_code == 201
    assert r.json["mitre_id"] == "T1059.001"


def test_create_ttp_missing_fields(client):
    r = client.post("/api/ttps/", json={"mitre_id": "T1059.001"})
    assert r.status_code == 400


def test_get_ttp_not_found(client):
    r = client.get("/api/ttps/9999")
    assert r.status_code == 404


def test_search_ttps(client):
    client.post("/api/ttps/", json={"mitre_id": "T1059.001", "name": "PowerShell", "tactic": "Execution"})
    client.post("/api/ttps/", json={"mitre_id": "T1083", "name": "File Discovery", "tactic": "Discovery"})
    r = client.get("/api/ttps/?search=Power")
    assert r.status_code == 200
    assert len(r.json["data"]) == 1
    assert r.json["data"][0]["mitre_id"] == "T1059.001"
