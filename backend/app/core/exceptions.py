from uuid import UUID

class InsufficientStockException(Exception):
    def __init__(self, product_id: UUID, sku: str, available_stock: int, requested_quantity: int):
        self.product_id = product_id
        self.sku = sku
        self.available_stock = available_stock
        self.requested_quantity = requested_quantity
        self.message = f"Insufficient stock for product SKU {sku}"
        super().__init__(self.message)

class CustomerNotFoundException(Exception):
    def __init__(self, customer_id: UUID):
        self.customer_id = customer_id
        self.message = f"Customer with ID {customer_id} not found"
        super().__init__(self.message)

class ProductNotFoundException(Exception):
    def __init__(self, product_id: UUID):
        self.product_id = product_id
        self.message = f"Product with ID {product_id} not found"
        super().__init__(self.message)

class OrderNotFoundException(Exception):
    def __init__(self, order_id: UUID):
        self.order_id = order_id
        self.message = f"Order with ID {order_id} not found"
        super().__init__(self.message)
