import pytest
from fastapi import status

def test_create_order_success(client):
    # 1. Create a customer
    cust_res = client.post("/api/customers", json={
        "full_name": "Bob Vance",
        "email": "bob@vancefrigeration.com"
    })
    cust_id = cust_res.json()["id"]

    # 2. Create products
    prod1_res = client.post("/api/products", json={
        "name": "Refrigerator X1",
        "sku": "RF-X1",
        "price": 899.99,
        "stock_quantity": 5
    })
    prod1_id = prod1_res.json()["id"]

    prod2_res = client.post("/api/products", json={
        "name": "Toaster Pro",
        "sku": "TS-PRO",
        "price": 49.99,
        "stock_quantity": 10
    })
    prod2_id = prod2_res.json()["id"]

    # 3. Create an order
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {"product_id": prod1_id, "quantity": 2},
            {"product_id": prod2_id, "quantity": 3}
        ]
    }
    order_res = client.post("/api/orders", json=order_payload)
    assert order_res.status_code == status.HTTP_201_CREATED
    
    order_data = order_res.json()
    assert order_data["customer_id"] == cust_id
    # Backend total: 2 * 899.99 + 3 * 49.99 = 1799.98 + 149.97 = 1949.95
    assert float(order_data["total_amount"]) == 1949.95
    assert len(order_data["items"]) == 2

    # 4. Check stock reduction
    get_p1 = client.get(f"/api/products/{prod1_id}").json()
    get_p2 = client.get(f"/api/products/{prod2_id}").json()
    assert get_p1["stock_quantity"] == 3 # 5 - 2
    assert get_p2["stock_quantity"] == 7 # 10 - 3

def test_create_order_insufficient_stock(client):
    cust_res = client.post("/api/customers", json={"full_name": "Dwight", "email": "dwight@dundermifflin.com"})
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Paper Box",
        "sku": "PB-100",
        "price": 15.00,
        "stock_quantity": 3
    })
    prod_id = prod_res.json()["id"]

    # Request 5 boxes when only 3 are available
    order_payload = {
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 5}]
    }
    order_res = client.post("/api/orders", json=order_payload)
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
    get_prod = client.get(f"/api/products/{prod_id}").json()
    assert get_prod["stock_quantity"] == 3

def test_create_order_duplicate_product_aggregation(client):
    # Test checking that duplicate entries in items are aggregated for stock verification
    cust_res = client.post("/api/customers", json={"full_name": "Jim", "email": "jim@dundermifflin.com"})
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/products", json={
        "name": "Stapler in Jello",
        "sku": "ST-JELLO",
        "price": 8.00,
        "stock_quantity": 3
    })
    prod_id = prod_res.json()["id"]

    # Request 2 in item 1 and 2 in item 2 (Total 4, exceeding stock of 3)
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 2},
            {"product_id": prod_id, "quantity": 2}
        ]
    }
    order_res = client.post("/api/orders", json=order_payload)
    assert order_res.status_code == status.HTTP_400_BAD_REQUEST
    
    detail = order_res.json()["detail"]
    assert detail["details"]["available_stock"] == 3
    assert detail["details"]["requested_quantity"] == 4 # Cumulative requested

    # Confirm stock was NOT reduced
    get_prod = client.get(f"/api/products/{prod_id}").json()
    assert get_prod["stock_quantity"] == 3

def test_create_order_customer_not_found(client):
    prod_res = client.post("/api/products", json={"name": "P", "sku": "S", "price": 10.0, "stock_quantity": 10})
    prod_id = prod_res.json()["id"]
    
    order_payload = {
        "customer_id": "00000000-0000-0000-0000-000000000000",
        "items": [{"product_id": prod_id, "quantity": 2}]
    }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Customer" in response.json()["detail"]
