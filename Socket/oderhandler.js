import { getCollection } from "../config/database.js";
import { CalculateTotal, createOrderDocument, generateOrderId } from "../utils/halper.js";

export const orderHandelar = (io, socket) => {
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
            const order = createOrderDocument(data, orderId, totals);

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


    // track oder status
    socket.on('trackOrder', async (data, callback) => {
        try {
            const ordersCollection = getCollection('orders');
            const order = await ordersCollection.findOne({ orderId: data.orderId });
            if (!order) {
                return callback({ success: false, message: 'Order not found' });
            }
            socket.join(`order-${data.orderId}`);
            callback({ success: true, message: 'Order found', order });
        } catch (error) {
            console.error('Error tracking order:', error);
            callback({ success: false, message: 'Failed to track order' });
        }
    })


    //  cancel order
    socket.on('cancelOrder', async (data, callback) => {
        try {
            const ordersCollection = getCollection('orders');
            const order = await ordersCollection.findOne({ orderId: data.orderId });
            if (!order) {
                return callback({ success: false, message: 'Order not found' });
            }
            if (!['pending', 'confirmed'].includes(order.status)) {
                return callback({ success: false, message: 'cannot cancel order' });
            }

            await ordersCollection.updateOne(
                { orderId: data.orderId },
                {
                    $set: { status: 'cancelled', upadatedAt: new Date() },
                    $push: {
                        statusHistory:
                        {
                            status: 'cancelled',
                            timestamp: new Date(),
                            by: socket.id,
                            note: data.reason || 'No reason provided'
                        }
                    }
                }
            );
            io.to(`order-${data.orderId}`).emit('orderCancelled', { orderId: data.orderId, reason: data.reason });

            io.to(`admins`).emit('orderCancelled', { orderId: data.orderId, reason: data.reason, customerName: order.customerName });

            callback({ success: true, message: 'Order cancelled successfully' });
            console.log(`Order cancelled ${data.orderId}`);


        } catch (error) {
            console.error('Error canceling order:', error);
            callback({ success: false, message: 'Failed to cancel order' });
        }
    })


    // get all order for
    socket.on('getMyOrders', async (data, callback) => {
        try {
            const ordersCollection = getCollection('orders');
            const orders = await ordersCollection.find({ customerPhone: data.customerPhone })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
            
            callback({ success: true, orders });

        } catch (error) {
            console.error('Error fetching orders:', error);
            callback({ success: false, message: 'Failed to fetch orders' });
        }
    })
}