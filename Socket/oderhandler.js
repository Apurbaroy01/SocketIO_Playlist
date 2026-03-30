import { getCollection } from "../config/database.js";
import { CalculateTotal, createOrderDocument, generateOrderId } from "../utils/halper.js";

export const orderHandelar = (io, socket) =>{
    console.log("Order handler initialized for socket: " + socket.id);

    socket.on('placeOrder', async (data, callback) => {
        try {
            console.log('place oder from:' + socket.id);
            const validation = validateOrder(data);
            if (!validation.valid) {
                return callback({ success: false, message: validation.message });
            }
            const totals = CalculateTotal(data.items);
            const orderId = generateOrderId();
            const order= createOrderDocument(data, orderId, totals);

            const ordersCollection = getCollection('orders');
            await ordersCollection.insertOne(order);

            socket.join(`order-${orderId}`);
            socket.join(`Customers`);
            io.to(`admins`).emit('newOrder', { order });
            callback({ success: true, message: 'Order placed successfully', orderId });
            console.log(`Order created ${orderId}`);
            
            
        } catch (error) {
            console.error('Error placing order:', error);
            callback({ success: false, message: 'Failed to place order' });
        }
    });
}