// js_payment.js

let currentPaymentData = null;

document.addEventListener('DOMContentLoaded', () => {
    const placeOrderButton = document.getElementById('place-order-button');
    const backToCartButton = document.getElementById('back-to-cart-button');
    const retryPaymentButton = document.getElementById('retry-payment-button');

    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', handlePlaceOrder);
    }

    if (backToCartButton) {
        backToCartButton.addEventListener('click', () => {
            navigateToPage('main-app-view', 'cart-page-content');
        });
    }

    if (retryPaymentButton) {
        retryPaymentButton.addEventListener('click', () => {
            if (currentPaymentData) {
                initializePayment(currentPaymentData);
            }
        });
    }

    // Initialize payment when payment page is shown
    const paymentPage = document.getElementById('payment-page');
    if (paymentPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (paymentPage.classList.contains('active') && !paymentPage.dataset.initialized) {
                    paymentPage.dataset.initialized = 'true';
                    handlePlaceOrder();
                } else if (!paymentPage.classList.contains('active')) {
                    paymentPage.dataset.initialized = '';
                    // Clean up payment container when leaving page
                    const container = document.getElementById('payment-container');
                    if (container) {
                        container.innerHTML = '<p class="payment-loading-text">Loading payment gateway...</p>';
                    }
                }
            });
        });
        observer.observe(paymentPage, { attributes: true, attributeFilter: ['class'] });
    }
});

async function handlePlaceOrder() {
    showLoader();
    try {
        const cart = getCart();
        if (cart.length === 0) {
            alert("Your cart is empty.");
            hideLoader();
            navigateToPage('main-app-view', 'cart-page-content');
            return;
        }

        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const gst = subtotal * 0.10; // Fixed to match cart calculation (10%)
        const deliveryFee = calculateDeliveryFee(subtotal);
        const platformFee = 20;
        const totalAmount = subtotal + gst + deliveryFee + platformFee;

        // Store payment data for retry
        currentPaymentData = {
            totalAmount,
            platformFee,
            gst,
            deliveryFee,
            subtotal,
            cart
        };

        // Display payment summary
        displayPaymentSummary(currentPaymentData);

        // 1. Generate the order_token from your backend
        const { order_token } = await generateCashfreeToken(totalAmount, cart);

        // 2. Show the Cashfree Drop-in UI
        triggerCashfreeCheckout(order_token, currentPaymentData);

    } catch (error) {
        console.error("Error placing order:", error);
        showPaymentError(error.message);
    } finally {
        hideLoader();
    }
}

function displayPaymentSummary(paymentData) {
    const summary = document.getElementById('payment-summary');
    if (summary) {
        document.getElementById('payment-subtotal').textContent = `₹${paymentData.subtotal.toFixed(2)}`;
        document.getElementById('payment-gst').textContent = `₹${paymentData.gst.toFixed(2)}`;
        document.getElementById('payment-delivery-fee').textContent = `₹${paymentData.deliveryFee.toFixed(2)}`;
        document.getElementById('payment-platform-fee').textContent = `₹${paymentData.platformFee.toFixed(2)}`;
        document.getElementById('payment-grand-total').textContent = `₹${paymentData.totalAmount.toFixed(2)}`;
        summary.classList.remove('hidden');
    }
}

function showPaymentError(message) {
    const errorDiv = document.getElementById('payment-error');
    const errorMessage = errorDiv?.querySelector('.error-message');
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    const container = document.getElementById('payment-container');
    if (container) {
        container.innerHTML = '<p class="payment-loading-text">Payment failed. Please try again.</p>';
    }
}

function hidePaymentError() {
    const errorDiv = document.getElementById('payment-error');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function initializePayment(paymentData) {
    hidePaymentError();
    handlePlaceOrder();
}

async function generateCashfreeToken(totalAmount, cart) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error("User not authenticated. Please log in again.");
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-cashfree-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ 
                total_amount: totalAmount, 
                cart: cart 
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to generate payment token.';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use the text or status
                if (response.status === 404) {
                    errorMessage = 'Payment service is not configured. Please contact support.';
                } else if (response.status === 401 || response.status === 403) {
                    errorMessage = 'Authentication failed. Please log in again.';
                } else {
                    errorMessage = `Payment service error (${response.status}). Please try again.`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.order_token) {
            throw new Error('Invalid response from payment service. Missing order token.');
        }

        return data;
    } catch (error) {
        // Re-throw if it's already our custom error
        if (error.message && error.message.includes('payment') || error.message.includes('token') || error.message.includes('authenticated')) {
            throw error;
        }
        // Otherwise, wrap network errors
        throw new Error(`Network error: ${error.message}. Please check your connection and try again.`);
    }
}

function triggerCashfreeCheckout(orderToken, orderData) {
    const paymentContainer = document.getElementById("payment-container");
    if (!paymentContainer) {
        throw new Error("Payment container not found.");
    }

    // Clear any previous content
    paymentContainer.innerHTML = '';

    // Check if Cashfree SDK is loaded
    if (typeof Cashfree === 'undefined') {
        showPaymentError('Payment gateway SDK failed to load. Please refresh the page and try again.');
        return;
    }

    try {
        const cashfree = new Cashfree({
            mode: "sandbox" // Use "production" for live payments
        });

        cashfree.drop(paymentContainer, {
            orderToken: orderToken,
            onSuccess: (data) => {
                console.log("Payment successful:", data);
                handlePaymentSuccess(data.order, orderData);
            },
            onFailure: (data) => {
                console.error("Payment failed:", data);
                const errorMessage = data.order?.errorText || data.error?.message || 'Payment failed. Please try again.';
                showPaymentError(errorMessage);
            },
        });
    } catch (error) {
        console.error("Error initializing Cashfree:", error);
        showPaymentError(`Failed to initialize payment gateway: ${error.message}`);
    }
}

async function handlePaymentSuccess(order, orderData) {
    showLoader();
    try {
        const { cart, totalAmount, platformFee, gst, deliveryFee } = orderData;
        
        if (!cart || cart.length === 0) {
            throw new Error("Cart is empty. Cannot process order.");
        }

        const sellerId = cart[0].seller_id || null;
        if (!sellerId) {
            throw new Error("Seller information is missing from the cart.");
        }

        if (!window.currentUser || !window.currentUser.id) {
            throw new Error("User session expired. Please log in again.");
        }

        const sellerAmount = totalAmount - platformFee - gst - deliveryFee;
        const companyProfit = platformFee + gst;

        // Get payment token from order response
        const paymentToken = order.paymentToken || order.payment_token || order.orderId || 'N/A';

        // 3. Store order data in Supabase
        const { data: insertedOrder, error } = await supabase
            .from('orders')
            .insert([{
                payment_token: paymentToken,
                user_id: window.currentUser.id,
                seller_id: sellerId,
                total_amount: totalAmount,
                platform_fee: platformFee,
                gst: gst,
                delivery_fee: deliveryFee,
                seller_amount: sellerAmount,
                company_profit: companyProfit,
                status: 'paid',
                order_details: cart,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            throw new Error(`Failed to save order: ${error.message}`);
        }

        // Clear the cart
        localStorage.removeItem('streetrCart');
        
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        // Show success message
        alert("Payment successful! Your order has been placed.");
        
        // Navigate to orders page
        navigateToPage('main-app-view', 'orders-page-content');
        
        // Refresh orders list
        if (typeof loadOrders === 'function') {
            loadOrders();
        }

    } catch (error) {
        console.error("Error saving order:", error);
        alert(`An error occurred while saving your order: ${error.message}`);
        showPaymentError(`Order processing failed: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// Utility functions
function getCart() {
    try {
        const cartData = localStorage.getItem('streetrCart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error("Error reading cart from localStorage:", error);
        return [];
    }
}

function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}
