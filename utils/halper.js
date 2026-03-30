export function validateOrder(data) {
    if (!data.customerName?.trim()) {
        return { valid: false, message: 'customer name is required' };
    }
    if (!data.customerphone?.trim()) {
        return { valid: false, message: 'customer phone is required' };
    }
    if (!data.customerAddress?.trim()) {
        return { valid: false, message: 'customer address is required' };
    }
    if (!Array.isArray(data.orderItems)) {
        return { valid: false, message: 'order items are required' };
    }

    return { valid: true, message: 'Order data is valid' };
}


export function generateOrderId() {
    const now = new Date();
    const year = new Date().getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `ORD-${year}-${month}-${day}-${random}`;
}

export function CalculateTotal(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = 35; // Flat delivery fee
    const total = subtotal + tax + deliveryFee;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        deliveryFee,
        totalAmount: Math.round(total * 100) / 100
    }
}

export function createOrderDocument(orderData, orderId, totals) {
    return {
        orderId,
        customerName: orderData.customerName.trim(),
        customerPhone: orderData.customerPhone.trim(),
        customerAddress: orderData.customerAddress.trim(),
        items: orderData.items,
        subtotal: totals.subtotal,
        tax: totals.tax,
        deliveryFee: totals.deliveryFee,
        totalAmount: totals.totalAmount,
        specialNotes: orderData.specialNotes || '',
        paymentMethod: orderData.paymentMethod || 'cash',
        paymentStatus: 'pending',
        status: 'pending',
        statusHistory: [{
            status: 'pending',
            timestamp: new Date(),
            by: 'customer',
            note: 'Order placed'
        }],
        estimatedTime: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}


export function isValidStatusTransition(currentStatus, newStatus){
    const validTransitions = {
        'pending': ['accepted', 'cancelled'],
        "confirmed": ['preparing', 'cancelled'],
        "preparing": ['ready', 'cancelled'],
        "ready": ['out for delivery', 'cancelled'],
        "out for delivery": ['delivered', 'cancelled'],
        "delivered": [],
        "cancelled": []
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
}