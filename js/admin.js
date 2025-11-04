// GranoCraft/js/admin.js

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message); 
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement === container) {
            container.removeChild(toast);
        }
    }, 3500);
}


document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. VARIABLES DE ESTADO Y REFERENCIAS DEL DOM
    // =========================================================================
    const token = localStorage.getItem('authToken');
    
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const sidebarLinks = document.querySelectorAll('#admin-sidebar-nav .sidebar-link');
    const adminSections = document.querySelectorAll('.admin-section');
    const logoutButton = document.getElementById('logoutButton');

    // Productos
    const productsTbody = document.getElementById('products-tbody');
    const addProductFormContainer = document.getElementById('addProductFormContainer');
    const addProductForm = document.getElementById('addProductForm');
    const showAddProductFormBtn = document.getElementById('showAddProductFormBtn');
    const cancelAddProductBtn = document.getElementById('cancelAddProductBtn');
    const editProductModal = document.getElementById('editProductModal');
    const editProductForm = document.getElementById('editProductForm');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Perfil
    const profileForm = document.getElementById('profileForm');
    let userProfileData = {}; 
    const profileImageForm = document.getElementById('profileImageForm');
    const profileImageFileInput = document.getElementById('profileImageFile');
    const currentProfileImage = document.getElementById('currentProfileImage');
    const deleteProfileImageBtn = document.getElementById('deleteProfileImageBtn');
    const galleryUploadForm = document.getElementById('galleryUploadForm');
    const galleryImageFilesInput = document.getElementById('galleryImageFiles');
    const currentGalleryContainer = document.getElementById('currentGallery');

    // Ubicación (Productor)
    const locationForm = document.getElementById('locationForm'); 
    const locationMapElement = document.getElementById('locationMap'); 
    const locationLatitudeInput = document.getElementById('locationLatitude');
    const locationLongitudeInput = document.getElementById('locationLongitude');
    const locationImagePreview = document.getElementById('locationImagePreview'); 
    let locationMap = null;
    let locationMarker = null;

    // Ubicación (Admin)
    const adminLocationForm = document.getElementById('adminLocationForm');
    const adminLocationMapElement = document.getElementById('adminLocationMap');
    const adminLocationLatitudeInput = document.getElementById('adminLocationLatitude');
    const adminLocationLongitudeInput = document.getElementById('adminLocationLongitude');
    const adminLocationImagePreview = document.getElementById('adminLocationImagePreview');
    const locationsAdminTbody = document.getElementById('locations-admin-tbody');
    let adminLocationMap = null;
    let adminLocationMarker = null;

    // Blog
    const postsTbody = document.getElementById('posts-tbody'); 
    const addPostForm = document.getElementById('addPostForm');
    const blogImagePreview = document.getElementById('blogImagePreview'); 
    const addPostImageFile = document.getElementById('addPostImageFile');
    const editPostModal = document.getElementById('editPostModal');
    const closePostModalBtn = document.getElementById('closePostModalBtn');
    const cancelPostEditBtn = document.getElementById('cancelPostEditBtn');
    const editPostForm = document.getElementById('editPostForm');
    const editPostImageFile = document.getElementById('editPostImageFile');
    const editPostImagePreview = document.getElementById('editPostImagePreview');
    
    // Admin (Usuarios)
    const usersTbody = document.getElementById('users-tbody');

    // -------------------------------------------------------------------------
    // 1.1 Verificación de Autenticación y Rol
    // -------------------------------------------------------------------------
    if (!token || token.length < 50) {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
        return;
    }

    let userRole = 'producer';
    let userId = null;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        userRole = decodedPayload.role || 'producer';
        userId = decodedPayload.id || null;
        if (userRoleDisplay) userRoleDisplay.textContent = userRole.toUpperCase();
    } catch (e) {
        if (userRoleDisplay) userRoleDisplay.textContent = 'ERROR';
        console.error("Error decodificando token:", e);
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
        return;
    }

    // Ocultar/Mostrar enlaces
    const productsLink = document.getElementById('productsLink');
    const locationLink = document.getElementById('locationLink');
    const manageLocationsAdminLink = document.getElementById('manageLocationsAdminLink'); // NUEVO
    const manageBlogLink = document.getElementById('manageBlogLink');
    const manageUsersLink = document.getElementById('manageUsersLink');
    const productsSectionTitle = document.getElementById('productsSectionTitle');

    if (userRole === 'producer') {
        if (productsLink) productsLink.style.display = 'block';
        if (locationLink) locationLink.style.display = 'block';
        if (showAddProductFormBtn) showAddProductFormBtn.style.display = 'block';
    } else if (userRole === 'admin') {
        if (productsLink) productsLink.style.display = 'block';
        if (manageLocationsAdminLink) manageLocationsAdminLink.style.display = 'block'; // NUEVO
        if (manageBlogLink) manageBlogLink.style.display = 'block';
        if (manageUsersLink) manageUsersLink.style.display = 'block';
        if (productsSectionTitle) productsSectionTitle.textContent = 'Todos los Productos (Admin)';
    }

    // =========================================================================
    // 2. FUNCIONES DE UTILIDAD (Previews, Navegación)
    // =========================================================================

    function setupImagePreview(fileInputId, previewImgId) {
        const input = document.getElementById(fileInputId);
        const preview = document.getElementById(previewImgId);
        if (input && preview) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    
    setupImagePreview('imageFile', 'imagePreview');
    setupImagePreview('editImageFile', 'editImagePreview');
    setupImagePreview('locationImageFile', 'locationImagePreview');
    setupImagePreview('addPostImageFile', 'blogImagePreview');
    setupImagePreview('editPostImageFile', 'editPostImagePreview');
    setupImagePreview('profileImageFile', 'currentProfileImage');
    setupImagePreview('adminLocationImageFile', 'adminLocationImagePreview');

    function switchSection(sectionId) {
        adminSections.forEach(section => section.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) sectionToShow.classList.add('active');

        const linkToActivate = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (linkToActivate) linkToActivate.classList.add('active');

        if (addProductFormContainer && addProductFormContainer.style.display !== 'none') {
            addProductFormContainer.style.display = 'none';
            if(showAddProductFormBtn) showAddProductFormBtn.textContent = 'Añadir Producto +';
        }

        if (sectionId === 'profileSection') loadProfile();
        if (sectionId === 'productsSection') loadProducts();
        if (sectionId === 'manageBlogSection') loadPosts();
        if (sectionId === 'locationSection') initializeLocationMap();
        if (sectionId === 'manageLocationsAdminSection') {
            initializeAdminLocationMap();
            loadAllLocations();
        }
        if (sectionId === 'manageUsersSection') loadUsers(); 
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.getAttribute('data-section'));
        });
    });
    
    if (logoutButton) { 
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken'); 
            showToast('Sesión cerrada.', 'success');             
            setTimeout(() => { window.location.href = 'login.html'; }, 500); 
        });
    }
    
    // =========================================================================
    // MÓDULO DE PERFIL (Texto, Logo y Galería)
    // =========================================================================
    
    async function loadProfile() {
        try {
            const response = await fetch('/api/profile', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error('Error al cargar perfil.');
            
            userProfileData = await response.json(); 
            
            // 1. Rellenar formulario de texto
            if(document.getElementById('emailDisplay')) document.getElementById('emailDisplay').value = userProfileData.email || '';
            if(document.getElementById('producerNamePublic')) document.getElementById('producerNamePublic').value = userProfileData.producerNamePublic || '';
            if(document.getElementById('bio')) document.getElementById('bio').value = userProfileData.bio || '';
            const contact = userProfileData.contact || {};
            if(document.getElementById('whatsapp')) document.getElementById('whatsapp').value = contact.whatsapp || '';
            if(document.getElementById('instagram')) document.getElementById('instagram').value = contact.instagram || '';
            if(document.getElementById('facebook')) document.getElementById('facebook').value = contact.facebook || '';
            if(document.getElementById('showEmail')) document.getElementById('showEmail').checked = !!contact.showEmail; 

            // 2. Cargar Logo/Foto de Perfil
            loadProfileImage(userProfileData.profileImage);
            
            // 3. Cargar Galería
            loadGallery(userProfileData.galleryImages);

        } catch (error) {
            showToast('Error al cargar la información del perfil.', 'error');
        }
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const updates = {};
            
            for (let [key, value] of formData.entries()) {
                if (key.startsWith('contact.')) {
                    if (!updates.contact) updates.contact = {};
                    updates.contact[key.substring(8)] = key === 'contact.showEmail' ? (value === 'on') : value;
                } else {
                    updates[key] = value;
                }
            }
            if (updates.contact && !formData.has('contact.showEmail')) {
                updates.contact.showEmail = false;
            }

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updates)
                });
                if (response.ok) {
                    showToast('Perfil actualizado con éxito.', 'success');
                } else {
                    const err = await response.text();
                    showToast(`Error al guardar perfil: ${err}`, 'error');
                }
            } catch (error) {
                showToast('Error de red al actualizar perfil.', 'error');
            }
        });
    }

    function loadProfileImage(imageUrl) {
        if (imageUrl) {
            currentProfileImage.src = `/${imageUrl}`;
            currentProfileImage.style.display = 'block';
            deleteProfileImageBtn.style.display = 'inline-block';
        } else {
            currentProfileImage.style.display = 'none';
            deleteProfileImageBtn.style.display = 'none';
            currentProfileImage.src = '#'; 
        }
    }

    if (profileImageForm) {
        profileImageForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData();
            if (profileImageFileInput.files[0]) {
                formData.append('profileImage', profileImageFileInput.files[0]);
            } else {
                showToast('Por favor, selecciona una imagen para subir.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/profile/image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                userProfileData.profileImage = data.profileImage;
                loadProfileImage(data.profileImage);
                profileImageFileInput.value = ''; 
                showToast('Logo o foto de perfil guardada.', 'success');
            } catch (error) {
                showToast('Error al subir la imagen de perfil.', 'error');
            }
        });
    }

    if (deleteProfileImageBtn) {
        deleteProfileImageBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres eliminar tu logo?')) return;
            try {
                const response = await fetch('/api/profile/image', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                userProfileData.profileImage = null;
                loadProfileImage(null);
                showToast('Logo o foto de perfil eliminada.', 'success');
            } catch (error) {
                showToast('Error al eliminar el logo.', 'error');
            }
        });
    }

    function loadGallery(images) {
        currentGalleryContainer.innerHTML = ''; 
        if (images && images.length > 0) {
            images.forEach(imageUrl => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'relative group gallery-item';
                galleryItem.innerHTML = `
                    <img src="/${imageUrl}" alt="Imagen de galería" 
                         class="w-full h-32 object-cover rounded-lg shadow-sm">
                    <button type="button" data-image-url="${imageUrl}" 
                            class="delete-gallery-image-btn"
                            style="font-size: 10px; width: 24px; height: 24px;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                `;
                currentGalleryContainer.appendChild(galleryItem);
            });
            currentGalleryContainer.querySelectorAll('.delete-gallery-image-btn').forEach(button => {
                button.addEventListener('click', deleteGalleryImage);
            });
        } else {
            currentGalleryContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay imágenes en la galería.</p>';
        }
    }

    if (galleryUploadForm) {
        galleryUploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (galleryImageFilesInput.files.length === 0) {
                showToast('Por favor, selecciona una o más imágenes.', 'error');
                return;
            }
            
            const formData = new FormData();
            for (const file of galleryImageFilesInput.files) {
                formData.append('galleryImages', file);
            }

            try {
                const response = await fetch('/api/profile/gallery', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                userProfileData.galleryImages = data; 
                loadGallery(data); 
                galleryImageFilesInput.value = '';
                showToast('Imágenes añadidas a la galería.', 'success');
            } catch (error) {
                showToast('Error al subir imágenes a la galería.', 'error');
            }
        });
    }

    async function deleteGalleryImage(event) {
        const imageUrl = event.currentTarget.dataset.imageUrl;
        if (!confirm('¿Eliminar esta imagen de la galería?')) return;

        try {
            const response = await fetch('/api/profile/gallery', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ imageUrl })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            userProfileData.galleryImages = userProfileData.galleryImages.filter(img => img !== imageUrl);
            loadGallery(userProfileData.galleryImages);
            showToast('Imagen de la galería eliminada.', 'success');
        } catch (error) {
            showToast('Error al eliminar imagen.', 'error');
        }
    }

    // =========================================================================
    // MÓDULO DE PRODUCTOS
    // =========================================================================
    
    async function loadProducts() {
        if (!productsTbody) return;
        productsTbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center">Cargando productos...</td></tr>';
        
        const endpoint = '/api/products/my';
        
        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const products = await response.json();
            
            if (products.length === 0) {
                productsTbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center">No hay productos registrados.</td></tr>';
            } else {
                productsTbody.innerHTML = products.map(p => `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium">${p.name}</td>
                        <td class="px-6 py-4">Q ${p.price.toFixed(2)}</td>
                        <td class="px-6 py-4">${p.origin || 'N/A'}</td>
                        <td class="px-6 py-4">${p.producerName || (p.owner ? (p.owner.email || 'Admin') : 'N/A')}</td>
                        <td class="px-6 py-4">${p.stock}</td>
                        <td class="px-6 py-4 table-actions">
                            <button class="edit-btn" data-id="${p._id}">Editar</button>
                            <button class="delete-btn" data-id="${p._id}">Eliminar</button>
                        </td>
                    </tr>
                `).join('');
                
                productsTbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteProduct(e.target.getAttribute('data-id'))));
                productsTbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openEditProductModal(e.target.getAttribute('data-id'))));
            }
        } catch (err) {
            productsTbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-600">Error al cargar productos.</td></tr>';
            showToast('Error cargando productos. ¿Token válido?', 'error');
        }
    }
    
    async function deleteProduct(productId) {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) { showToast('Producto eliminado.', 'success'); loadProducts(); } 
            else { const err = await response.text(); showToast(`Error al eliminar: ${err}`, 'error'); }
        } catch (err) { showToast('Error de red.', 'error'); }
    }

    if (showAddProductFormBtn && addProductFormContainer) {
        showAddProductFormBtn.addEventListener('click', () => {
            const isVisible = addProductFormContainer.style.display === 'block';
            addProductFormContainer.style.display = isVisible ? 'none' : 'block';
            showAddProductFormBtn.textContent = isVisible ? 'Añadir Producto +' : 'Ocultar Formulario';
        });
    }
    if (cancelAddProductBtn) cancelAddProductBtn.addEventListener('click', () => {
        addProductFormContainer.style.display = 'none';
        showAddProductFormBtn.textContent = 'Añadir Producto +';
    });

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addProductForm);
            if (!formData.get('imageFile').name) { showToast('La imagen es obligatoria.', 'error'); return; }

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData 
                });
                if (response.ok) {
                    showToast('Producto guardado.', 'success');
                    addProductForm.reset();
                    addProductFormContainer.style.display = 'none';
                    showAddProductFormBtn.textContent = 'Añadir Producto +';
                    loadProducts();
                } else {
                    const err = await response.text(); showToast(`Error al guardar: ${err}`, 'error');
                }
            } catch (err) { showToast('Error de red al guardar producto.', 'error'); }
        });
    }

    async function openEditProductModal(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('No se pudo cargar el producto.');
            const product = await response.json();

            document.getElementById('editProductId').value = product._id;
            document.getElementById('editName').value = product.name;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editOrigin').value = product.origin;
            document.getElementById('editProducerName').value = product.producerName;
            document.getElementById('editRoastLevel').value = product.roastLevel;
            document.getElementById('editStock').value = product.stock;
            document.getElementById('editDescription').value = product.description;

            const editImagePreview = document.getElementById('editImagePreview');
            const imageUrl = product.imageUrl ? `/${product.imageUrl}` : '#'; 

            if (product.imageUrl) {
                editImagePreview.src = imageUrl; 
                editImagePreview.style.display = 'block';
            } else {
                editImagePreview.style.display = 'none';
                editImagePreview.src = '#';
            }
            document.getElementById('editImageFile').value = ''; 
            editProductModal.classList.add('active');
        } catch (err) { showToast('Error al cargar datos de edición.', 'error'); }
    }

    function closeEditProductModal() { if (editProductModal) editProductModal.classList.remove('active'); }
    if (closeModalBtn) closeModalBtn.onclick = closeEditProductModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditProductModal;

    if (editProductForm) {
        editProductForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             const productId = document.getElementById('editProductId').value;
             const formData = new FormData(editProductForm);
             
             try {
                 const response = await fetch(`/api/products/${productId}`, {
                     method: 'PUT',
                     headers: { 'Authorization': `Bearer ${token}` },
                     body: formData 
                 });
                 if (response.ok) { 
                     showToast('Producto actualizado.', 'success');
                     closeEditProductModal();
                     loadProducts();
                 } else { 
                     const err = await response.text(); showToast(`Error al actualizar: ${err}`, 'error'); 
                 }
             } catch (error) { showToast('Error de red al actualizar producto.', 'error'); }
        });
    }

    // =========================================================================
    // MÓDULO DE UBICACIÓN (PRODUCTOR)
    // =========================================================================
    
    function initializeLocationMap() {
        if (locationMapElement && !locationMap) {
            locationMap = L.map('locationMap').setView([15.7835, -90.2308], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(locationMap);
            loadExistingLocation();
            locationMap.on('click', function(e) {
                const lat = e.latlng.lat; const lng = e.latlng.lng;
                if(locationLatitudeInput) locationLatitudeInput.value = lat.toFixed(6);
                if(locationLongitudeInput) locationLongitudeInput.value = lng.toFixed(6);
                if (locationMarker) { locationMarker.setLatLng(e.latlng); }
                else {
                    locationMarker = L.marker(e.latlng, { draggable: true }).addTo(locationMap)
                        .bindPopup("Tu ubicación. Puedes arrastrarme.").openPopup();
                    locationMarker.on('dragend', function(event){
                        var marker = event.target; var position = marker.getLatLng();
                        if(locationLatitudeInput) locationLatitudeInput.value = position.lat.toFixed(6);
                        if(locationLongitudeInput) locationLongitudeInput.value = position.lng.toFixed(6);
                        locationMap.panTo(position);
                    });
                }
                locationMap.panTo(e.latlng);
            });
        } else if (locationMap) {
             setTimeout(() => { if (locationMap) locationMap.invalidateSize(); }, 100); 
             loadExistingLocation();
        }
    }

    async function loadExistingLocation() {
        if (userRole !== 'producer' || !locationForm) return;
        try {
            const response = await fetch('/api/locations/my-location', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (response.ok) {
                const location = await response.json();
                if (location && location.locationName) {
                     document.getElementById('locationName').value = location.locationName || '';
                     document.getElementById('address').value = location.address || '';
                     document.getElementById('schedule').value = location.schedule || '';
                     document.getElementById('specialty').value = location.specialty || '';
                     if(locationLatitudeInput) locationLatitudeInput.value = location.latitude || '';
                     if(locationLongitudeInput) locationLongitudeInput.value = location.longitude || '';
                     const imageUrl = location.imageUrl ? `/${location.imageUrl}` : '#';
                     if (locationImagePreview) {
                         locationImagePreview.src = imageUrl;
                         locationImagePreview.style.display = location.imageUrl ? 'block' : 'none';
                     }
                     if (locationMap && location.latitude && location.longitude) {
                         const latLng = [location.latitude, location.longitude];
                         if (locationMarker) { locationMarker.setLatLng(latLng); }
                         else {
                             locationMarker = L.marker(latLng, { draggable: true }).addTo(locationMap).bindPopup("Tu ubicación. Puedes arrastrarme.").openPopup();
                              locationMarker.on('dragend', function(event){
                                   var marker = event.target; var position = marker.getLatLng();
                                   if(locationLatitudeInput) locationLatitudeInput.value = position.lat.toFixed(6);
                                   if(locationLongitudeInput) locationLongitudeInput.value = position.lng.toFixed(6);
                                   locationMap.panTo(position);
                               });
                         }
                         locationMap.setView(latLng, 13);
                     }
                } else if (locationMap) {
                     locationMap.setView([15.7835, -90.2308], 7);
                     if(locationMarker) { locationMap.removeLayer(locationMarker); locationMarker = null; }
                }
            }
        } catch (error) { showToast('Error al cargar tu ubicación.', 'error'); }
    }
    
    if (locationForm) {
        locationForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             if (!locationLatitudeInput.value || !locationLongitudeInput.value) {
                 showToast('Por favor, haz clic en el mapa para seleccionar tu ubicación.', 'error'); return;
             }
             const formData = new FormData(locationForm);
             const fileInput = document.getElementById('locationImageFile');
             if (fileInput && (!fileInput.files || fileInput.files.length === 0)) { formData.delete('imageFile'); }

             try {
                 const response = await fetch('/api/locations', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                 if (response.ok) { showToast('Ubicación guardada.', 'success'); loadExistingLocation(); }
                 else { const err = await response.text(); showToast(`Error: ${err}`, 'error'); }
             } catch (error) { showToast('Error de red.', 'error'); }
        });
    }

    // =========================================================================
    // MÓDULO DE UBICACIÓN (ADMIN)
    // =========================================================================

    function initializeAdminLocationMap() {
        if (adminLocationMapElement && !adminLocationMap) {
            adminLocationMap = L.map('adminLocationMap').setView([15.7835, -90.2308], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(adminLocationMap);
            
            adminLocationMap.on('click', function(e) {
                const lat = e.latlng.lat; const lng = e.latlng.lng;
                if(adminLocationLatitudeInput) adminLocationLatitudeInput.value = lat.toFixed(6);
                if(adminLocationLongitudeInput) adminLocationLongitudeInput.value = lng.toFixed(6);
                if (adminLocationMarker) { adminLocationMarker.setLatLng(e.latlng); }
                else {
                    adminLocationMarker = L.marker(e.latlng, { draggable: true }).addTo(adminLocationMap).bindPopup("Ubicación seleccionada.").openPopup();
                }
                adminLocationMap.panTo(e.latlng);
            });
        } else if (adminLocationMap) {
             setTimeout(() => { if (adminLocationMap) adminLocationMap.invalidateSize(); }, 100); 
        }
    }

    async function loadAllLocations() {
        if (userRole !== 'admin' || !locationsAdminTbody) return;
        locationsAdminTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center">Cargando ubicaciones...</td></tr>';
        
        try {
            const response = await fetch('/api/admin/locations', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const locations = await response.json();
            
            if (locations.length === 0) {
                locationsAdminTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center">No hay ubicaciones registradas.</td></tr>';
            } else {
                locationsAdminTbody.innerHTML = locations.map(loc => `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium">${loc.locationName}</td>
                        <td class="px-6 py-4">${loc.address}</td>
                        <td class="px-6 py-4">${loc.owner ? loc.owner.email : '<i>(Sin dueño/Admin)</i>'}</td>
                        <td class="px-6 py-4 table-actions">
                            <button class="delete-location-btn delete-btn" data-id="${loc._id}">Eliminar</button>
                        </td>
                    </tr>
                `).join('');
                
                locationsAdminTbody.querySelectorAll('.delete-location-btn').forEach(btn => btn.addEventListener('click', deleteAdminLocation));
            }
        } catch (err) {
            locationsAdminTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-600">Error al cargar ubicaciones.</td></tr>';
            showToast('Error cargando ubicaciones.', 'error');
        }
    }
    
    if (adminLocationForm) {
        adminLocationForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             if (!adminLocationLatitudeInput.value || !adminLocationLongitudeInput.value) {
                 showToast('Por favor, haz clic en el mapa para seleccionar la ubicación.', 'error'); return;
             }
             const formData = new FormData(adminLocationForm);
             
             try {
                 const response = await fetch('/api/admin/locations', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                 if (response.ok) { 
                     showToast('Ubicación creada por Admin.', 'success'); 
                     adminLocationForm.reset();
                     if (adminLocationImagePreview) adminLocationImagePreview.style.display = 'none';
                     if (adminLocationMarker) adminLocationMap.removeLayer(adminLocationMarker);
                     adminLocationMarker = null;
                     loadAllLocations();
                 }
                 else { const err = await response.text(); showToast(`Error: ${err}`, 'error'); }
             } catch (error) { showToast('Error de red.', 'error'); }
        });
    }

    async function deleteAdminLocation(e) {
        const locationId = e.target.getAttribute('data-id');
        if (!confirm('¿Eliminar esta ubicación? (Esta acción es permanente)')) return;
        try {
            const response = await fetch(`/api/admin/locations/${locationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) { 
                showToast('Ubicación eliminada.', 'success'); 
                loadAllLocations(); 
            }
            else { const err = await response.text(); showToast(`Error al eliminar: ${err}`, 'error'); }
        } catch (err) { showToast('Error de red.', 'error'); }
    }


    // =========================================================================
    // MÓDULO DE BLOG (ADMIN)
    // =========================================================================
    
    async function loadPosts() {
        if (!postsTbody) return;
        postsTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center">Cargando posts...</td></tr>';
        
        try {
            const response = await fetch('/api/posts'); 
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const posts = await response.json();
            
            if (posts.length === 0) {
                postsTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center">No hay entradas publicadas.</td></tr>';
            } else {
                const formatDate = (d) => new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
                postsTbody.innerHTML = posts.map(p => `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium">${p.title}</td>
                        <td class="px-6 py-4">${formatDate(p.createdAt)}</td>
                        <td class="px-6 py-4 table-actions">
                            <button class="edit-post-btn edit-btn" data-id="${p._id}">Editar</button>
                            <button class="delete-post-btn delete-btn" data-id="${p._id}">Eliminar</button>
                        </td>
                    </tr>`).join('');
                    
                postsTbody.querySelectorAll('.edit-post-btn').forEach(button => {
                    button.addEventListener('click', (e) => openEditPostModal(e.target.getAttribute('data-id')));
                });
                postsTbody.querySelectorAll('.delete-post-btn').forEach(button => {
                    button.addEventListener('click', deletePost);
                });
            }
        } catch (err) { 
            postsTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-red-600">Error al cargar posts.</td></tr>'; 
            showToast('Error cargando posts.', 'error'); 
        }
    }


    if (addPostForm) {
        addPostForm.addEventListener('submit', async (e) => {
             e.preventDefault(); 
             const submitBtn = e.target.querySelector('button[type="submit"]');
             submitBtn.disabled = true;
             const formData = new FormData(addPostForm);
             
             try {
                  const response = await fetch('/api/posts', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }, 
                      body: formData 
                  });
                  submitBtn.disabled = false;
                  if (response.ok) { 
                      showToast('Post publicado.', 'success'); 
                      addPostForm.reset(); 
                      if(blogImagePreview) blogImagePreview.style.display = 'none';
                      loadPosts(); 
                  } else { 
                      const err = await response.text(); 
                      showToast(`Error al publicar: ${err}`, 'error'); 
                  }
             } catch (err) { 
                 submitBtn.disabled = false;
                 showToast('Error de red al publicar post.', 'error'); 
             }
         });
    }

    async function deletePost(e) {
        const target = e.target;
        const postId = target.getAttribute('data-id');
        if (target.classList.contains('delete-post-btn') && postId) {
            if (!confirm('¿Está seguro de ELIMINAR esta entrada de blog?')) return;
            try {
                const response = await fetch(`/api/posts/${postId}`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) { showToast('Post eliminado.', 'success'); loadPosts(); }
                else { const err = await response.text(); showToast(`Error al eliminar: ${err}`, 'error'); }
            } catch (err) { showToast('Error de red.', 'error'); }
        }
    }

    // Edición de Posts (Modal)
    async function openEditPostModal(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`); 
            if (!response.ok) throw new Error('No se pudo cargar el post.');
            
            const post = await response.json();

            document.getElementById('editPostId').value = post._id;
            document.getElementById('editPostTitle').value = post.title;
            document.getElementById('editPostContent').value = post.content;

            const editPostImagePreview = document.getElementById('editPostImagePreview');
            const imageUrl = post.imageUrl ? `/${post.imageUrl}` : '#';

            if (post.imageUrl) {
                editPostImagePreview.src = imageUrl; 
                editPostImagePreview.style.display = 'block';
            } else {
                editPostImagePreview.style.display = 'none';
                editPostImagePreview.src = '#';
            }
            document.getElementById('editPostImageFile').value = ''; 
            
            editPostModal.classList.add('active');
        } catch (err) {
            showToast('Error al cargar datos del post para edición.', 'error');
            console.error(err);
        }
    }

    function closeEditPostModal() { if (editPostModal) editPostModal.classList.remove('active'); }
    if (closePostModalBtn) closePostModalBtn.onclick = closeEditPostModal;
    if (cancelPostEditBtn) cancelPostEditBtn.onclick = closeEditPostModal;

    if (editPostForm) {
        editPostForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             const postId = document.getElementById('editPostId').value;
             const formData = new FormData(editPostForm);
             
             try {
                 const response = await fetch(`/api/posts/${postId}`, {
                     method: 'PUT',
                     headers: { 'Authorization': `Bearer ${token}` },
                     body: formData 
                 });
                 if (response.ok) { 
                     showToast('Post actualizado exitosamente.', 'success');
                     closeEditPostModal();
                     loadPosts();
                 } else { 
                     const err = await response.text(); 
                     showToast(`Error al actualizar post: ${err}`, 'error'); 
                 }
             } catch (error) { 
                 showToast('Error de red o servidor al actualizar post.', 'error'); 
             }
        });
    }

    // =========================================================================
    // MÓDULO DE USUARIOS (ADMIN)
    // =========================================================================

    async function loadUsers() {
        if (userRole !== 'admin' || !usersTbody) return;
        usersTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center">Cargando usuarios...</td></tr>';
        
        try {
            const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const users = await response.json();
            
            if (users.length === 0) {
                usersTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center">No hay usuarios registrados.</td></tr>';
            } else {
                usersTbody.innerHTML = users.map(u => `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium">${u.email}</td>
                        <td class="px-6 py-4">${u.role}</td>
                        <td class="px-6 py-4 table-actions">
                            <button class="toggle-role-btn edit-btn" data-id="${u._id}" data-current-role="${u.role}">
                                Cambiar a ${u.role === 'admin' ? 'Productor' : 'Admin'}
                            </button>
                            <button class="delete-user-btn delete-btn" data-id="${u._id}">Eliminar</button>
                        </td>
                    </tr>
                `).join('');
                
                usersTbody.querySelectorAll('.toggle-role-btn').forEach(btn => btn.addEventListener('click', toggleUserRole));
                usersTbody.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', deleteUser));
            }
        } catch (err) {
            usersTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-red-600">Error al cargar usuarios.</td></tr>';
            showToast('Error cargando lista de usuarios.', 'error');
        }
    }

    async function toggleUserRole(e) {
        const userId = e.target.getAttribute('data-id');
        const currentRole = e.target.getAttribute('data-current-role');
        const newRole = currentRole === 'admin' ? 'producer' : 'admin';
        if (!confirm(`¿Estás seguro de cambiar el rol de ${currentRole} a ${newRole.toUpperCase()}?`)) return;

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });
            if (response.ok) { showToast(`Rol actualizado a ${newRole}.`, 'success'); loadUsers(); } 
            else { const err = await response.text(); showToast(`Error al cambiar rol: ${err}`, 'error'); }
        } catch (error) { showToast('Error de red al cambiar rol.', 'error'); }
    }

    async function deleteUser(e) {
        const userId = e.target.getAttribute('data-id');
        if (!confirm(`¡ADVERTENCIA! ¿Estás seguro de ELIMINAR al usuario ${userId}?`)) return;

        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) { showToast('Usuario eliminado.', 'success'); loadUsers(); } 
            else { const err = await response.text(); showToast(`Error al eliminar: ${err}`, 'error'); }
        } catch (error) { showToast('Error de red al eliminar usuario.', 'error'); }
    }
    
    // Cerrar modales con clic fuera
    window.onclick = (event) => { 
        if (event.target == editProductModal) closeEditProductModal(); 
        if (event.target == editPostModal) closeEditPostModal(); 
    };

    // =========================================================================
    // 5. INICIALIZACIÓN FINAL
    // =========================================================================
    const initialSection = 'profileSection';
    switchSection(initialSection); 
});