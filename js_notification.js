//js_notification.js
const popup1 = document.getElementById('notification-popup-1');
const popup2 = document.getElementById('notification-popup-2');
const popup3 = document.getElementById('notification-popup-3');
const dontShowAgainCheckbox = document.getElementById('dont-show-again');

function showPopUpNotifications() {
    // Check if the user has opted out of seeing the third notification
    const dontShowPopup3 = localStorage.getItem('dontShowStreetRPopup3');

    // Show first popup after 2 seconds
    setTimeout(() => {
        popup1?.classList.remove('hidden');
    }, 2000);

    // Show second popup after 5 seconds
    setTimeout(() => {
        popup2?.classList.remove('hidden');
    }, 5000);
    
    // Show third popup after 8 seconds, only if not opted out
    if (dontShowPopup3 !== 'true') {
        setTimeout(() => {
            popup3?.classList.remove('hidden');
        }, 8000);
    }

    // Add event listeners to all close buttons
    document.querySelectorAll('.close-popup-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.popup-notification').classList.add('hidden');
        });
    });

    // Add event listener for the "Don't show again" checkbox
    if (dontShowAgainCheckbox) {
        dontShowAgainCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('dontShowStreetRPopup3', 'true');
            } else {
                localStorage.removeItem('dontShowStreetRPopup3');
            }
        });
    }
}

// Function to request push notifications (optional, can be called later)
function requestPushNotifications() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            } else {
                console.log("Notification permission denied.");
            }
        });
    } else {
        console.log("This browser does not support notifications.");
    }
}
