import json


def test_list_exercises_empty(client):
    r = client.get("/api/exercises/")
    assert r.status_code == 200
    assert r.json["data"] == []


def test_create_exercise(client):
    r = client.post("/api/exercises/", json={"name": "Test Exercise"})
    assert r.status_code == 201
    assert r.json["name"] == "Test Exercise"
    assert r.json["status"] == "planned"


def test_create_exercise_missing_name(client):
    r = client.post("/api/exercises/", json={})
    assert r.status_code == 400


def test_get_exercise(client):
    created = client.post("/api/exercises/", json={"name": "Alpha"}).json
    r = client.get(f"/api/exercises/{created['id']}")
    assert r.status_code == 200
    assert r.json["name"] == "Alpha"


def test_get_exercise_not_found(client):
    r = client.get("/api/exercises/9999")
    assert r.status_code == 404


def test_update_exercise(client):
    created = client.post("/api/exercises/", json={"name": "Old"}).json
    r = client.put(f"/api/exercises/{created['id']}", json={"name": "New", "status": "active"})
    assert r.status_code == 200
    assert r.json["name"] == "New"
    assert r.json["status"] == "active"


def test_delete_exercise(client):
    created = client.post("/api/exercises/", json={"name": "ToDelete"}).json
    r = client.delete(f"/api/exercises/{created['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/api/exercises/{created['id']}")
    assert r2.status_code == 404
