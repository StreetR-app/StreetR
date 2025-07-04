// js_order.js
const ordersListDiv = document.getElementById('orders-list');

async function createOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    if (!window.currentUser || !window.userProfile) {
        alert("You must be logged in to place an order.");
        return;
    }

    showLoader();

    try {
        // In a real app, you might have multiple sellers in one cart.
        // This simple version assumes all items are from the same seller for simplicity.
        const sellerId = cart[0].seller_id; 
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const orderData = {
            seller_id: sellerId,
            customer_id: window.currentUser.id,
            customer_name: window.userProfile.full_name,
            customer_contact: window.userProfile.mobile_number,
            order_details: { items: cart }, // Storing items array in JSONB
            total_amount: totalAmount,
            [span_0](start_span)status: 'Pending' // Default status[span_0](end_span)
        };

        const { error } = await supabase.from('orders').insert(orderData);

        if (error) throw error;

        alert("Order placed successfully!");
        saveCart([]); // Clear the cart
        navigateToPage('main-app-view', 'orders-page-content');
        loadOrders();

    } catch (error) {
        console.error("Error creating order:", error);
        alert(`Failed to place order: ${error.message}`);
    } finally {
        hideLoader();
    }
}

async function loadOrders() {
    if (!window.currentUser) return;
    showLoader();
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderOrders(data);

    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersListDiv.innerHTML = '<p>Could not load your orders.</p>';
    } finally {
        hideLoader();
    }
}

function renderOrders(orders) {
    ordersListDiv.innerHTML = '';
    if (!orders || orders.length === 0) {
        ordersListDiv.innerHTML = "<p>You haven't placed any orders yet.</p>";
        return;
    }

    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        let itemsHtml = order.order_details.items.map(item => `<li>${item.name} (Qty: ${item.quantity})</li>`).join('');

        orderDiv.innerHTML = `
            <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}</p>
            <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <ul>${itemsHtml}</ul>
            <small>Placed on: ${new Date(order.created_at).toLocaleString()}</small>
            <div class="live-tracking-placeholder">
                <p>Live tracking map will be integrated here.</p>
            </div>
        `;
        ordersListDiv.appendChild(orderDiv);
    });
}
