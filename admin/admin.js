document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL CONFIG & SELECTORS ---
    if (typeof firebase === 'undefined') return console.error('Firebase not initialized.');
    const db = firebase.firestore();

    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dujlwpbrv/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'coffee555'; // Must be an UNSIGNED preset

    // --- NAVIGATION ---
    const navItems = document.querySelectorAll('.nav-item');
    const adminPanels = document.querySelectorAll('.admin-panel');

    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            navItems.forEach(nav => nav.classList.remove('is-active'));
            item.classList.add('is-active');

            adminPanels.forEach(panel => {
                panel.classList.remove('is-active');
                if (panel.id === targetId) {
                    panel.classList.add('is-active');
                }
            });

            // Initialize product list when switching to product panel
            if (targetId === 'panel-products') {
                initProductManagement();
            }
        });
    });

    // --- SHARED UTILITIES ---
    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Cloudinary upload failed.');
        const data = await response.json();
        return data.secure_url;
    }

    const toast = document.getElementById('toast-notification');
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.className = isError ? 'error' : '';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    
    // --- BLOG MANAGEMENT MODULE ---
    const blogForm = document.getElementById('blog-form');
    blogForm.addEventListener('submit', async e => {
        e.preventDefault();
        const title = document.getElementById('blog-title').value.trim();
        const content = document.getElementById('blog-content').value.trim();
        const file = document.getElementById('blog-cover-image').files[0];

        if (!title || !content || !file) return showToast('All fields are required.', true);
        
        const button = document.getElementById('blog-publish-button');
        button.disabled = true;
        button.textContent = 'Publishing...';
        
        try {
            const coverImageUrl = await uploadToCloudinary(file);
            await db.collection('blogPosts').add({
                title, content, coverImageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Blog post published successfully!');
            blogForm.reset();
        } catch (error) {
            console.error("Error publishing blog post:", error);
            showToast('Error: ' + error.message, true);
        } finally {
            button.disabled = false;
            button.textContent = 'Publish Post';
        }
    });

    // --- PRODUCT MANAGEMENT MODULE ---
    const productForm = document.getElementById('product-form');
    const productListBody = document.getElementById('product-list-body');
    const productFormTitle = document.getElementById('product-form-title');
    const productIdInput = document.getElementById('product-id');
    const productLoader = document.getElementById('product-list-loader');
    const saveButton = document.getElementById('product-save-button');
    const cancelButton = document.getElementById('product-cancel-button');
    let productsLoaded = false;

    function initProductManagement() {
        if (!productsLoaded) {
            fetchAndDisplayProducts();
            productsLoaded = true;
        }
    }

    async function fetchAndDisplayProducts() {
        productLoader.style.display = 'block';
        productListBody.innerHTML = '';
        try {
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            snapshot.forEach(doc => renderProductRow(doc.id, doc.data()));
        } catch (error) {
            showToast('Could not fetch products.', true);
        } finally {
            productLoader.style.display = 'none';
        }
    }

    function renderProductRow(id, data) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', id);
        row.innerHTML = `
            <td><img src="${data.imageUrl}" alt="${data.name}"></td>
            <td>${data.name}</td>
            <td>$${Number(data.price).toFixed(2)}</td>
            <td class="action-buttons">
                <button class="edit-btn"><i class="fa-solid fa-pencil"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        productListBody.appendChild(row);

        row.querySelector('.edit-btn').addEventListener('click', () => populateFormForEdit(id, data));
        row.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(id, data.name));
    }

    function populateFormForEdit(id, data) {
        productFormTitle.textContent = 'Edit Product';
        productIdInput.value = id;
        document.getElementById('product-name').value = data.name;
        document.getElementById('product-price').value = data.price;
        document.getElementById('product-description').value = data.description;
        cancelButton.style.display = 'inline-block';
        window.scrollTo(0, 0); // Scroll to top to see the form
    }

    async function deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
        try {
            await db.collection('products').doc(id).delete();
            showToast('Product deleted successfully.');
            document.querySelector(`tr[data-id="${id}"]`).remove();
        } catch (error) {
            showToast('Error deleting product.', true);
        }
    }

    cancelButton.addEventListener('click', () => {
        productForm.reset();
        productIdInput.value = '';
        productFormTitle.textContent = 'Add New Product';
        cancelButton.style.display = 'none';
    });

    productForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('product-name').value.trim();
        const price = Number(document.getElementById('product-price').value);
        const description = document.getElementById('product-description').value.trim();
        const file = document.getElementById('product-image').files[0];
        const existingId = productIdInput.value;

        if (!name || !price || !description) return showToast('Name, Price, and Description are required.', true);
        if (!existingId && !file) return showToast('An image is required for new products.', true);

        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        try {
            let imageUrl = null;
            if (file) {
                imageUrl = await uploadToCloudinary(file);
            }

            const productData = { name, price, description };
            if (imageUrl) {
                productData.imageUrl = imageUrl;
            }

            if (existingId) { // --- UPDATE ---
                await db.collection('products').doc(existingId).update(productData);
                showToast('Product updated successfully!');
            } else { // --- CREATE ---
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('products').add(productData);
                showToast('Product added successfully!');
            }
            fetchAndDisplayProducts(); // Refresh list
            cancelButton.click(); // Reset form

        } catch (error) {
            console.error("Error saving product:", error);
            showToast('Error: ' + error.message, true);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
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