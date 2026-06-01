import pytest
from fastapi import status

def test_create_customer_unauthorized(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0199",
        "address": "123 Main St, Seattle"
    }
    response = client.post("/api/customers", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_customer_forbidden_for_employee(client, employee_headers):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0199",
        "address": "123 Main St, Seattle"
    }
    response = client.post("/api/customers", json=payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_create_customer_admin(client, admin_headers):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0199",
        "address": "123 Main St, Seattle"
    }
    response = client.post("/api/customers", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["phone"] == payload["phone"]
    assert data["address"] == payload["address"]
    assert "id" in data

def test_create_customer_invalid_email(client, admin_headers):
    payload = {
        "full_name": "Jane Doe",
        "email": "not-an-email",
        "phone": "555-0199"
    }
    response = client.post("/api/customers", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_customer_duplicate_email(client, admin_headers):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0100",
    }
    client.post("/api/customers", json=payload, headers=admin_headers)
    
    # Duplicate email request
    payload_dupe = {
        "full_name": "Another Jane",
        "email": "jane@example.com",
        "phone": "555-0101",
    }
    response = client.post("/api/customers", json=payload_dupe, headers=admin_headers)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in response.json()["detail"]

def test_get_customers_employee(client, admin_headers, employee_headers):
    c1 = {"full_name": "Charlie", "email": "charlie@example.com", "phone": "555-0001"}
    c2 = {"full_name": "Alice", "email": "alice@example.com", "phone": "555-0002"}
    client.post("/api/customers", json=c1, headers=admin_headers)
    client.post("/api/customers", json=c2, headers=admin_headers)
    
    # Employee should be able to view customers
    response = client.get("/api/customers", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    # Alphabetical sorting
    assert data[0]["full_name"] == "Alice"
    assert data[1]["full_name"] == "Charlie"

def test_create_customer_missing_phone(client, admin_headers):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane2@example.com",
    }
    response = client.post("/api/customers", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_customer_admin(client, admin_headers):
    payload = {"full_name": "Alice", "email": "alice@example.com", "phone": "555-0003"}
    create_res = client.post("/api/customers", json=payload, headers=admin_headers)
    cust_id = create_res.json()["id"]
    
    update_payload = {"full_name": "Alice Cooper", "phone": "123-456"}
    response = client.put(f"/api/customers/{cust_id}", json=update_payload, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["full_name"] == "Alice Cooper"
    assert response.json()["phone"] == "123-456"
    assert response.json()["email"] == "alice@example.com" # Unchanged

def test_update_customer_forbidden_for_employee(client, admin_headers, employee_headers):
    payload = {"full_name": "Alice", "email": "alice@example.com", "phone": "555-0003"}
    create_res = client.post("/api/customers", json=payload, headers=admin_headers)
    cust_id = create_res.json()["id"]
    
    update_payload = {"full_name": "Alice Cooper", "phone": "123-456"}
    response = client.put(f"/api/customers/{cust_id}", json=update_payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
