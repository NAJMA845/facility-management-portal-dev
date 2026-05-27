document.addEventListener("DOMContentLoaded", () => {
    // Smooth scroll feature for navbar links
    const navLinks = document.querySelectorAll(".nav-links a");
    
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            if (targetId.startsWith("#")) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    const contactForm = document.getElementById("publicContactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const statusEl = document.getElementById("contactFormStatus");
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const payload = {
                name: document.getElementById("contactName")?.value?.trim() || "",
                email: document.getElementById("contactEmail")?.value?.trim() || "",
                phone: document.getElementById("contactPhone")?.value?.trim() || "",
                subject: document.getElementById("contactSubject")?.value?.trim() || "",
                message: document.getElementById("contactMessage")?.value?.trim() || ""
            };

            if (!payload.name || !payload.email || !payload.subject || !payload.message) {
                if (statusEl) {
                    statusEl.textContent = "Please fill all required fields.";
                    statusEl.className = "contact-status error";
                }
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";
            }
            if (statusEl) {
                statusEl.textContent = "";
                statusEl.className = "contact-status";
            }

            try {
                const response = await fetch("/api/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(result?.error || "Failed to send message");
                }

                contactForm.reset();
                if (statusEl) {
                    statusEl.textContent = result?.confirmationEmailSent
                        ? "Message sent successfully. A confirmation email was sent to you."
                        : "Message sent successfully.";
                    statusEl.className = "contact-status success";
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = error?.message || "Unable to send right now. Please try again.";
                    statusEl.className = "contact-status error";
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Send Message";
                }
            }
        });
    }
});