import pytest
from fastapi import status

def test_create_order_unauthorized(client):
    response = client.post("/api/orders", json={"customer_id": "00000000-0000-0000-0000-000000000000", "items": []})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_order_success_employee(client, admin_headers, employee_headers):
    # 1. Create a customer (Admin only)
    cust_res = client.post("/api/customers", json={
        "full_name": "Bob Vance",
        "email": "bob@vancefrigeration.com",
        "phone": "555-1000",
    }, headers=admin_headers)
    cust_id = cust_res.json()["id"]

    # 2. Create products (Admin only)
    prod1_res = client.post("/api/products", json={
        "name": "Refrigerator X1",
        "sku": "RF-X1",
        "price": 899.99,
        "stock_quantity": 5
    }, headers=admin_headers)
    prod1_id = prod1_res.json()["id"]

    prod2_res = client.post("/api/products", json={
        "name": "Toaster Pro",
        "sku": "TS-PRO",
        "price": 49.99,
        "stock_quantity": 10
    }, headers=admin_headers)
    prod2_id = prod2_res.json()["id"]

    # 3. Create an order (Employee headers allowed)
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {"product_id": prod1_id, "quantity": 2},
            {"product_id": prod2_id, "quantity": 3}
        ]
    }
    order_res = client.post("/api/orders", json=order_payload, headers=employee_headers)
    assert order_res.status_code == status.HTTP_201_CREATED
    
    order_data = order_res.json()
    assert order_data["customer_id"] == cust_id
    assert float(order_data["total_amount"]) == 1949.95
    assert len(order_data["items"]) == 2

    # 4. Check stock reduction (Employee headers allowed to view product details)
    get_p1 = client.get(f"/api/products/{prod1_id}", headers=employee_headers).json()
    get_p2 = client.get(f"/api/products/{prod2_id}", headers=employee_headers).json()
    assert get_p1["stock_quantity"] == 3 # 5 - 2
    assert get_p2["stock_quantity"] == 7 # 10 - 3

def test_create_order_insufficient_stock(client, admin_headers, employee_headers):
    cust_res = client.post("/api/customers", json={"full_name": "Dwight", "email": "dwight@dundermifflin.com", "phone": "555-1001"}, headers=admin_headers)
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Paper Box",
        "sku": "PB-100",
        "price": 15.00,
        "stock_quantity": 3
    }, headers=admin_headers)
    prod_id = prod_res.json()["id"]

    # Request 5 boxes when only 3 are available
    order_payload = {
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 5}]
    }
    order_res = client.post("/api/orders", json=order_payload, headers=employee_headers)
    assert order_res.status_code == status.HTTP_400_BAD_REQUEST
    
    error_data = order_res.json()
    assert "detail" in error_data
    detail = error_data["detail"]
    assert "Insufficient stock for product SKU PB-100" in detail["message"]
    assert detail["details"]["product_id"] == prod_id
    assert detail["details"]["sku"] == "PB-100"
    assert detail["details"]["available_stock"] == 3
    assert detail["details"]["requested_quantity"] == 5

    # Confirm stock was NOT reduced
    get_prod = client.get(f"/api/products/{prod_id}", headers=employee_headers).json()
    assert get_prod["stock_quantity"] == 3

def test_create_order_duplicate_product_aggregation(client, admin_headers, employee_headers):
    cust_res = client.post("/api/customers", json={"full_name": "Jim", "email": "jim@dundermifflin.com", "phone": "555-1002"}, headers=admin_headers)
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Stapler in Jello",
        "sku": "ST-JELLO",
        "price": 8.00,
        "stock_quantity": 3
    }, headers=admin_headers)
    prod_id = prod_res.json()["id"]

    # Request 2 in item 1 and 2 in item 2 (Total 4, exceeding stock of 3)
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 2},
            {"product_id": prod_id, "quantity": 2}
        ]
    }
    order_res = client.post("/api/orders", json=order_payload, headers=employee_headers)
    assert order_res.status_code == status.HTTP_400_BAD_REQUEST
    
    detail = order_res.json()["detail"]
    assert detail["details"]["available_stock"] == 3
    assert detail["details"]["requested_quantity"] == 4

    # Confirm stock was NOT reduced
    get_prod = client.get(f"/api/products/{prod_id}", headers=employee_headers).json()
    assert get_prod["stock_quantity"] == 3

def test_create_order_customer_not_found(client, admin_headers, employee_headers):
    prod_res = client.post("/api/products", json={"name": "P", "sku": "S", "price": 10.0, "stock_quantity": 10}, headers=admin_headers)
    prod_id = prod_res.json()["id"]
    
    order_payload = {
        "customer_id": "00000000-0000-0000-0000-000000000000",
        "items": [{"product_id": prod_id, "quantity": 2}]
    }
    response = client.post("/api/orders", json=order_payload, headers=employee_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Customer" in response.json()["detail"]

def test_delete_order_restores_stock_admin(client, admin_headers):
    cust_res = client.post("/api/customers", json={
        "full_name": "Bob Vance",
        "email": "bob.cancel@example.com",
        "phone": "555-0100",
    }, headers=admin_headers)
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Widget",
        "sku": "WDG-001",
        "price": 10.00,
        "stock_quantity": 20,
    }, headers=admin_headers)
    prod_id = prod_res.json()["id"]

    order_res = client.post("/api/orders", json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 5}],
    }, headers=admin_headers)
    order_id = order_res.json()["id"]

    assert client.get(f"/api/products/{prod_id}", headers=admin_headers).json()["stock_quantity"] == 15

    # Delete with admin (success)
    delete_res = client.delete(f"/api/orders/{order_id}", headers=admin_headers)
    assert delete_res.status_code == status.HTTP_204_NO_CONTENT

    assert client.get(f"/api/products/{prod_id}", headers=admin_headers).json()["stock_quantity"] == 20
    assert client.get(f"/api/orders/{order_id}", headers=admin_headers).status_code == status.HTTP_404_NOT_FOUND

def test_delete_order_forbidden_for_employee(client, admin_headers, employee_headers):
    cust_res = client.post("/api/customers", json={
        "full_name": "Bob Vance",
        "email": "bob.cancel.emp@example.com",
        "phone": "555-0100",
    }, headers=admin_headers)
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Widget",
        "sku": "WDG-002",
        "price": 10.00,
        "stock_quantity": 20,
    }, headers=admin_headers)
    prod_id = prod_res.json()["id"]

    order_res = client.post("/api/orders", json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 5}],
    }, headers=admin_headers)
    order_id = order_res.json()["id"]

    # Delete with employee (forbidden)
    delete_res = client.delete(f"/api/orders/{order_id}", headers=employee_headers)
    assert delete_res.status_code == status.HTTP_403_FORBIDDEN

def test_delete_order_not_found(client, admin_headers):
    response = client.delete("/api/orders/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Order" in response.json()["detail"]

def test_delete_order_twice_returns_404(client, admin_headers):
    cust_res = client.post("/api/customers", json={
        "full_name": "Twice Delete",
        "email": "twice@example.com",
        "phone": "555-0101",
    }, headers=admin_headers)
    prod_res = client.post("/api/products", json={
        "name": "Item",
        "sku": "ITM-2X",
        "price": 5.00,
        "stock_quantity": 10,
    }, headers=admin_headers)
    order_res = client.post("/api/orders", json={
        "customer_id": cust_res.json()["id"],
        "items": [{"product_id": prod_res.json()["id"], "quantity": 1}],
    }, headers=admin_headers)
    order_id = order_res.json()["id"]

    assert client.delete(f"/api/orders/{order_id}", headers=admin_headers).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(f"/api/orders/{order_id}", headers=admin_headers).status_code == status.HTTP_404_NOT_FOUND
