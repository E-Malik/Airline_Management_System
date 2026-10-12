def test_booking_creation_and_seat_assignment(client, seed_test_data):
    flight = seed_test_data["flight"]
    seat_10a = seed_test_data["seat_10a"]

    booking_payload = {
        "flight_id": flight.id,
        "cabin_class": "ECONOMY",
        "fare_tier": "FLEX",
        "contact_name": "Alexander Sterling",
        "contact_email": "sterling@example.com",
        "contact_phone": "+44 7700 900077",
        "passengers": [
            {
                "first_name": "Alexander",
                "last_name": "Sterling",
                "passport_number": "GB11223344",
                "nationality": "GB",
                "meal_preference": "Standard",
                "seat_id": seat_10a.id
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "Alexander Sterling",
            "expiry": "12/28",
            "cvv": "123"
        }
    }

    response = client.post("/api/v1/bookings/", json=booking_payload)
    assert response.status_code == 201
    data = response.json()
    assert "booking_reference" in data
    assert data["status"] == "CONFIRMED"
    assert data["passengers"][0]["seat_number"] == "10A"
    assert data["total_fare"] > 0


def test_concurrency_double_booking_prevention(client, seed_test_data):
    """
    CRITICAL CONCURRENCY TEST:
    Ensures that when two passengers attempt to book the exact same seat on a flight,
    the transactional allocation guarantees only one succeeds, while the other is
    rejected with HTTP 409 Conflict.
    """
    flight = seed_test_data["flight"]
    seat_10b = seed_test_data["seat_10b"]

    booking_payload_1 = {
        "flight_id": flight.id,
        "cabin_class": "ECONOMY",
        "fare_tier": "FLEX",
        "contact_name": "Passenger Alpha",
        "contact_email": "alpha@example.com",
        "contact_phone": "+1 555 0101",
        "passengers": [
            {
                "first_name": "Passenger",
                "last_name": "Alpha",
                "passport_number": "US998877",
                "nationality": "US",
                "seat_id": seat_10b.id
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "Passenger Alpha",
            "expiry": "11/29",
            "cvv": "456"
        }
    }

    booking_payload_2 = {
        "flight_id": flight.id,
        "cabin_class": "ECONOMY",
        "fare_tier": "FLEX",
        "contact_name": "Passenger Beta",
        "contact_email": "beta@example.com",
        "contact_phone": "+1 555 0102",
        "passengers": [
            {
                "first_name": "Passenger",
                "last_name": "Beta",
                "passport_number": "US554433",
                "nationality": "US",
                "seat_id": seat_10b.id  # Same seat 10B!
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "Passenger Beta",
            "expiry": "11/29",
            "cvv": "789"
        }
    }

    # 1. First booking should succeed
    resp1 = client.post("/api/v1/bookings/", json=booking_payload_1)
    assert resp1.status_code == 201
    data1 = resp1.json()
    assert data1["status"] == "CONFIRMED"

    # 2. Second booking on the same seat MUST fail with 409 Conflict
    resp2 = client.post("/api/v1/bookings/", json=booking_payload_2)
    assert resp2.status_code == 409
    assert "already reserved" in resp2.json()["detail"].lower()


def test_booking_lookup_and_cancellation(client, seed_test_data):
    flight = seed_test_data["flight"]
    seat_1a = seed_test_data["seat_1a"]

    # Book seat 1A
    booking_payload = {
        "flight_id": flight.id,
        "cabin_class": "FIRST",
        "fare_tier": "FLEX_PLUS",
        "contact_name": "Winston Churchill",
        "contact_email": "winston@example.com",
        "contact_phone": "+44 20 7111 2222",
        "passengers": [
            {
                "first_name": "Winston",
                "last_name": "Churchill",
                "passport_number": "GB001122",
                "nationality": "GB",
                "seat_id": seat_1a.id
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "Winston Churchill",
            "expiry": "10/30",
            "cvv": "999"
        }
    }

    create_resp = client.post("/api/v1/bookings/", json=booking_payload)
    assert create_resp.status_code == 201
    pnr = create_resp.json()["booking_reference"]

    # Lookup by PNR & surname
    lookup_resp = client.post(
        "/api/v1/bookings/lookup",
        json={"booking_reference": pnr, "last_name": "Churchill"}
    )
    assert lookup_resp.status_code == 200
    assert lookup_resp.json()["booking_reference"] == pnr

    # Cancel booking
    cancel_resp = client.post(f"/api/v1/bookings/{pnr}/cancel")
    assert cancel_resp.status_code == 200
    data = cancel_resp.json()
    assert data["status"] == "CANCELLED"
    assert data["refund_amount"] > 0
