def test_user_registration(client):
    payload = {
        "email": "newuser@example.com",
        "password": "Password123!",
        "full_name": "Test User",
        "phone": "+1234567890"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "CUSTOMER"


def test_user_duplicate_registration_fails(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Duplicate User"
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


def test_user_login_success(client, seed_test_data):
    payload = {
        "email": "test_customer@aerolux.com",
        "password": "CustomerPass123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "CUSTOMER"


def test_user_login_invalid_password(client, seed_test_data):
    payload = {
        "email": "test_customer@aerolux.com",
        "password": "WrongPassword!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_user_profile_me(client, customer_headers):
    response = client.get("/api/v1/auth/me", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_customer@aerolux.com"
    assert data["role"] == "CUSTOMER"
