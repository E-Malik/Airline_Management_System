def test_admin_rbac_protection(client, customer_headers, staff_headers):
    # 1. Unauthenticated request to admin flights -> 401
    unauth_resp = client.get("/api/v1/admin/flights")
    assert unauth_resp.status_code == 401

    # 2. Customer user attempting to access admin flights -> 403 Forbidden
    forbidden_resp = client.get("/api/v1/admin/flights", headers=customer_headers)
    assert forbidden_resp.status_code == 403

    # 3. Staff user accessing admin flights -> 200 OK
    staff_resp = client.get("/api/v1/admin/flights", headers=staff_headers)
    assert staff_resp.status_code == 200
    assert isinstance(staff_resp.json(), list)


def test_staff_update_flight_status_triggers_event(client, staff_headers, seed_test_data):
    flight = seed_test_data["flight"]

    update_payload = {
        "status": "BOARDING",
        "delay_minutes": 15,
        "gate": "A4"
    }

    resp = client.patch(
        f"/api/v1/admin/flights/{flight.id}/status",
        json=update_payload,
        headers=staff_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "BOARDING"
    assert data["delay_minutes"] == 15
    assert data["gate"] == "A4"


def test_get_flight_passenger_manifest(client, staff_headers, seed_test_data):
    flight = seed_test_data["flight"]

    resp = client.get(
        f"/api/v1/admin/flights/{flight.id}/manifest",
        headers=staff_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["flight_id"] == flight.id
    assert "passengers" in data
    assert "checked_in_count" in data


def test_admin_view_audit_logs(client, admin_headers):
    resp = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
