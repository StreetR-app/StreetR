// js_auth.js

const loginEmailInput = document.getElementById('login-email');
const loginButton = document.getElementById('login-button');
const termsCheckbox = document.getElementById('terms-conditions');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');

async function handleLogin() {
    const email = loginEmailInput.value.trim();
    if (!email) {
        loginMessage.textContent = 'Please enter your email.';
        loginMessage.className = 'message error';
        return;
    }
    if (!termsCheckbox.checked) {
        loginMessage.textContent = 'You must accept the Terms & Conditions.';
        loginMessage.className = 'message error';
        return;
    }

    showLoader();
    loginMessage.textContent = 'Sending magic link...';
    loginMessage.className = 'message';
    loginButton.disabled = true;

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: "https://streetr-app.github.io/StreetR/",
            },
        });
        if (error) throw error;
        loginMessage.textContent = 'Login link sent! Please check your email to sign in.';
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = `Error: ${error.message}`;
        loginMessage.className = 'message error';
    } finally {
        loginButton.disabled = false;
        hideLoader();
    }
}

async function handleLogout() {
    showLoader();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
    // The onAuthStateChange listener in js_main.js will handle the navigation.
    hideLoader();
}

if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
}
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}
