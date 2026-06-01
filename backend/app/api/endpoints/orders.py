from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.services import order_service
from app.core.exceptions import InsufficientStockException, CustomerNotFoundException, ProductNotFoundException

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    # Order by newest first
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.get("/{id}", response_model=OrderResponse)
def get_order(id: UUID, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found"
        )
    return order

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    try:
        return order_service.create_order(db, order_in)
    except CustomerNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except InsufficientStockException as e:
        # Returning custom structured JSON error as required by PRD
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": e.message,
                "details": {
                    "product_id": str(e.product_id),
                    "sku": e.sku,
                    "available_stock": e.available_stock,
                    "requested_quantity": e.requested_quantity
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
