import os
import sys

# Override database URL for tests before any app code imports
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.core.database import Base, get_db
from app.main import app

# Use SQLite in-memory database for unit testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

from app.core.security import hash_password, create_access_token
from app.models.user import User

@pytest.fixture(scope="function")
def admin_user(db):
    user = User(
        full_name="Test Admin",
        email="admin@example.com",
        password_hash=hash_password("adminpass123"),
        role="Admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def employee_user(db):
    user = User(
        full_name="Test Employee",
        email="employee@example.com",
        password_hash=hash_password("employeepass123"),
        role="Employee"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def admin_headers(admin_user):
    token = create_access_token(data={"sub": str(admin_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def employee_headers(employee_user):
    token = create_access_token(data={"sub": str(employee_user.id)})
    return {"Authorization": f"Bearer {token}"}

