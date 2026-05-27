let initialProfile = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (window.authGuard) {
        const user = window.authGuard.protect();
        if (!user) return;
    }

    const form = document.getElementById('settingsForm');
    const resetBtn = document.getElementById('settingsResetBtn');

    form?.addEventListener('submit', handleSubmit);
    resetBtn?.addEventListener('click', () => fillForm(initialProfile));

    await loadProfile();
}

async function loadProfile() {
    try {
        const result = await window.api.getProfile();
        initialProfile = result?.user || null;
        fillForm(initialProfile);
    } catch (err) {
        console.error('Failed loading settings profile', err);
        showToast('Failed to load settings', 'error');
    }
}

function fillForm(user) {
    if (!user) return;
    document.getElementById('settingsName').value = user.name || '';
    document.getElementById('settingsDepartment').value = user.department || '';
    document.getElementById('settingsPhone').value = user.phone || '';
    document.getElementById('settingsBio').value = user.bio || '';
}

async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    if (!payload.name) {
        showToast('Display name is required', 'error');
        return;
    }

    try {
        const result = await window.api.updateProfile(payload);
        if (result && result.error) {
            showToast(result.error, 'error');
            return;
        }

        initialProfile = result?.user || initialProfile;
        showToast('Settings updated successfully', 'success');
    } catch (err) {
        console.error('Failed updating settings', err);
        showToast('Failed to update settings', 'error');
    }
}
