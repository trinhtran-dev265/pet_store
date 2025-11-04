export const ORDER_MESSAGES = {
  SUCCESS: {
    CREATE: 'Order created successfully',
    UPDATE: 'Order updated successfully',
    DELETE: 'Order deleted successfully',
  },
  ERROR: {
    CART_EMPTY: 'Cart is empty',
    MUST_HAVE_PET: 'You must include at least one pet in your order.',
    MISMATCH: 'Total mismatch between client and server',
    PET_NOT_FOUND: 'Pet not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    ORDER_NOT_FOUND: 'Order not found',
    CANNOT_ACCESS: 'You cannot access this order',
    CANNOT_CANCEL: 'You cannot cancel this order',
    ONLY_PENDING: 'Only pending orders can be canceled',
  },
};
