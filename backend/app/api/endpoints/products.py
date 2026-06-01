from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.api.dependencies import get_current_user, RoleChecker

admin_required = RoleChecker(["Admin"])

router = APIRouter()

@router.get("", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return db.query(Product).order_by(Product.name).all()

@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: UUID, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Product with ID {id} not found"
        )
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(admin_required)
):
    # Check duplicate SKU
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
    
    product = Product(**product_in.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Database integrity error during creation"
        )

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: UUID, 
    product_in: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(admin_required)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Product with ID {id} not found"
        )
    
    # Check duplicate SKU if SKU is changing
    update_data = product_in.model_dump(exclude_unset=True)
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{update_data['sku']}' already exists"
            )
            
    for field, value in update_data.items():
        setattr(product, field, value)
        
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product update data"
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    id: UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(admin_required)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Product with ID {id} not found"
        )
    
    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it is associated with existing orders."
        )
