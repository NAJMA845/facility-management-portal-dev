// Profile Page Script
let currentUser = null;
let modal;

async function init() {
    if (!checkAuth()) return;
    
    modal = new Modal('editProfileModal');
    
    await loadProfile();
    
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
    modal.setSubmitHandler(handleSubmit);
}

async function loadProfile() {
    const profile = await window.api.getProfile();
    if (profile && profile.user) {
        currentUser = profile.user;
        displayProfile(currentUser);
    }
}

function displayProfile(user) {
    document.getElementById('profileName').textContent = user.name || 'User';
    document.getElementById('profileRole').textContent = user.role || 'User';
    document.getElementById('profileEmail').textContent = user.email || 'N/A';
    
    document.getElementById('fieldEmail').textContent = user.email || 'N/A';
    document.getElementById('fieldRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'User';
    document.getElementById('fieldDepartment').textContent = user.department || 'N/A';
    document.getElementById('fieldPhone').textContent = user.phone || 'N/A';
    document.getElementById('fieldBio').textContent = user.bio || 'N/A';
    document.getElementById('fieldCreated').textContent = user.created_at ? formatDate(user.created_at) : 'N/A';
}

function openEditModal() {
    if (!currentUser) return;
    
    modal.clearForm();
    document.getElementById('profileNameInput').value = currentUser.name || '';
    document.getElementById('profileDepartmentInput').value = currentUser.department || '';
    document.getElementById('profilePhoneInput').value = currentUser.phone || '';
    document.getElementById('profileBioInput').value = currentUser.bio || '';
    
    modal.open();
}

async function handleSubmit(formData) {
    if (!formData.name) {
        modal.showError('name', 'Name is required');
        return;
    }
    
    try {
        const result = await window.api.updateProfile({
            name: formData.name,
            department: formData.department,
            phone: formData.phone,
            bio: formData.bio
        });
        
        if (result && result.user) {
            currentUser = result.user;
            displayProfile(currentUser);
            showToast('Profile updated successfully', 'success');
            modal.close();
        } else {
            showToast('Failed to update profile', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
