document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SETUP & ELEMENT SELECTORS ---
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error('Firebase has not been initialized. Please check your config and SDK scripts.');
        return;
    }

    const productGrid = document.getElementById('product-grid');
    const loader = document.getElementById('shop-loader');

    // --- 2. MAIN DATA FETCHING FUNCTION ---
    async function fetchAndDisplayProducts() {
        if (!productGrid || !loader) return;
        
        loader.style.display = 'block';
        productGrid.innerHTML = '';

        try {
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

            if (snapshot.empty) {
                productGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">No products available at the moment. Please check back soon!</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                createProductCard(productId, product);
            });

        } catch (error) {
            console.error("Error fetching products: ", error);
            productGrid.innerHTML = '<p style="color: red; text-align:center; grid-column: 1 / -1;">Sorry, we couldn\'t load our products. Please try refreshing the page.</p>';
        } finally {
            loader.style.display = 'none';
        }
    }

    // --- 3. DYNAMIC HTML RENDERING FUNCTION ---
    function createProductCard(id, productData) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('data-id', id);

        // Fallback for missing image
        const imageUrl = productData.imageUrl || 'https://images.unsplash.com/photo-1512568400610-62da2848a608?w=400';

        card.innerHTML = `
            <div class="product-image">
                <img src="${imageUrl}" alt="${productData.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${productData.name}</h3>
                <p class="product-description">${productData.description}</p>
                <div class="product-meta">
                    <span class="product-price">$${Number(productData.price).toFixed(2)}</span>
                    <button class="product-cta">Add to Cart</button>
                </div>
            </div>
        `;

        productGrid.appendChild(card);

        // Add event listener for the "Add to Cart" button
        card.querySelector('.product-cta').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent any other parent clicks
            handleAddToCart(id, productData.name);
        });
    }

    // --- 4. 'ADD TO CART' FUNCTIONALITY (Placeholder) ---
    function handleAddToCart(id, name) {
        // This is where you would implement your shopping cart logic.
        // For now, it will just log to the console.
        console.log(`Added product '${name}' (ID: ${id}) to the cart.`);
        alert(`"${name}" has been added to your cart! (Functionality in development)`);
    }

    // --- 5. INITIALIZATION ---
    fetchAndDisplayProducts();
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