import pytest
from fastapi import status
from app.models.user import User
from app.core.security import verify_password

def test_signup_success(client):
    payload = {
        "full_name": "Test User",
        "email": "signup@example.com",
        "password": "securepassword",
        "role": "Employee"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["role"] == payload["role"]
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data

def test_signup_validation_errors(client):
    # Weak password
    payload_weak = {
        "full_name": "Test User",
        "email": "signup@example.com",
        "password": "123",
        "role": "Employee"
    }
    response = client.post("/api/auth/signup", json=payload_weak)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid role
    payload_role = {
        "full_name": "Test User",
        "email": "signup@example.com",
        "password": "securepassword",
        "role": "SuperAdmin"
    }
    response = client.post("/api/auth/signup", json=payload_role)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_signup_duplicate_email(client):
    payload = {
        "full_name": "Test User",
        "email": "signup@example.com",
        "password": "securepassword",
        "role": "Employee"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    response2 = client.post("/api/auth/signup", json=payload)
    assert response2.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response2.json()["detail"]

def test_login_success(client, employee_user):
    payload = {
        "email": "employee@example.com",
        "password": "employeepass123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == employee_user.email
    assert data["user"]["role"] == "Employee"

def test_login_failure(client, employee_user):
    payload = {
        "email": "employee@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_profile(client, employee_headers, employee_user):
    response = client.get("/api/auth/profile", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == employee_user.email
    assert data["full_name"] == employee_user.full_name
    assert data["role"] == "Employee"

def test_logout(client, employee_headers):
    response = client.post("/api/auth/logout", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Logged out successfully."

def test_users_management_admin(client, admin_headers, employee_user):
    # Fetch all users
    response = client.get("/api/users", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    users = response.json()
    assert len(users) == 2 # Admin + Employee

    # Delete employee
    response_del = client.delete(f"/api/users/{employee_user.id}", headers=admin_headers)
    assert response_del.status_code == status.HTTP_204_NO_CONTENT

    # Fetch again to verify
    response_after = client.get("/api/users", headers=admin_headers)
    assert len(response_after.json()) == 1

def test_users_management_forbidden_for_employee(client, employee_headers, employee_user):
    response = client.get("/api/users", headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    response_del = client.delete(f"/api/users/{employee_user.id}", headers=employee_headers)
    assert response_del.status_code == status.HTTP_403_FORBIDDEN
