document.addEventListener('DOMContentLoaded', () => {
    // Optional: Add active class to current page link
    const navLinks = document.querySelectorAll('.nav-links');
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        }
    });
});