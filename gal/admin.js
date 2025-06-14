document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized. Make sure firebase-config.js is loaded and configured correctly.');
        const authErrorDiv = document.getElementById('auth-error');
        if (authErrorDiv) {
            authErrorDiv.textContent = 'Firebase is not connected. Please check configuration.';
            authErrorDiv.style.display = 'block';
        } else {
            alert('Firebase is not connected. Please check the console for errors.');
        }
        return;
    }
    const db = firebase.firestore();
    const auth = firebase.auth(); // Make sure auth is initialized

    // --- DOM ELEMENTS (Auth) ---
    const authContainer = document.getElementById('auth-container');
    const signInButton = document.getElementById('sign-in-button');
    const signOutButtonSidebar = document.getElementById('sign-out-button-sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const userInfoDisplay = document.getElementById('user-info-display');
    const authErrorDiv = document.getElementById('auth-error'); // Already referenced

    // --- CONFIGURATION ---
    const CLOUDINARY_GALLERY_CONFIG = {
        cloudName: 'drw1cqjsf', // <-- ⚠️  REPLACE WITH YOUR CLOUD NAME ⚠️
        uploadPreset: 'gally777', // <-- ⚠️  REPLACE WITH YOUR GALLERY PRESET NAME ⚠️
        tag: 'my-gallery'
    };
    const CLOUDINARY_BLOG_COVER_CONFIG = {
        cloudName: 'drw1cqjsf',
        uploadPreset: 'gally777',
        tag: 'blog-covers'
    };

    // --- DOM ELEMENTS (Dashboard) ---
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const contentSections = document.querySelectorAll('.content-section');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    const galleryUploadButton = document.getElementById('gallery-upload-button');
    const galleryStatusDiv = document.getElementById('status');
    
    const blogTitleInput = document.getElementById('blog-title');
    const blogContentInput = document.getElementById('blog-content');
    const blogCoverUploadButton = document.getElementById('blog-cover-upload-button');
    const blogCoverPreview = document.getElementById('blog-cover-preview');
    const publishBlogButton = document.getElementById('publish-blog-button');
    const blogStatusDiv = document.getElementById('blog-status');

    let blogCoverImageUrl = null;

    // --- FIREBASE AUTHENTICATION ---
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            console.log("Sign-in button clicked (attempting redirect flow)");
            if(authErrorDiv) authErrorDiv.style.display = 'none';
            // Use signInWithRedirect for mobile-friendly auth
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => {
                    auth.signInWithRedirect(googleProvider)
                        .catch((error) => {
                            console.error("Error initiating signInWithRedirect:", error);
                            if (authErrorDiv) {
                                authErrorDiv.textContent = `Error starting sign-in: ${error.message}`;
                                authErrorDiv.style.display = 'block';
                            }
                        });
                })
                .catch(error => {
                    console.error("Error setting persistence:", error);
                });
        });
    }

    // Handle redirect result after returning from Google
    auth.getRedirectResult()
        .then((result) => {
            if (result.user) {
                console.log("Signed in successfully via redirect:", result.user);
                if (authErrorDiv) authErrorDiv.style.display = 'none';
            }
        }).catch((error) => {
            console.error("Google Sign-In Redirect Error:", error);
            if (authErrorDiv) {
                authErrorDiv.textContent = `Sign-in failed after redirect: ${error.message} (Code: ${error.code})`;
                authErrorDiv.style.display = 'block';
            }
        });

    if (signOutButtonSidebar) {
        signOutButtonSidebar.addEventListener('click', () => {
            auth.signOut().catch((error) => {
                console.error("Sign Out Error:", error);
            });
        });
    }

    auth.onAuthStateChanged(user => {
        console.log("onAuthStateChanged triggered. User:", user);
        if (user) {
            if (authContainer) authContainer.style.display = 'none';
            if (dashboardContainer) dashboardContainer.style.display = 'flex';
            if (sidebarToggle) sidebarToggle.style.display = 'block'; // Show sidebar toggle
            
            if (userInfoDisplay) {
                userInfoDisplay.innerHTML = `
                    ${user.photoURL ? `<img src="${user.photoURL}" alt="User Photo">` : ''}
                    <strong>${user.displayName || 'Admin User'}</strong>
                    <small>${user.email}</small>
                `;
            }
            initializeDashboardFunctionality();
        } else {
            if (authContainer) authContainer.style.display = 'flex';
            if (dashboardContainer) dashboardContainer.style.display = 'none';
            if (sidebarToggle) sidebarToggle.style.display = 'none'; // Hide sidebar toggle if not logged in
            if (userInfoDisplay) userInfoDisplay.innerHTML = '';
        }
    });

    function initializeDashboardFunctionality() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    navLinks.forEach(navLink => {
                        if (navLink.getAttribute('href').startsWith('#')) {
                            navLink.classList.remove('active');
                        }
                    });
                    link.classList.add('active');
                    contentSections.forEach(section => {
                        section.classList.toggle('active', section.id === targetId);
                    });
                    // Auto-close sidebar on mobile after clicking a nav link
                    if (window.innerWidth <= 900 && sidebar && !sidebar.classList.contains('closed')) {
                        sidebar.classList.add('closed');
                        if(sidebarToggle) sidebarToggle.innerHTML = '☰'; // Hamburger
                    }
                }
            });
        });
        // Activate the first *internal* tab by default
        const firstInternalLink = Array.from(navLinks).find(link => link.getAttribute('href').startsWith('#'));
        if (firstInternalLink) {
            firstInternalLink.click();
        }


        // --- CLOUDINARY WIDGETS ---
        const galleryUploadWidget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_GALLERY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_GALLERY_CONFIG.uploadPreset,
            tags: [CLOUDINARY_GALLERY_CONFIG.tag],
            sources: ['local', 'url', 'camera', 'instagram', 'facebook'],
            multiple: true, cropping: false,
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                console.log('Gallery image uploaded: ', result.info);
                if(galleryStatusDiv) {
                    galleryStatusDiv.innerHTML = `Successfully uploaded: <strong>${result.info.original_filename}</strong>.`;
                    galleryStatusDiv.className = 'success';
                }
            } else if (error) {
                console.error('Gallery Upload Error:', error);
                if(galleryStatusDiv) {
                    galleryStatusDiv.innerHTML = 'An error occurred during gallery image upload.';
                    galleryStatusDiv.className = 'error';
                }
            }
        });

        const blogCoverUploadWidget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_BLOG_COVER_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_BLOG_COVER_CONFIG.uploadPreset,
            tags: [CLOUDINARY_BLOG_COVER_CONFIG.tag],
            sources: ['local', 'url', 'camera'],
            multiple: false, cropping: true, croppingAspectRatio: 16/9,
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                console.log('Blog cover image uploaded: ', result.info);
                blogCoverImageUrl = result.info.secure_url;
                if(blogCoverPreview) {
                    blogCoverPreview.src = result.info.secure_url;
                    blogCoverPreview.style.display = 'block';
                }
                if(blogStatusDiv) {
                    blogStatusDiv.innerHTML = `Cover image <strong>${result.info.original_filename}</strong> selected.`;
                    blogStatusDiv.className = 'success';
                }
            } else if (error) {
                console.error('Blog Cover Upload Error:', error);
                if(blogStatusDiv) {
                    blogStatusDiv.innerHTML = 'An error occurred during cover image upload.';
                    blogStatusDiv.className = 'error';
                }
            }
        });

        // --- EVENT LISTENERS (Dashboard Specific) ---
        if (galleryUploadButton) {
            galleryUploadButton.addEventListener('click', () => {
                if(galleryStatusDiv) { galleryStatusDiv.innerHTML = ''; galleryStatusDiv.className = ''; }
                galleryUploadWidget.open();
            });
        }

        if (blogCoverUploadButton) {
            blogCoverUploadButton.addEventListener('click', () => {
                if(blogStatusDiv) { blogStatusDiv.innerHTML = ''; blogStatusDiv.className = ''; }
                blogCoverUploadWidget.open();
            });
        }

        if (publishBlogButton) {
            publishBlogButton.addEventListener('click', async () => {
                const user = auth.currentUser;
                if (!user) {
                    if(blogStatusDiv) {
                        blogStatusDiv.innerHTML = 'You must be signed in to publish a post.';
                        blogStatusDiv.className = 'error';
                    }
                    return;
                }

                const title = blogTitleInput.value.trim();
                const content = blogContentInput.value.trim();

                if (!title || !content) {
                    if(blogStatusDiv) {
                        blogStatusDiv.innerHTML = 'Please fill in both title and content.';
                        blogStatusDiv.className = 'error';
                    }
                    return;
                }
                if(blogStatusDiv) { blogStatusDiv.innerHTML = 'Publishing post...'; blogStatusDiv.className = '';}

                try {
                    const blogPost = {
                        title: title, content: content, coverImageUrl: blogCoverImageUrl || null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        authorId: user.uid, authorName: user.displayName || user.email
                    };
                    await db.collection('blogPosts').add(blogPost);
                    if(blogStatusDiv) {
                        blogStatusDiv.innerHTML = 'Blog post published successfully!';
                        blogStatusDiv.className = 'success';
                    }
                    if(blogTitleInput) blogTitleInput.value = '';
                    if(blogContentInput) blogContentInput.value = '';
                    if (blogCoverPreview) { blogCoverPreview.style.display = 'none'; blogCoverPreview.src = ''; }
                    blogCoverImageUrl = null;
                } catch (error) {
                    console.error('Error publishing blog post:', error);
                    if(blogStatusDiv) {
                        blogStatusDiv.innerHTML = `Error publishing post: ${error.message}`;
                        blogStatusDiv.className = 'error';
                    }
                }
            });
        }

        // --- SIDEBAR TOGGLE ---
        if (sidebarToggle && sidebar) {
            // Ensure sidebar starts closed as per HTML
            if (sidebar.classList.contains('closed')) {
                sidebarToggle.innerHTML = '☰'; // Hamburger
            } else {
                sidebarToggle.innerHTML = '×'; // Close
            }

            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('closed');
                sidebarToggle.innerHTML = sidebar.classList.contains('closed') ? '☰' : '×';
            });
        }
    } // End of initializeDashboardFunctionality
});