document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORS FOR INITIAL PROFILE SETUP PAGE ---
    const profileSetupForm = document.getElementById('profile-form');
    const profileSetupMessage = document.getElementById('profile-message');

    // --- SELECTORS FOR PROFILE EDITING (within Profile Tab) ---
    const profileDetailsView = document.getElementById('profile-details-view');
    const profileEditForm = document.getElementById('profile-edit-form');
    const profileToggleButton = document.getElementById('profile-toggle-edit-button');
    const saveProfileChangesButton = document.getElementById('save-profile-changes-button');
    const displayName = document.getElementById('profile-display-name');
    const displayMobile = document.getElementById('profile-display-mobile');
    const displayStreet = document.getElementById('profile-display-street');
    const displayLandmark = document.getElementById('profile-display-landmark');
    const displayDistrict = document.getElementById('profile-display-district');
    const displayState = document.getElementById('profile-display-state');
    const displayPincode = document.getElementById('profile-display-pincode');
    const editName = document.getElementById('edit-customer-name');
    const editMobile = document.getElementById('edit-mobile-number');
    const editStreet = document.getElementById('edit-street-name');
    const editLandmark = document.getElementById('edit-nearby-landmark');
    const editDistrict = document.getElementById('edit-district');
    const editState = document.getElementById('edit-state');
    const editPincode = document.getElementById('edit-pincode');

    // --- FIXED: EVENT LISTENER FOR INITIAL PROFILE SETUP SAVE ---
    if (profileSetupForm) {
        profileSetupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
            showLoader();

            const updates = {
                full_name: document.getElementById('customer-name').value.trim(),
                mobile_number: document.getElementById('mobile-number').value.trim(),
                street_name: document.getElementById('street-name').value.trim(),
                nearby_landmark: document.getElementById('nearby-landmark').value.trim(),
                district: document.getElementById('district').value.trim(),
                state: document.getElementById('state').value.trim(),
                pincode: document.getElementById('pincode').value.trim(),
                user_type: 'Customer' // FIXED: Added user_type to satisfy NOT NULL constraint
            };

            if (!updates.full_name || !updates.mobile_number || !updates.pincode) {
                profileSetupMessage.textContent = 'Full Name, Mobile Number, and Pincode are required.';
                profileSetupMessage.className = 'message error';
                hideLoader();
                return;
            }

            try {
                const user = window.currentUser;
                if (!user) {
                    alert('Session expired. Please log in again.');
                    hideLoader();
                    navigateToPage('login-page');
                    return;
                }

                updates.id = user.id;
                updates.updated_at = new Date().toISOString();

                const { data, error } = await supabase
                    .from('profiles')
                    .upsert(updates)
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    window.userProfile = data; // CRITICAL: Update global state
                    profileSetupMessage.textContent = 'Profile saved successfully! Redirecting...';
                    profileSetupMessage.className = 'message';
                    
                    // Redirect to the main application home page
                    navigateToPage('main-app-view', 'home-page-content');
                }
            } catch (error) {
                console.error('Error saving profile:', error.message);
                profileSetupMessage.textContent = `Failed to save profile: ${error.message}`;
                profileSetupMessage.className = 'message error';
            } finally {
                hideLoader();
            }
        });
    }


    // --- EXISTING LOGIC FOR PROFILE PAGE (VIEW/EDIT) ---
    async function loadProfileData() {
        showLoader();
        try {
            const user = window.currentUser;
            if (!user) {
                console.error('User not logged in, cannot load profile.');
                hideLoader();
                return;
            }
            const profile = await fetchProfile(user.id);
            if (profile) {
                window.userProfile = profile;
                displayName.textContent = profile.full_name || 'N/A';
                displayMobile.textContent = profile.mobile_number || 'N/A';
                displayStreet.textContent = profile.street_name || 'N/A';
                displayLandmark.textContent = profile.nearby_landmark || 'N/A';
                displayDistrict.textContent = profile.district || 'N/A';
                displayState.textContent = profile.state || 'N/A';
                displayPincode.textContent = profile.pincode || 'N/A';

                editName.value = profile.full_name || '';
                editMobile.value = profile.mobile_number || '';
                editStreet.value = profile.street_name || '';
                editLandmark.value = profile.nearby_landmark || '';
                editDistrict.value = profile.district || '';
                editState.value = profile.state || '';
                editPincode.value = profile.pincode || '';

                profileDetailsView.classList.remove('hidden');
                profileEditForm.classList.add('hidden');
                profileToggleButton.textContent = 'Edit Profile';
            } else {
                console.warn('Profile not found for user.');
                profileDetailsView.innerHTML = `<p>No profile data found. Please set up your profile.</p>`;
                profileEditForm.classList.remove('hidden');
                profileDetailsView.classList.add('hidden');
                profileToggleButton.textContent = 'Cancel';
            }
        } catch (error) {
            console.error('Error loading profile data:', error.message);
            profileDetailsView.innerHTML = `<p>Error loading profile data.</p>`;
        } finally {
            hideLoader();
        }
    }

    profileToggleButton.addEventListener('click', () => {
        const isEditMode = !profileEditForm.classList.contains('hidden');
        if (isEditMode) {
            profileDetailsView.classList.remove('hidden');
            profileEditForm.classList.add('hidden');
            profileToggleButton.textContent = 'Edit Profile';
        } else {
            profileDetailsView.classList.add('hidden');
            profileEditForm.classList.remove('hidden');
            profileToggleButton.textContent = 'Cancel Edit';
        }
    });

    saveProfileChangesButton.addEventListener('click', async () => {
        showLoader();
        try {
            const user = window.currentUser;
            if (!user) {
                alert('You must be logged in to update your profile.');
                hideLoader();
                return;
            }
            const updates = {
                full_name: editName.value,
                mobile_number: editMobile.value,
                street_name: editStreet.value,
                nearby_landmark: editLandmark.value,
                district: editDistrict.value,
                state: editState.value,
                pincode: editPincode.value,
            };
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            if (data) {
                window.userProfile = data;
                alert('Profile updated successfully!');
                await loadProfileData();
                profileDetailsView.classList.remove('hidden');
                profileEditForm.classList.add('hidden');
                profileToggleButton.textContent = 'Edit Profile';
            }
        } catch (error) {
            console.error('Error updating profile:', error.message);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            hideLoader();
        }
    });

    window.displayUserProfile = loadProfileData;
});
