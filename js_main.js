// Global state variables
window.currentUser = null;
window.userProfile = null;
// DOM Element selectors
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('#main-app-view .tab-content');
const appHeader = document.getElementById('app-header');
const bottomNav = document.getElementById('bottom-nav');
const pageFooter = document.getElementById('page-footer');
const searchPageButton = document.getElementById('search-page-button');
const likesPageButton = document.getElementById('likes-page-button');
// --- LOADER ---
function showLoader() {
document.getElementById('loading-modal').classList.remove('hidden');
}
function hideLoader() {
document.getElementById('loading-modal').classList.add('hidden');
}
// --- NAVIGATION ---
function navigateToPage(pageId, tabContentId = null) {
pages.forEach(page => page.classList.remove('active'));
document.getElementById(pageId)?.classList.add('active');
const isMainView = pageId === 'main-app-view';
appHeader.style.display = isMainView ? 'flex' : 'none';
bottomNav.style.display = isMainView ?
'flex' : 'none';
// Manage footer visibility for cart's sticky button
pageFooter.style.display = 'none';
pageFooter.querySelector('#cart-footer').classList.add('hidden');
if (isMainView) {
let activeTabId = tabContentId || 'home-page-content';
navItems.forEach(nav => nav.classList.remove('active'));
tabContents.forEach(tab => tab.classList.remove('active'));
document.getElementById(activeTabId)?.classList.add('active');
const activeNavButton = bottomNav.querySelector(`[data-page="${activeTabId}"]`);
if (activeNavButton) {
activeNavButton.classList.add('active');
}
handleTabChange(activeTabId);
}
}
function handleTabChange(activeTabId) {
if (activeTabId === 'cart-page-content') {
pageFooter.style.display = 'block';
pageFooter.querySelector('#cart-footer').classList.remove('hidden');
}
switch (activeTabId) {
case 'home-page-content':
loadHomePageContent();
break;
case 'orders-page-content':
loadOrders();
break;
case 'map-page-content':
initializeMap();
break;
case 'profile-page-content':
displayUserProfile();
break;
case 'cart-page-content':
displayCartItems();
break;
}
}
// --- AUTHENTICATION FLOW (THE FIX) ---
async function fetchProfile(userId) {
const {
data,
error
} = await supabase
.from('profiles')
.select('*')
.eq('id', userId)
.single();
if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
console.error("Error fetching profile:", error);
return null;
}
return data;
}
async function handleUserSession(session) {
    window.currentUser = session.user;
    const profile = await fetchProfile(session.user.id);

    // MODIFIED: Check for full_name and a pincode to ensure the profile is truly complete.
    // This prevents users with partially filled profiles from getting stuck and
    // ensures the home page can load items correctly, as it depends on the pincode.
    if (profile && profile.full_name && profile.pincode) { // Profile is complete
        window.userProfile = profile;
        navigateToPage('main-app-view');
        showPopUpNotifications(); // Show popups on successful login to main app
    } else if (profile) { // Profile exists but is incomplete
        window.userProfile = profile;
        navigateToPage('profile-setup-page');
    } else { // Profile does not exist (should be rare with the trigger)
        navigateToPage('profile-setup-page');
    }
}
async function checkAuthState() {
showLoader();
const {
data: {
session
}
} = await supabase.auth.getSession();
if (session) {
await handleUserSession(session);
} else {
navigateToPage('login-page');
}
hideLoader();
}
supabase.auth.onAuthStateChange((event, session) => {
if (event === 'SIGNED_IN' && session) {
handleUserSession(session);
} else if (event === 'SIGNED_OUT') {
window.currentUser = null;
window.userProfile = null;
localStorage.clear(); // Clear all data on logout
navigateToPage('login-page');
}
});
// --- UI & ANIMATIONS ---
function launchConfetti() {
const container = document.getElementById('confetti-container');
for (let i = 0; i < 50; i++) {
const confetti = document.createElement('div');
confetti.className = 'confetti';
confetti.style.left = `${Math.random() * 100}vw`;
confetti.style.animation = `confetti-fall ${1 + Math.random() * 2}s linear forwards`;
confetti.style.animationDelay = `${Math.random() * 0.5}s`;
container.appendChild(confetti);
setTimeout(() => confetti.remove(), 3000);
}
}
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
// New More Menu Elements
const moreNavButton = document.getElementById('more-nav-button');
const moreMenuPopup = document.getElementById('more-menu-popup');
const closeMoreMenuBtn = document.getElementById('close-more-menu-btn');
const moreMenuOverlay = document.querySelector('.more-menu-overlay');
// Nav item clicks
navItems.forEach(item => {
item.addEventListener('click', () => {
const targetTabId = item.getAttribute('data-page');
if (targetTabId) {
navigateToPage('main-app-view', targetTabId);
}
});
});
// Header button clicks
searchPageButton?.addEventListener('click', () => navigateToPage('search-page'));
likesPageButton?.addEventListener('click', () => {
navigateToPage('likes-page');
loadLikedItems();
});
// Generic back to home button clicks
document.querySelectorAll('.back-to-home-btn').forEach(button => {
button.addEventListener('click', () => {
navigateToPage('main-app-view', 'home-page-content');
});
});
// More Menu button click
moreNavButton?.addEventListener('click', (e) => {
e.stopPropagation();
moreMenuPopup.classList.remove('hidden');
});
// Close More Menu
const closeMoreMenu = () => {
moreMenuPopup.classList.add('hidden');
};
closeMoreMenuBtn?.addEventListener('click', closeMoreMenu);
moreMenuOverlay?.addEventListener('click', closeMoreMenu);
// Initial auth check
checkAuthState();
});
