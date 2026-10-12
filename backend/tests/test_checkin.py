def test_check_in_workflow_and_boarding_pass(client, seed_test_data):
    flight = seed_test_data["flight"]
    seat_2a = seed_test_data["seat_2a"]

    # 1. Create a booking for check-in
    booking_payload = {
        "flight_id": flight.id,
        "cabin_class": "BUSINESS",
        "fare_tier": "FLEX",
        "contact_name": "Eleanor Vance",
        "contact_email": "vance@example.com",
        "contact_phone": "+1 555 9988",
        "passengers": [
            {
                "first_name": "Eleanor",
                "last_name": "Vance",
                "passport_number": "US443322",
                "nationality": "US",
                "seat_id": seat_2a.id
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "Eleanor Vance",
            "expiry": "09/27",
            "cvv": "321"
        }
    }

    create_resp = client.post("/api/v1/bookings/", json=booking_payload)
    assert create_resp.status_code == 201
    booking_data = create_resp.json()
    pnr = booking_data["booking_reference"]
    passenger_id = booking_data["passengers"][0]["id"]

    # 2. Attempt check-in without dangerous goods declaration -> must fail 400
    fail_resp = client.post(
        "/api/v1/checkin/",
        json={
            "booking_reference": pnr,
            "passenger_id": passenger_id,
            "dangerous_goods_declaration_accepted": False
        }
    )
    assert fail_resp.status_code == 400

    # 3. Successful Check-in
    success_resp = client.post(
        "/api/v1/checkin/",
        json={
            "booking_reference": pnr,
            "passenger_id": passenger_id,
            "dangerous_goods_declaration_accepted": True
        }
    )
    assert success_resp.status_code == 201
    bp_data = success_resp.json()
    assert bp_data["passenger_name"] == "Eleanor Vance"
    assert bp_data["seat_number"] == "2A"
    assert bp_data["flight_number"] == "TEST-101"
    assert bp_data["is_demo_document"] is True
    assert "BP-TEST-101" in bp_data["pass_token"]

    # 4. View Boarding Pass by token
    get_bp_resp = client.get(f"/api/v1/checkin/boarding-pass/{bp_data['pass_token']}")
    assert get_bp_resp.status_code == 200
    assert get_bp_resp.json()["pass_token"] == bp_data["pass_token"]
