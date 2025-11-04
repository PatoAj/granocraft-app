// GranoCraft/js/admin.js (VERSIÓN FINAL Y COMPLETA)

/**
 * ========================================
 * FUNCIÓN PARA MOSTRAR NOTIFICACIONES TOAST
 * ========================================
 */
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
    const locationImageFile = document.getElementById('locationImageFile');
    const locationImagePreview = document.getElementById('locationImagePreview'); 
    let locationMap = null;
    let locationMarker = null;

    // Ubicación (Admin) - Incluido para mantener la estructura
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
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        userRole = decodedPayload.role || 'producer';
        if (userRoleDisplay) userRoleDisplay.textContent = userRole.toUpperCase();
    } catch (e) {
        if (userRoleDisplay) userRoleDisplay.textContent = 'ERROR';
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
        return;
    }

    // Ocultar/Mostrar enlaces
    const productsLink = document.getElementById('productsLink');
    const locationLink = document.getElementById('locationLink');
    const manageLocationsAdminLink = document.getElementById('manageLocationsAdminLink');
    const manageBlogLink = document.getElementById('manageBlogLink');
    const manageUsersLink = document.getElementById('manageUsersLink');
    const productsSectionTitle = document.getElementById('productsSectionTitle');

    if (userRole === 'producer') {
        if (productsLink) productsLink.style.display = 'block';
        if (locationLink) locationLink.style.display = 'block';
        if (showAddProductFormBtn) showAddProductFormBtn.style.display = 'block';
        if (productsSectionTitle) productsSectionTitle.textContent = 'Mis Productos';
    } else if (userRole === 'admin') {
        if (productsLink) productsLink.style.display = 'block';
        if (manageLocationsAdminLink) manageLocationsAdminLink.style.display = 'block';
        if (manageBlogLink) manageBlogLink.style.display = 'block';
        if (manageUsersLink) manageUsersLink.style.display = 'block';
        if (productsSectionTitle) productsSectionTitle.textContent = 'Todos los Productos (Admin)';
    }

    // =========================================================================
    // 2. FUNCIONES DE UTILIDAD (Navegación)
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
    // 3. MÓDULO DE PERFIL (Solo esencial para no romper el resto)
    // =========================================================================
    
    async function loadProfile() {
        try {
            const response = await fetch('/api/profile', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) { window.location.href = 'login.html'; return; }
            if (!response.ok) throw new Error('Error al cargar perfil.');
            
            userProfileData = await response.json(); 
            
            if(document.getElementById('emailDisplay')) document.getElementById('emailDisplay').value = userProfileData.email || '';
            if(document.getElementById('producerNamePublic')) document.getElementById('producerNamePublic').value = userProfileData.producerNamePublic || '';
            if(document.getElementById('bio')) document.getElementById('bio').value = userProfileData.bio || '';
            
        } catch (error) {
            showToast('Error al cargar la información del perfil.', 'error');
        }
    }


    // =========================================================================
    // 4. MÓDULO DE UBICACIÓN (PRODUCTOR) - IMPLEMENTACIÓN CORREGIDA
    // =========================================================================
    
    // 4.1 Inicializar Mapa (Leaflet)
    function initializeLocationMap() {
        if (locationMapElement && !locationMap) {
            // Inicializar mapa en el centro de Guatemala
            locationMap = L.map('locationMap').setView([15.7835, -90.2308], 7); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(locationMap);
            loadExistingLocation(); // Cargar la ubicación si ya existe

            locationMap.on('click', function(e) {
                const lat = e.latlng.lat; const lng = e.latlng.lng;
                if(locationLatitudeInput) locationLatitudeInput.value = lat.toFixed(6);
                if(locationLongitudeInput) locationLongitudeInput.value = lng.toFixed(6);

                if (locationMarker) { locationMarker.setLatLng(e.latlng); }
                else {
                    locationMarker = L.marker(e.latlng, { draggable: true }).addTo(locationMap).bindPopup("Tu ubicación. Puedes arrastrarme.").openPopup();
                    locationMarker.on('dragend', function(event){
                        var position = event.target.getLatLng();
                        if(locationLatitudeInput) locationLatitudeInput.value = position.lat.toFixed(6);
                        if(locationLongitudeInput) locationLongitudeInput.value = position.lng.toFixed(6);
                    });
                }
                locationMap.panTo(e.latlng);
            });
        } else if (locationMap) {
             // Refrescar mapa si ya existe (necesario al cambiar de sección)
             setTimeout(() => { if (locationMap) locationMap.invalidateSize(); }, 100); 
             loadExistingLocation();
        }
    }

    // 4.2 Cargar Ubicación Existente (Para rellenar el formulario)
    async function loadExistingLocation() {
        if (!locationForm) return;

        try {
            const response = await fetch('/api/locations/my-location', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) { return; }

            if (response.ok) {
                const location = await response.json();
                
                if (location && location.locationName) {
                     // Rellenar todos los campos (CRÍTICO)
                     if(document.getElementById('locationName')) document.getElementById('locationName').value = location.locationName || '';
                     if(document.getElementById('address')) document.getElementById('address').value = location.address || '';
                     if(document.getElementById('schedule')) document.getElementById('schedule').value = location.schedule || '';
                     if(document.getElementById('specialty')) document.getElementById('specialty').value = location.specialty || '';
                     if(locationLatitudeInput) locationLatitudeInput.value = location.latitude || '';
                     if(locationLongitudeInput) locationLongitudeInput.value = location.longitude || '';
                     
                     // Cargar imagen de preview
                     const imageUrl = location.imageUrl ? `/${location.imageUrl}` : '#';
                     if (locationImagePreview) {
                         locationImagePreview.src = imageUrl;
                         locationImagePreview.style.display = location.imageUrl ? 'block' : 'none';
                     }
                     
                     // Colocar marcador
                     if (locationMap && location.latitude && location.longitude) {
                         const latLng = [location.latitude, location.longitude];
                         if (locationMarker) { locationMarker.setLatLng(latLng); }
                         else {
                             locationMarker = L.marker(latLng, { draggable: true }).addTo(locationMap);
                             locationMarker.on('dragend', function(event){
                                 var position = event.target.getLatLng();
                                 if(locationLatitudeInput) locationLatitudeInput.value = position.lat.toFixed(6);
                                 if(locationLongitudeInput) locationLongitudeInput.value = position.lng.toFixed(6);
                             });
                         }
                         locationMap.setView(latLng, 13);
                     }
                } else {
                     // Si no hay ubicación guardada, limpiar campos y centrar mapa
                     locationForm.reset();
                     if (locationMap) locationMap.setView([15.7835, -90.2308], 7);
                     if (locationMarker) locationMap.removeLayer(locationMarker);
                     locationMarker = null;
                }
            }
        } catch (error) { showToast('Error al cargar tu ubicación existente.', 'error'); }
    }
    
    // 4.3 Listener para GUARDAR/ACTUALIZAR la Ubicación
    if (locationForm) {
        locationForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             if (!locationLatitudeInput.value || !locationLongitudeInput.value) {
                 showToast('Por favor, haz clic en el mapa para seleccionar tu ubicación.', 'error'); return;
             }
             
             // Usamos FormData para la subida de archivos (Multer/Cloudinary)
             const formData = new FormData(locationForm);
             const fileInput = document.getElementById('locationImageFile');
             
             if (fileInput && (!fileInput.files || fileInput.files.length === 0)) { formData.delete('imageFile'); }

             try {
                 // La ruta POST hace un UPSERT (crea o actualiza)
                 const response = await fetch('/api/locations', { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${token}` }, 
                     body: formData 
                 });

                 if (response.ok) { 
                     showToast('Ubicación guardada exitosamente.', 'success'); 
                     loadExistingLocation(); 
                 }
                 else { 
                     const err = await response.text(); 
                     showToast(`Error al guardar ubicación: ${err}`, 'error'); 
                 }
             } catch (error) { showToast('Error de red al guardar ubicación.', 'error'); }
        });
    }

    // =========================================================================
    // 5. INICIALIZACIÓN FINAL
    // =========================================================================
    const initialSection = 'profileSection';
    switchSection(initialSection); 
});