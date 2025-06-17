document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SETUP & ELEMENT SELECTORS ---
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error('Firebase has not been initialized. Please check your firebase-config.js file.');
        const loader = document.getElementById('blog-loader');
        if (loader) loader.style.display = 'none';
        const listContainer = document.getElementById('blog-posts-list');
        if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:red;">Error: Cannot connect to the database.</p>';
        return;
    }

    const postsListContainer = document.getElementById('blog-posts-list');
    const loader = document.getElementById('blog-loader');
    const lightbox = document.getElementById('blog-lightbox');
    const lightboxContentScrollable = lightbox.querySelector('.lightbox-content-scrollable');
    const body = document.body;

    let allBlogPosts = []; // Cache to hold posts after fetching

    // --- 2. DATA FETCHING (FROM FIREBASE) ---
    async function fetchBlogPosts() {
        if (loader) loader.style.display = 'block';
        if (postsListContainer) postsListContainer.innerHTML = '';

        try {
            // Assumes a 'blogPosts' collection in Firestore, ordered by date
            const snapshot = await db.collection('blogPosts')
                                     .orderBy('createdAt', 'desc')
                                     .get();
            
            allBlogPosts = [];
            if (snapshot.empty) {
                if (postsListContainer) postsListContainer.innerHTML = '<p style="text-align: center;">No blog posts found yet. Check back soon!</p>';
                return;
            }

            snapshot.forEach(doc => {
                allBlogPosts.push({ id: doc.id, ...doc.data() });
            });

            renderBlogPostsList(allBlogPosts);

        } catch (error) {
            console.error("Error fetching blog posts: ", error);
            if (postsListContainer) postsListContainer.innerHTML = `<p style="color: red; text-align: center;">Could not load blog posts due to a connection error.</p>`;
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    // --- 3. DYNAMIC HTML RENDERING ---
    function renderBlogPostsList(posts) {
        if (!postsListContainer) return;
        postsListContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('article');
            // Using Woke Coffee's class names from blog.css
            postElement.className = 'blog-card';
            postElement.setAttribute('data-blog-id', post.id); // ID for click lookup

            const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A';
            const plainTextContent = stripHtml(post.content || '');
            const excerpt = plainTextContent.substring(0, 120) + (plainTextContent.length > 120 ? '...' : '');

            // HTML structure matching the Woke Coffee aesthetic
            postElement.innerHTML = `
                <div class="card-image-container">
                    <img src="${post.coverImageUrl || 'https://images.unsplash.com/photo-1559493188-0f1350a5814e?w=800'}" alt="${post.title}">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${post.title || 'Untitled Post'}</h3>
                    <p class="card-excerpt">${excerpt}</p>
                    <span class="card-read-more">Read More →</span>
                </div>
            `;
            postsListContainer.appendChild(postElement);

            // Add listener to the whole card for opening the lightbox
            postElement.addEventListener('click', () => showFullPostInLightbox(post.id));
        });
    }

    // Utility to get plain text from HTML content for excerpts
    function stripHtml(html) {
       let tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }
    
    // --- 4. LIGHTBOX FUNCTIONALITY ---
    function showFullPostInLightbox(postId) {
        const post = allBlogPosts.find(p => p.id === postId);
        if (!post || !lightbox) return;

        const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Unavailable';
        
        // Build the HTML to inject into the lightbox
        const fullPostHtml = `
            ${post.coverImageUrl ? `<img src="${post.coverImageUrl}" alt="${post.title}" class="full-post-image">` : ''}
            <h1 class="full-post-title">${post.title}</h1>
            <p class="full-post-meta">Published on ${date}</p>
            <div class="full-post-content">${post.content.replace(/\n/g, '<p></p>')}</div>
        `;

        // Inject content and show lightbox
        lightboxContentScrollable.innerHTML = fullPostHtml;
        lightbox.classList.add('is-active');
        lightbox.setAttribute('aria-hidden', 'false');
        body.classList.add('no-scroll'); // Prevent background from scrolling
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        body.classList.remove('no-scroll');
        // Clear content after the animation is done
        setTimeout(() => {
            lightboxContentScrollable.innerHTML = ''; 
        }, 400);
    }

    // Event listeners for closing the lightbox
    lightbox.addEventListener('click', event => {
        // Closes if the overlay or the 'X' button is clicked
        if (event.target.matches('[data-close-lightbox]')) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', event => {
        // Closes if 'Escape' key is pressed
        if (event.key === 'Escape' && lightbox.classList.contains('is-active')) {
            closeLightbox();
        }
    });

    // --- 5. FOOTER SCRIPT ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // --- 6. INITIALIZATION ---
    fetchBlogPosts();
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