import pytest
from fastapi import status

def test_create_customer(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0199",
        "address": "123 Main St, Seattle"
    }
    response = client.post("/api/customers", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["phone"] == payload["phone"]
    assert data["address"] == payload["address"]
    assert "id" in data

def test_create_customer_invalid_email(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "not-an-email",
        "phone": "555-0199"
    }
    response = client.post("/api/customers", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_customer_duplicate_email(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0100",
    }
    client.post("/api/customers", json=payload)
    
    # Duplicate email request
    payload_dupe = {
        "full_name": "Another Jane",
        "email": "jane@example.com",
        "phone": "555-0101",
    }
    response = client.post("/api/customers", json=payload_dupe)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in response.json()["detail"]

def test_get_customers(client):
    c1 = {"full_name": "Charlie", "email": "charlie@example.com", "phone": "555-0001"}
    c2 = {"full_name": "Alice", "email": "alice@example.com", "phone": "555-0002"}
    client.post("/api/customers", json=c1)
    client.post("/api/customers", json=c2)
    
    response = client.get("/api/customers")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    # Alphabetical sorting
    assert data[0]["full_name"] == "Alice"
    assert data[1]["full_name"] == "Charlie"

def test_create_customer_missing_phone(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane2@example.com",
    }
    response = client.post("/api/customers", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_customer(client):
    payload = {"full_name": "Alice", "email": "alice@example.com", "phone": "555-0003"}
    create_res = client.post("/api/customers", json=payload)
    cust_id = create_res.json()["id"]
    
    update_payload = {"full_name": "Alice Cooper", "phone": "123-456"}
    response = client.put(f"/api/customers/{cust_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["full_name"] == "Alice Cooper"
    assert response.json()["phone"] == "123-456"
    assert response.json()["email"] == "alice@example.com" # Unchanged
