document.addEventListener('DOMContentLoaded', function() {

    // --- 1. STICKY NAVIGATION BAR ON SCROLL ---
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });


    // --- 2. LIGHTBOX FUNCTIONALITY ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImg && lightboxTriggers.length > 0 && lightboxClose) {
        
        lightboxTriggers.forEach(trigger => {
            trigger.addEventListener('click', e => {
                e.preventDefault(); // Prevent opening the image link
                const imgSrc = trigger.getAttribute('href');
                lightboxImg.setAttribute('src', imgSrc);
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent scrolling background
            });
        });

        // Function to close the lightbox
        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        // Close by clicking the 'x' button
        lightboxClose.addEventListener('click', closeLightbox);
        
        // Close by clicking the background overlay
        lightbox.addEventListener('click', e => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
        
        // Close by pressing the 'Escape' key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                closeLightbox();
            }
        });
    }


    // --- 3. ON-SCROLL FADE-IN ANIMATIONS ---
    const fadeElements = document.querySelectorAll('.fade-in-section');

    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // triggers when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        observer.observe(el);
    });

});

document.addEventListener('DOMContentLoaded', function() {
    
    // ... your existing code for sticky nav, lightbox, etc. ...

    // --- NEW: MOBILE NAVIGATION LOGIC ---
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');
    const body = document.body;

    if (hamburgerButton && mobileNavMenu) {
        hamburgerButton.addEventListener('click', () => {
            mobileNavMenu.classList.toggle('is-open');

            // Optional: Prevent body scrolling when menu is open
            if (mobileNavMenu.classList.contains('is-open')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = 'auto';
            }
        });
    }

    // Optional: Close menu when a link inside it is clicked
    if(mobileNavMenu){
        mobileNavMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                mobileNavMenu.classList.remove('is-open');
                body.style.overflow = 'auto';
            }
        });
    }

});

// Function to fetch and display the latest blog
async function fetchLatestBlog() {
    try {
        const blogsRef = collection(db, 'blogs');
        const q = query(blogsRef, orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const latestBlog = querySnapshot.docs[0].data();
            const blogId = querySnapshot.docs[0].id;
            
            // Update the latest blog section in the home page
            const latestBlogSection = document.getElementById('latestBlogSection');
            if (latestBlogSection) {
                latestBlogSection.innerHTML = `
                    <div class="latest-blog-card">
                        <div class="latest-blog-image">
                            <img src="${latestBlog.imageUrl}" alt="${latestBlog.title}">
                        </div>
                        <div class="latest-blog-content">
                            <h3>${latestBlog.title}</h3>
                            <p>${latestBlog.content.substring(0, 200)}...</p>
                            <div class="latest-blog-meta">
                                <span>${new Date(latestBlog.timestamp).toLocaleDateString()}</span>
                                <a href="/blog/${blogId}" class="read-more">Read More</a>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error fetching latest blog:', error);
    }
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    fetchLatestBlog();
});