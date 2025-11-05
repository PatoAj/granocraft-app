// GranoCraft/js/producer_profile.js (CÓDIGO FINAL CORREGIDO)

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. OBTENER REFERENCIAS Y EL ID DEL PRODUCTOR ---
    const urlParams = new URLSearchParams(window.location.search);
    const producerId = urlParams.get('id');

    const producerNameElement = document.getElementById('producer-name');
    const producerBioElement = document.getElementById('producer-bio');
    const contactLinksContainer = document.getElementById('contact-links');
    const profileTitle = document.getElementById('profile-title');
    
    // Referencias de Logo y Galería
    const producerLogoElement = document.getElementById('producer-logo');
    const profileGalleryContainer = document.getElementById('profile-gallery-container');
    const galleryGrid = document.getElementById('gallery-grid');
    // Asumiendo que la tarjeta principal para error es algún contenedor padre del texto
    const mainCardElement = document.getElementById('main-profile-card'); 


    if (!producerId) {
        if(producerNameElement) producerNameElement.textContent = "Error: Productor no especificado.";
        if(producerBioElement) producerBioElement.textContent = "Asegúrese de usar un enlace de perfil válido.";
        return;
    }
    
    // =========================================================================
    // UTILIDAD: Función para manejar rutas de imágenes (Cloudinary o Local)
    // =========================================================================
    function getImageUrl(path) {
        if (!path) return null;
        if (path.startsWith('http')) {
            // Cloudinary o URL absoluta
            return path;
        }
        // Ruta local
        return `/${path}`;
    }


    // --- 2. FUNCIÓN PARA CONSTRUIR LOS BOTONES DE CONTACTO ---
    function buildContactLinks(contact, email) {
        if (!contactLinksContainer) return;
        
        let html = '';
        const name = producerNameElement ? (producerNameElement.textContent || 'El productor') : 'El productor';

        if (contact && contact.whatsapp) {
            const phone = contact.whatsapp.replace(/[^0-9]/g, '');
            html += `<a href="https://wa.me/${phone}" target="_blank" class="whatsapp">
                        <i class="fa-brands fa-whatsapp fa-fw"></i> WhatsApp
                     </a>`;
        }
        if (contact && contact.instagram) {
            const username = contact.instagram.replace('@', '');
            html += `<a href="https://instagram.com/${username}" target="_blank" class="instagram">
                        <i class="fa-brands fa-instagram fa-fw"></i> Instagram
                     </a>`;
        }
        if (contact && contact.facebook) {
            let url = contact.facebook.startsWith('http') ? contact.facebook : `https://facebook.com/${contact.facebook}`;
            html += `<a href="${url}" target="_blank" class="facebook">
                        <i class="fa-brands fa-facebook fa-fw"></i> Facebook
                     </a>`;
        }
        if (contact && contact.showEmail && email) {
            html += `<a href="mailto:${email}" class="email-link">
                        <i class="fa-solid fa-envelope fa-fw"></i> Enviar Correo
                     </a>`;
        }
        if (html === '') {
            html = `<p style="color:#8a5a44;">${name} no ha compartido medios de contacto públicos.</p>`;
        }
        contactLinksContainer.innerHTML = html;
    }
    
    // --- 3. FUNCIÓN PARA CONSTRUIR LA GALERÍA ---
    function buildGallery(images) {
        if (!galleryGrid) return;
        
        if (!images || images.length === 0) {
            if (profileGalleryContainer) profileGalleryContainer.style.display = 'none';
            return;
        }

        galleryGrid.innerHTML = '';
        images.forEach(imagePath => {
            const imgPath = getImageUrl(imagePath);
            if (!imgPath) return; 

            const galleryItemLink = document.createElement('a');
            galleryItemLink.href = imgPath;
            galleryItemLink.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = 'Imagen de galería del productor';
            
            galleryItemLink.appendChild(img);
            galleryGrid.appendChild(galleryItemLink);
        });

        if (profileGalleryContainer) profileGalleryContainer.style.display = 'block';

        // Inicializar SimpleLightbox después de que las imágenes se han cargado
        if (typeof SimpleLightbox !== 'undefined') {
            new SimpleLightbox('.gallery-grid a', {
                // ... (Opciones de lightbox)
            });
        }
    }

    // --- 4. FUNCIÓN PRINCIPAL PARA OBTENER LOS DATOS ---
    async function fetchProducerData() {
        try {
            const response = await fetch(`/api/public/profile/${producerId}`); 
            
            if (response.status === 404) {
                 if (producerNameElement) producerNameElement.textContent = "Perfil no encontrado (404).";
                 if (producerBioElement) producerBioElement.textContent = "El ID de productor no es válido.";
                 return;
            }
            
            if (!response.ok) {
                throw new Error(`Fallo de API/Servidor: ${response.status}`);
            }
            
            const producer = await response.json();
            
            // --- INYECCIÓN DE DATOS VÁLIDOS ---
            const name = producer.producerNamePublic || 'Productor GranoCraft';
            if (profileTitle) profileTitle.textContent = `${name} | Perfil`;
            if (producerNameElement) producerNameElement.textContent = name;
            if (producerBioElement) producerBioElement.textContent = producer.bio || 'Este productor aún no ha escrito su biografía.';

            // MANEJO DE LOGO CORREGIDO
            const logoPath = getImageUrl(producer.profileImage);

            if (producerLogoElement) {
                 if (logoPath) {
                     producerLogoElement.src = logoPath;
                     producerLogoElement.style.display = 'block';
                 } else {
                     // Solo si no hay logo, se muestra el nombre sin padding extra
                     producerLogoElement.style.display = 'none'; 
                     if (producerNameElement) producerNameElement.style.paddingTop = '0px'; 
                 }
            }

            // Ocultar mensajes de error si los datos se cargaron
            if (mainCardElement) {
                 mainCardElement.classList.remove('error-state'); 
                 // Asegúrate de que el contenido no deseado sea eliminado o mapeado aquí.
                 // (Tu HTML de producer_profile debe tener elementos con IDs correctos)
            }


            buildContactLinks(producer.contact, producer.email);
            buildGallery(producer.galleryImages);

        } catch (error) {
            console.error("Fallo al obtener el perfil del productor (RED/API):", error);
            
            // Esta lógica solo se ejecuta si la llamada a la API falló a nivel de red o lanzó un error interno.
            if (producerNameElement) producerNameElement.textContent = "Error de conexión con el servidor.";
            if (producerBioElement) producerBioElement.textContent = "No se pudo establecer conexión con la base de datos o API.";
            
            // Asegúrate de que tu HTML tiene un elemento que envuelve el error (si ya lo tienes en HTML)
            const errorContainer = document.getElementById('error-message-container');
            if (errorContainer) {
                 errorContainer.style.display = 'block';
                 // Si estás usando un div para el error, puedes ocultar el contenido principal aquí.
            }
        }
    }

    // --- 5. EJECUTAR ---
    fetchProducerData();
});