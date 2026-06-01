from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.schemas.product import ProductResponse
from app.schemas.customer import CustomerResponse

class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")

class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_id: UUID
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one item")

class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]
    customer: Optional[CustomerResponse] = None

    model_config = ConfigDict(from_attributes=True)
