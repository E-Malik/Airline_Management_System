from datetime import datetime, timedelta


def test_get_airports(client, seed_test_data):
    response = client.get("/api/v1/flights/airports")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    iatas = [a["iata_code"] for a in data]
    assert "DXB" in iatas
    assert "LHR" in iatas


def test_search_flights(client, seed_test_data):
    flight = seed_test_data["flight"]
    dep_date_str = flight.departure_time.strftime("%Y-%m-%d")

    response = client.get(
        "/api/v1/flights/search",
        params={
            "origin": "DXB",
            "destination": "LHR",
            "departure_date": dep_date_str,
            "cabin_class": "ECONOMY",
            "passengers": 1
        }
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    f = results[0]
    assert f["flight_number"] == "TEST-101"
    assert len(f["fare_tiers"]) == 3
    tier_names = [t["tier_name"] for t in f["fare_tiers"]]
    assert "SAVER" in tier_names
    assert "FLEX" in tier_names
    assert "FLEX_PLUS" in tier_names


def test_get_flight_by_id(client, seed_test_data):
    flight = seed_test_data["flight"]
    response = client.get(f"/api/v1/flights/{flight.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["flight_number"] == "TEST-101"
    assert data["route"]["origin_iata"] == "DXB"
    assert data["route"]["destination_iata"] == "LHR"
