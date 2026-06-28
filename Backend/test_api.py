import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

# Configure test database
TEST_DB_FILE = "test_route53.db"
TEST_DATABASE_URL = f"sqlite:///./{TEST_DB_FILE}"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db to point to test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Initialize client
client = TestClient(app)

def setup_db():
    # Remove existing test DB if any
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)
    Base.metadata.create_all(bind=engine)

def teardown_db():
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

def test_flow():
    print("--- Running Route53 Clone API Tests ---")

    # 1. Test Root Endpoint
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    print("[PASS] Root health check endpoint works.")

    # 2. Test Zone Creation (Success)
    response = client.post(
        "/zones",
        json={"name": "example.com.", "comment": "Main domain", "private_zone": False}
    )
    assert response.status_code == 201
    zone_data = response.json()
    assert zone_data["name"] == "example.com."
    assert zone_data["comment"] == "Main domain"
    assert zone_data["private_zone"] is False
    zone_id = zone_data["id"]
    print(f"[PASS] Hosted Zone creation successful. Created Zone ID: {zone_id}")

    # 3. Test Zone Creation (Failure: missing trailing dot)
    response = client.post(
        "/zones",
        json={"name": "invalid-domain", "comment": "Missing dot"}
    )
    assert response.status_code == 422
    assert "trailing dot" in response.json()["detail"][0]["msg"]
    print("[PASS] Hosted Zone creation validation caught missing trailing dot.")

    # 4. Test Zone Creation (Failure: duplicate name)
    response = client.post(
        "/zones",
        json={"name": "example.com.", "comment": "Duplicate"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
    print("[PASS] Hosted Zone creation validation caught duplicate domain name.")

    # 5. Test Listing Hosted Zones & Filtering
    # Create another zone for filtering test
    client.post(
        "/zones",
        json={"name": "private.local.", "comment": "Internal DNS", "private_zone": True}
    )
    
    response = client.get("/zones")
    assert response.status_code == 200
    assert len(response.json()) == 2

    # Filter by name
    response = client.get("/zones?name=private.local.")
    assert len(response.json()) == 1
    assert response.json()[0]["private_zone"] is True

    # Filter by private_zone
    response = client.get("/zones?private_zone=true")
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "private.local."
    print("[PASS] List hosted zones and filter query parameters work.")

    # 6. Test Get Hosted Zone by ID
    response = client.get(f"/zones/{zone_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "example.com."
    print("[PASS] Get hosted zone details by ID works.")

    # 7. Test Update Hosted Zone
    response = client.put(
        "/zones/{zone_id}".format(zone_id=zone_id),
        json={"comment": "Updated comment", "private_zone": True}
    )
    assert response.status_code == 200
    assert response.json()["comment"] == "Updated comment"
    assert response.json()["private_zone"] is True
    print("[PASS] Update hosted zone details works.")

    # 8. Test DNS Record Creation (Success)
    response = client.post(
        f"/zones/{zone_id}/records",
        json={"name": "www.example.com.", "type": "A", "ttl": 600, "value": "192.0.2.1"}
    )
    assert response.status_code == 201
    record_data = response.json()
    assert record_data["name"] == "www.example.com."
    assert record_data["type"] == "A"
    assert record_data["ttl"] == 600
    assert record_data["value"] == "192.0.2.1"
    record_id = record_data["id"]
    print(f"[PASS] DNS record creation successful. Created Record ID: {record_id}")

    # 9. Test DNS Record Creation (Failure: not sub-domain/root of zone name)
    response = client.post(
        f"/zones/{zone_id}/records",
        json={"name": "notexample.com.", "type": "A", "value": "192.0.2.2"}
    )
    assert response.status_code == 400
    assert "must be the zone root or a subdomain" in response.json()["detail"]

    response = client.post(
        f"/zones/{zone_id}/records",
        json={"name": "google.com.", "type": "A", "value": "192.0.2.2"}
    )
    assert response.status_code == 400
    assert "must be the zone root or a subdomain" in response.json()["detail"]
    print("[PASS] DNS record name validation prevents records outside the zone domain.")

    # 10. Test List DNS Records & Filter
    # Add a CNAME record
    client.post(
        f"/zones/{zone_id}/records",
        json={"name": "mail.example.com.", "type": "CNAME", "value": "ghs.google.com."}
    )

    response = client.get(f"/zones/{zone_id}/records")
    assert response.status_code == 200
    assert len(response.json()) == 2

    # Filter by type
    response = client.get(f"/zones/{zone_id}/records?type=CNAME")
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "mail.example.com."

    # Filter by name
    response = client.get(f"/zones/{zone_id}/records?name=www.example.com.")
    assert len(response.json()) == 1
    assert response.json()[0]["type"] == "A"
    print("[PASS] Listing records and applying filters (name, type) works.")

    # 11. Test Get DNS Record by ID
    response = client.get(f"/zones/{zone_id}/records/{record_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "www.example.com."
    print("[PASS] Get DNS record details by ID works.")

    # 12. Test Update DNS Record
    response = client.put(
        f"/zones/{zone_id}/records/{record_id}",
        json={"name": "blog.example.com.", "ttl": 120, "value": "192.0.2.5"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "blog.example.com."
    assert response.json()["ttl"] == 120
    assert response.json()["value"] == "192.0.2.5"
    print("[PASS] Update DNS record details works.")

    # 13. Test Cascade Deletion
    # Delete the hosted zone
    response = client.delete(f"/zones/{zone_id}")
    assert response.status_code == 204
    print("[PASS] Deleted hosted zone.")

    # Verify zone is gone (404)
    response = client.get(f"/zones/{zone_id}")
    assert response.status_code == 404

    # Verify records of the zone are cascade-deleted
    # Since the zone itself is gone, listing records in it should return 404
    response = client.get(f"/zones/{zone_id}/records")
    assert response.status_code == 404
    print("[PASS] Cascade deletion verified (zone deletion cleaned up all associated records).")
    
    print("\n--- ALL TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    setup_db()
    try:
        test_flow()
    finally:
        teardown_db()
