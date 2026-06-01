from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate
from app.core.exceptions import (
    InsufficientStockException,
    CustomerNotFoundException,
    ProductNotFoundException,
    OrderNotFoundException,
)
from decimal import Decimal
from collections import defaultdict
from uuid import UUID

def create_order(db: Session, order_data: OrderCreate) -> Order:
    # Begin transaction is automatic in SQLAlchemy with autocommit=False.
    # We will use try/except to commit or rollback.
    try:
        # 1. Validate Customer Exists
        customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
        if not customer:
            raise CustomerNotFoundException(order_data.customer_id)

        # 2. Consolidate requested quantities by product_id to ensure we validate cumulative stock
        quantity_by_product = defaultdict(int)
        for item in order_data.items:
            quantity_by_product[item.product_id] += item.quantity

        # 3. Lock products to prevent race conditions (row-level locking)
        product_ids = list(quantity_by_product.keys())
        locked_products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )
        
        locked_products_map = {p.id: p for p in locked_products}

        # 4. Verify product existence and stock availability
        for prod_id, req_qty in quantity_by_product.items():
            if prod_id not in locked_products_map:
                raise ProductNotFoundException(prod_id)
            
            product = locked_products_map[prod_id]
            if product.stock_quantity < req_qty:
                raise InsufficientStockException(
                    product_id=product.id,
                    sku=product.sku,
                    available_stock=product.stock_quantity,
                    requested_quantity=req_qty
                )

        # 5. Create Order record
        db_order = Order(
            customer_id=order_data.customer_id,
            total_amount=Decimal("0.00"),
            status="created"
        )
        db.add(db_order)
        db.flush()  # Flush to populate db_order.id

        total_amount = Decimal("0.00")
        
        # 6. Create OrderItem records and reduce stock
        for item in order_data.items:
            product = locked_products_map[item.product_id]
            
            # Reduce inventory
            product.stock_quantity -= item.quantity
            
            unit_price = product.price
            line_total = unit_price * Decimal(item.quantity)
            total_amount += line_total
            
            db_item = OrderItem(
                order_id=db_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total
            )
            db.add(db_item)

        # 7. Set final order amount
        db_order.total_amount = total_amount
        
        db.commit()
        # Refresh to populate relationships (customer, items, items.product)
        db.refresh(db_order)
        return db_order

    except Exception as e:
        db.rollback()
        raise e


def delete_order(db: Session, order_id: UUID) -> None:
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise OrderNotFoundException(order_id)

        product_ids = [item.product_id for item in order.items]
        if not product_ids:
            db.delete(order)
            db.commit()
            return

        locked_products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )
        locked_products_map = {p.id: p for p in locked_products}

        for item in order.items:
            product = locked_products_map.get(item.product_id)
            if product:
                product.stock_quantity += item.quantity

        db.delete(order)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
