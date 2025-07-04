// js_payment.js (New File)

document.addEventListener('DOMContentLoaded', () => {
    const payWithRazorpayButton = document.getElementById('pay-with-razorpay-button');
    const paymentQrCode = document.getElementById('payment-qr-code');

    // This function would be called when navigating to the payment page
    // It should ideally be called from js_add_to_cart.js (from the Place Order button)
    // or js_main.js when setting up the page navigation.
    window.loadPaymentPage = function() {
        const amountToPay = window.paymentAmount || 0; // Get amount from global variable set by cart

        if (amountToPay === 0) {
            console.warn('Payment amount is 0, returning to cart.');
            navigateToPage('main-app-view', 'cart-page-content');
            return;
        }

        console.log('Loading payment page for amount:', amountToPay);
        // You would dynamically generate a QR code here for UPI payment
        // For demonstration, we'll use a placeholder image.
        // In a real app, this would be a server-side generated UPI QR code string
        // or a Razorpay QR code specific to the transaction.
        paymentQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=yourvpa@bank&pn=StreetR&am=${amountToPay.toFixed(2)}`;
        // Replace 'yourvpa@bank' with an actual UPI VPA for testing or dynamic VPA
    };

    if (payWithRazorpayButton) {
        payWithRazorpayButton.addEventListener('click', () => {
            alert('Initiating Razorpay payment... (Integration would go here)');
            console.log('Attempting Razorpay payment for amount:', window.paymentAmount);

            // Simulate Razorpay checkout (replace with actual Razorpay integration)
            const options = {
                key: "YOUR_RAZORPAY_KEY_ID", // Replace with your actual Razorpay Key ID
                amount: (window.paymentAmount * 100).toFixed(0), // Amount in paisa
                currency: "INR",
                name: "StreetR",
                description: "Food Order Payment",
                image: "assets/app-logo.png",
                handler: function (response) {
                    alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
                    console.log("Razorpay Response:", response);
                    // On payment success, move to orders page
                    navigateToPage('main-app-view', 'orders-page-content');
                    // Clear the cart after successful payment
                    cart = [];
                    saveCart(); // Save empty cart
                },
                prefill: {
                    name: window.userProfile?.customer_name || "Customer",
                    email: window.currentUser?.email || "",
                    contact: window.userProfile?.mobile_number || ""
                },
                notes: {
                    address: "StreetR Office"
                },
                theme: {
                    color: "#388E3C" // Green color for Razorpay theme
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('razorpay_payment_failed', function (response) {
                alert("Payment Failed: " + response.error.code + " - " + response.error.description);
                console.error("Razorpay Error:", response.error);
                // Stay on payment page or navigate back to cart
            });
            rzp.open();
        });
    }

    // This ensures loadPaymentPage is called when the payment page is actually displayed
    // It's assumed to be part of the navigateToPage logic in js_main.js
    // or explicitly called after navigateToPage completes.
    // For now, let's add a listener to the page content div if it becomes active.
    const paymentPageContent = document.getElementById('payment-page');
    if (paymentPageContent) {
        // Observer to check when payment-page becomes active (if not using direct calls from main.js)
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.attributeName === 'class') {
                    if (paymentPageContent.classList.contains('active') && !paymentPageContent.dataset.loaded) {
                        window.loadPaymentPage();
                        paymentPageContent.dataset.loaded = 'true'; // Prevent re-loading
                    } else if (!paymentPageContent.classList.contains('active')) {
                        paymentPageContent.dataset.loaded = ''; // Reset when page is hidden
                    }
                }
            }
        });
        observer.observe(paymentPageContent, { attributes: true });
    }

    // Include Razorpay's checkout.js script dynamically or in index.html
    // This should ideally be in index.html for faster loading
    // <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
});
