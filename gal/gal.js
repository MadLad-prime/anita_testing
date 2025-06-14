document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CLOUDINARY_CONFIG = {
        cloudName: 'drw1cqjsf', // <-- ⚠️  REPLACE WITH YOUR CLOUD NAME ⚠️
        tag: 'my-gallery' // The tag you set for gallery images
    };

    // --- DOM ELEMENTS ---
    const galleryContainer = document.getElementById('image-gallery');
    const loader = document.getElementById('loader');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // --- STATE ---
    let allImages = [];
    let currentIndex = 0;

    // --- FUNCTIONS ---

    async function fetchImages() {
        loader.style.display = 'block';
        galleryContainer.style.visibility = 'hidden';
        try {
            // Using Cloudinary Admin API requires authentication for listing by tag.
            // A simpler, unauthenticated way if you only use one tag and list all is:
            // `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/list/${CLOUDINARY_CONFIG.tag}.json`
            // However, this endpoint is often disabled for security reasons on newer accounts.
            // The Search API is more robust but needs a server-side component for authentication or signed URLs.

            // For now, we'll stick to the .json list method. If it doesn't work,
            // you might need to enable it in your Cloudinary settings or use the Search API with a backend.
            const response = await fetch(`https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/list/${CLOUDINARY_CONFIG.tag}.json?max_results=100`);
            
            if (!response.ok) {
                if (response.status === 404) { // Common if the tag list JSON isn't enabled/found
                     throw new Error(`Could not fetch image list for tag '${CLOUDINARY_CONFIG.tag}'. This endpoint might be disabled on your Cloudinary account. Check your Cloudinary settings or consider using the Search API.`);
                }
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.resources) {
                allImages = data.resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first
                renderGallery(allImages);
            } else {
                throw new Error("No 'resources' array found in Cloudinary response.");
            }

        } catch (error) {
            console.error('Error fetching images:', error);
            loader.style.display = 'none';
            galleryContainer.style.visibility = 'visible';
            galleryContainer.innerHTML = `<p style="text-align:center; width:100%; padding: 20px; background: #ffebee; color: #c62828; border-radius: 5px;">Sorry, could not load images. ${error.message}</p>`;
        }
    }

    function renderGallery(images) {
        galleryContainer.innerHTML = ''; // Clear previous content
        if (images.length === 0) {
            loader.style.display = 'none';
            galleryContainer.style.visibility = 'visible';
            galleryContainer.innerHTML = '<p style="text-align:center; width:100%;">No images found with this tag. Try uploading some through the admin panel!</p>';
            return;
        }

        images.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const img = document.createElement('img');
            // Optimized thumbnail for square grid items
            // c_fill: crops to fill dimensions. g_auto: gravity auto. ar_1:1 aspect ratio 1:1 (square)
            // w_400: width 400px. q_auto: auto quality. f_auto: auto format.
            const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/c_fill,g_auto,ar_1:1,w_400,q_auto,f_auto/${image.public_id}.${image.format}`;
            img.src = thumbnailUrl;
            img.alt = image.public_id; // Or a more descriptive alt text if available

            img.onload = () => {
                img.classList.add('loaded'); // Add class for fade-in effect
            };
            img.onerror = () => {
                galleryItem.style.backgroundColor = '#ddd'; // Fallback for broken image
                img.alt = "Image failed to load";
            }

            galleryItem.appendChild(img);
            galleryContainer.appendChild(galleryItem);

            galleryItem.addEventListener('click', () => openLightbox(index));
        });

        loader.style.display = 'none';
        galleryContainer.style.visibility = 'visible';
    }

    function openLightbox(index) {
        if (index < 0 || index >= allImages.length) return;
        currentIndex = index;
        const image = allImages[currentIndex];
        // Load high-quality image in the lightbox (adjust transformations as needed)
        const fullImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_1200,h_1200,c_limit,q_auto,f_auto/${image.public_id}.${image.format}`;
        lightboxImg.src = fullImageUrl;
        lightbox.style.display = 'flex'; // Changed to flex for easier centering of content in some cases
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function showNextImage() {
        currentIndex = (currentIndex + 1) % allImages.length;
        // Preload next image slightly for smoother transition (basic)
        const nextImage = allImages[(currentIndex + 1) % allImages.length];
        if(nextImage) {
            const preloader = new Image();
            preloader.src = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_1200,h_1200,c_limit,q_auto,f_auto/${nextImage.public_id}.${nextImage.format}`;
        }
        openLightbox(currentIndex);
    }

    function showPrevImage() {
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
         // Preload prev image slightly for smoother transition (basic)
        const prevImage = allImages[(currentIndex - 1 + allImages.length) % allImages.length];
        if(prevImage) {
            const preloader = new Image();
            preloader.src = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_1200,h_1200,c_limit,q_auto,f_auto/${prevImage.public_id}.${prevImage.format}`;
        }
        openLightbox(currentIndex);
    }

    // --- EVENT LISTENERS ---
    if(closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if(nextBtn) nextBtn.addEventListener('click', showNextImage);
    if(prevBtn) prevBtn.addEventListener('click', showPrevImage);

    if(lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) { // Click on background
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        }
    });

    // --- INITIALIZE ---
    fetchImages();
});