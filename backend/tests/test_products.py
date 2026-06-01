import pytest
from fastapi import status

def test_create_product_unauthorized(client):
    payload = {
        "name": "Test Wireless Mouse",
        "sku": "WM-TEST-100",
        "description": "Premium wireless mouse",
        "price": 29.99,
        "stock_quantity": 50
    }
    response = client.post("/api/products", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_product_forbidden_for_employee(client, employee_headers):
    payload = {
        "name": "Test Wireless Mouse",
        "sku": "WM-TEST-100",
        "description": "Premium wireless mouse",
        "price": 29.99,
        "stock_quantity": 50
    }
    response = client.post("/api/products", json=payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_create_product_admin(client, admin_headers):
    payload = {
        "name": "Test Wireless Mouse",
        "sku": "WM-TEST-100",
        "description": "Premium wireless mouse",
        "price": 29.99,
        "stock_quantity": 50
    }
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["sku"] == payload["sku"]
    assert float(data["price"]) == payload["price"]
    assert data["stock_quantity"] == payload["stock_quantity"]
    assert "id" in data

def test_create_product_duplicate_sku(client, admin_headers):
    payload = {
        "name": "Test Item 1",
        "sku": "ITEM-DUPE",
        "price": 10.00,
        "stock_quantity": 5
    }
    # Create once
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    
    # Create twice
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in response.json()["detail"]

def test_create_product_invalid_price_and_stock(client, admin_headers):
    payload = {
        "name": "Negative Price Item",
        "sku": "ITEM-NEG",
        "price": -5.00,
        "stock_quantity": 10
    }
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    payload2 = {
        "name": "Negative Stock Item",
        "sku": "ITEM-NEG-STOCK",
        "price": 5.00,
        "stock_quantity": -10
    }
    response = client.post("/api/products", json=payload2, headers=admin_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_products_employee(client, admin_headers, employee_headers):
    # Create two products
    p1 = {"name": "B Item", "sku": "SKU-B", "price": 15.0, "stock_quantity": 10}
    p2 = {"name": "A Item", "sku": "SKU-A", "price": 20.0, "stock_quantity": 5}
    client.post("/api/products", json=p1, headers=admin_headers)
    client.post("/api/products", json=p2, headers=admin_headers)
    
    # Employee can list products
    response = client.get("/api/products", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    # Ensure they are sorted alphabetically by name
    assert data[0]["name"] == "A Item"
    assert data[1]["name"] == "B Item"

def test_get_product_by_id_employee(client, admin_headers, employee_headers):
    payload = {"name": "A Item", "sku": "SKU-A", "price": 20.0, "stock_quantity": 5}
    create_res = client.post("/api/products", json=payload, headers=admin_headers)
    prod_id = create_res.json()["id"]
    
    # Employee can get product detail
    response = client.get(f"/api/products/{prod_id}", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == prod_id
    
    response_missing = client.get("/api/products/00000000-0000-0000-0000-000000000000", headers=employee_headers)
    assert response_missing.status_code == status.HTTP_404_NOT_FOUND

def test_update_product_admin(client, admin_headers):
    payload = {"name": "A Item", "sku": "SKU-A", "price": 20.0, "stock_quantity": 5}
    create_res = client.post("/api/products", json=payload, headers=admin_headers)
    prod_id = create_res.json()["id"]
    
    update_payload = {"name": "Updated Name", "price": 25.50}
    response = client.put(f"/api/products/{prod_id}", json=update_payload, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Updated Name"
    assert float(response.json()["price"]) == 25.50
    assert response.json()["sku"] == "SKU-A" # Unchanged

def test_update_product_forbidden_for_employee(client, admin_headers, employee_headers):
    payload = {"name": "A Item", "sku": "SKU-A", "price": 20.0, "stock_quantity": 5}
    create_res = client.post("/api/products", json=payload, headers=admin_headers)
    prod_id = create_res.json()["id"]
    
    update_payload = {"name": "Updated Name", "price": 25.50}
    response = client.put(f"/api/products/{prod_id}", json=update_payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_delete_product_admin(client, admin_headers, employee_headers):
    payload = {"name": "A Item", "sku": "SKU-A", "price": 20.0, "stock_quantity": 5}
    create_res = client.post("/api/products", json=payload, headers=admin_headers)
    prod_id = create_res.json()["id"]
    
    # Try with employee (forbidden)
    response_del_emp = client.delete(f"/api/products/{prod_id}", headers=employee_headers)
    assert response_del_emp.status_code == status.HTTP_403_FORBIDDEN
    
    # Delete with admin (success)
    response = client.delete(f"/api/products/{prod_id}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Try fetching deleted item
    response_get = client.get(f"/api/products/{prod_id}", headers=admin_headers)
    assert response_get.status_code == status.HTTP_404_NOT_FOUND
