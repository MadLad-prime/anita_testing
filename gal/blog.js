document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error('Firebase not initialized. Make sure firebase-config.js is loaded and configured correctly.');
        const loader = document.getElementById('blog-loader');
        const postsListContainer = document.getElementById('blog-posts-list');
        if (loader) loader.style.display = 'none';
        if (postsListContainer) postsListContainer.innerHTML = '<p style="color: red; text-align: center;">Error: Firebase is not connected. Blog posts cannot be loaded.</p>';
        return;
    }

    const postsListContainer = document.getElementById('blog-posts-list');
    const loader = document.getElementById('blog-loader');
    
    const fullPostView = document.getElementById('full-post-view');
    const fullPostTitle = document.getElementById('full-post-title');
    const fullPostMeta = document.getElementById('full-post-meta');
    const fullPostCoverImage = document.getElementById('full-post-cover-image');
    const fullPostContentArea = document.getElementById('full-post-content-area');
    const backToListBtn = document.getElementById('back-to-list-btn');

    let allBlogPosts = []; // To cache fetched posts

    async function fetchBlogPosts() {
        if (loader) loader.style.display = 'block';
        if (postsListContainer) postsListContainer.innerHTML = ''; // Clear previous
        if (fullPostView) fullPostView.classList.add('hidden');


        try {
            const snapshot = await db.collection('blogPosts')
                                     .orderBy('createdAt', 'desc')
                                     .get();
            
            allBlogPosts = []; // Reset cache
            if (snapshot.empty) {
                if (postsListContainer) postsListContainer.innerHTML = '<p style="text-align: center;">No blog posts found yet. Check back soon!</p>';
                if (loader) loader.style.display = 'none';
                return;
            }

            snapshot.forEach(doc => {
                allBlogPosts.push({ id: doc.id, ...doc.data() });
            });

            renderBlogPostsList(allBlogPosts);

        } catch (error) {
            console.error("Error fetching blog posts: ", error);
            if (postsListContainer) postsListContainer.innerHTML = `<p style="color: red; text-align: center;">Could not load blog posts. Error: ${error.message}</p>`;
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    function renderBlogPostsList(posts) {
        if (!postsListContainer) return;
        postsListContainer.innerHTML = ''; // Clear existing

        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'blog-post-summary';
            postElement.setAttribute('data-id', post.id);

            const coverImageHtml = post.coverImageUrl 
                ? `<div class="cover-image-container"><img src="${post.coverImageUrl}" alt="${post.title}"></div>`
                : '<div class="cover-image-container" style="background-color: #f0f0f0;"></div>'; // Placeholder if no image

            const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A';
            
            // Create a short excerpt (plain text, first ~150 chars)
            const plainTextContent = stripHtml(post.content);
            const excerpt = plainTextContent.substring(0, 150) + (plainTextContent.length > 150 ? '...' : '');

            postElement.innerHTML = `
                ${coverImageHtml}
                <div class="post-content-preview">
                    <h2>${post.title}</h2>
                    <p class="post-meta">Published on ${date}</p>
                    <p class="post-excerpt">${excerpt}</p>
                    <span class="read-more-btn">Read More →</span>
                </div>
            `;
            postsListContainer.appendChild(postElement);

            postElement.addEventListener('click', () => showFullPost(post.id));
        });
        postsListContainer.classList.remove('hidden');
        if (fullPostView) fullPostView.classList.add('hidden');
    }

    function stripHtml(html) {
       let tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }
    
    function showFullPost(postId) {
        const post = allBlogPosts.find(p => p.id === postId);
        if (!post || !fullPostView) return;

        if (fullPostTitle) fullPostTitle.textContent = post.title;
        
        const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A';
        if (fullPostMeta) fullPostMeta.textContent = `Published on ${date}`;

        if (fullPostCoverImage) {
            if (post.coverImageUrl) {
                fullPostCoverImage.src = post.coverImageUrl;
                fullPostCoverImage.alt = post.title;
                fullPostCoverImage.style.display = 'block';
            } else {
                fullPostCoverImage.style.display = 'none';
            }
        }
        
        if (fullPostContentArea) fullPostContentArea.innerHTML = post.content.replace(/\n/g, '<br>');

        if (postsListContainer) postsListContainer.classList.add('hidden');
        fullPostView.classList.remove('hidden');

        // Immediately scroll the full post view to the top
        fullPostView.scrollIntoView({ behavior: "auto", block: "start" });
        // Alternatively, you could use:
        // window.scrollTo(0, 0);
    }

    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            if (fullPostView) fullPostView.classList.add('hidden');
            if (postsListContainer) postsListContainer.classList.remove('hidden');
            window.scrollTo(0, 0);
        });
    }

    // Initial Load
    fetchBlogPosts();
});