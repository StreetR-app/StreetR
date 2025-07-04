// js_add_to_cart.js
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryDiv = document.getElementById('cart-summary');
const cartEmptyView = document.getElementById('cart-empty-view');

// Bill details spans
const cartSubtotalSpan = document.getElementById('cart-subtotal');
const cartGstSpan = document.getElementById('cart-gst');
const cartDeliveryFeeSpan = document.getElementById('cart-delivery-fee');
const cartGrandTotalSpan = document.getElementById('cart-grand-total');

const placeOrderButton = document.getElementById('place-order-button');

function getCart() {
    return JSON.parse(localStorage.getItem('streetrCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('streetrCart', JSON.stringify(cart));
    // Post a custom event that the cart has been updated
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCart(item) {
    let cart = getCart();
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    // Simple feedback, can be replaced with a less intrusive toast notification
    alert(`${item.name} added to cart!`);
    displayCartItems();
}

function updateCartQuantity(itemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(cartItem => cartItem.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart(cart);
    displayCartItems();
}

function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}

function displayCartItems() {
    const cart = getCart();
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartSummaryDiv.classList.add('hidden');
        cartEmptyView.classList.remove('hidden');
        placeOrderButton.classList.add('hidden');
        return;
    }

    cartSummaryDiv.classList.remove('hidden');
    cartEmptyView.classList.add('hidden');
    placeOrderButton.classList.remove('hidden');

    let subtotal = 0;
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-card';
        itemElement.innerHTML = `
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <p>Price: ₹${item.price.toFixed(2)}</p>
                <div class="cart-item-footer">
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
                    </div>
                    <span class="cart-item-subtotal">₹${itemSubtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Update bill details
    const gst = subtotal * 0.10;
    const deliveryFee = calculateDeliveryFee(subtotal);
    const grandTotal = subtotal + gst + deliveryFee;

    cartSubtotalSpan.textContent = `₹${subtotal.toFixed(2)}`;
    cartGstSpan.textContent = `₹${gst.toFixed(2)}`;
    cartDeliveryFeeSpan.textContent = `₹${deliveryFee.toFixed(2)}`;
    cartGrandTotalSpan.textContent = `₹${grandTotal.toFixed(2)}`;

    // Add event listeners to new quantity buttons
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            const change = parseInt(btn.dataset.change);
            updateCartQuantity(itemId, change);
        });
    });
}

placeOrderButton?.addEventListener('click', () => {
    navigateToPage('payment-page');
});
