// js_qr_scanner.js
const qrScannerButton = document.getElementById('qr-scanner-button');
const qrScannerPage = document.getElementById('qr-scanner-page');
const closeScannerButton = document.getElementById('close-scanner-button');
let html5QrCode;

qrScannerButton.addEventListener('click', () => {
    navigateToPage('qr-scanner-page');
    startScanner();
});

closeScannerButton.addEventListener('click', () => {
    stopScanner();
    navigateToPage('search-page');
});

function startScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        /* handle success */
        stopScanner();
        console.log(`Code matched = ${decodedText}`, decodedResult);
        
        // Example URL: customer-menu.html?sellerId=...
        try {
            const url = new URL(decodedText);
            const sellerId = url.searchParams.get('sellerId');
            if (sellerId) {
                alert(`Seller found! Loading menu...`);
                showShopProfilePage(sellerId); // Function from js_shop.js
            } else {
                alert("Invalid QR Code: Seller ID not found.");
                navigateToPage('search-page');
            }
        } catch (e) {
            alert("Invalid QR Code scanned.");
            navigateToPage('search-page');
        }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Start scanning
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error("Unable to start scanning.", err);
            alert("Could not start QR scanner. Please check camera permissions.");
            navigateToPage('search-page');
        });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning stopped.");
        }).catch(err => {
            console.error("Failed to stop QR Code scanning.", err);
        });
    }
}
