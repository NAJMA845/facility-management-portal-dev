// Technician Contact Form Handler
(function() {
    const form = document.getElementById('contactForm');
    const messageTextarea = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Update character count
    messageTextarea?.addEventListener('input', () => {
        const length = messageTextarea.value.length;
        charCount.textContent = length;
        messageTextarea.style.borderColor = length > 2000 ? '#ef4444' : '#e2e8f0';
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset messages
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');

        // Get form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();

        // Validation
        if (!name || !email || !subject || !message) {
            showError('Please fill in all required fields.');
            return;
        }

        if (message.length > 2000) {
            showError('Message cannot exceed 2000 characters.');
            return;
        }

        // Disable submit button and show loading
        submitBtn.disabled = true;
        loadingIndicator.classList.add('show');

        try {
            const result = await window.api.createContact(name, email, phone, subject, message);

            if (result && result.contact) {
                // Success
                form.reset();
                charCount.textContent = '0';
                successMessage.classList.add('show');
                loadingIndicator.classList.remove('show');
                submitBtn.disabled = false;

                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    successMessage.classList.remove('show');
                }, 5000);
            } else {
                showError('Failed to send your message. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting contact form:', err);
            showError('An error occurred while sending your message. Please try again.');
        } finally {
            submitBtn.disabled = false;
            loadingIndicator.classList.remove('show');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        loadingIndicator.classList.remove('show');
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        // No auth check needed - public form
        // Just ensure API is available
        if (!window.api || !window.api.createContact) {
            console.error('API not available');
        }
    });
})();
