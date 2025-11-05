// GranoCraft/js/producer_profile.js (CÓDIGO CORREGIDO PARA CLOUDINARY Y MANEJO DE ERRORES)

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
    // Referencia a la tarjeta principal para inyectar errores
    const mainCardElement = document.getElementById('producer-main-card'); 


    if (!producerId) {
        producerNameElement.textContent = "Error: Productor no especificado.";
        producerBioElement.textContent = "Asegúrese de usar un enlace de perfil válido.";
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
        let html = '';
        const name = producerNameElement.textContent || 'El productor';

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
        if (!images || images.length === 0) {
            if (profileGalleryContainer) profileGalleryContainer.style.display = 'none';
            return;
        }

        galleryGrid.innerHTML = '';
        images.forEach(imagePath => {
            // USAR getImageUrl para asegurar la ruta correcta (Cloudinary/Local)
            const imgPath = getImageUrl(imagePath);
            if (!imgPath) return; 

            const galleryItemLink = document.createElement('a');
            galleryItemLink.href = imgPath; // Ruta completa o Cloudinary URL
            galleryItemLink.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = 'Imagen de galería del productor';
            
            galleryItemLink.appendChild(img);
            galleryGrid.appendChild(galleryItemLink);
        });

        if (profileGalleryContainer) profileGalleryContainer.style.display = 'block';

        // Inicializar SimpleLightbox después de que las imágenes se han cargado
        // Nota: Asegúrate de que la librería SimpleLightbox esté cargada en profile.html
        if (typeof SimpleLightbox !== 'undefined') {
            new SimpleLightbox('.gallery-grid a', {
                captions: true,
                captionDelay: 10,
                animationSpeed: 150,
                preloading: true,
                quitOnEsc: true,
                loop: true,
            });
        }
    }

    // --- 4. FUNCIÓN PRINCIPAL PARA OBTENER LOS DATOS ---
    async function fetchProducerData() {
        try {
            const response = await fetch(`/api/public/profile/${producerId}`); 
            
            if (response.status === 404) {
                 // Perfil no encontrado (respuesta OK, pero recurso no existe)
                 producerNameElement.textContent = "Perfil no encontrado (404).";
                 producerBioElement.textContent = "El ID de productor no es válido.";
                 return;
            }
            
            if (!response.ok) {
                // Error de servidor (5xx) o de API (4xx genérico)
                throw new Error(`Error de red al cargar perfil: ${response.status}`);
            }
            
            const producer = await response.json();
            
            const name = producer.producerNamePublic || 'Productor GranoCraft';
            if (profileTitle) profileTitle.textContent = `${name} | Perfil`;
            producerNameElement.textContent = name;
            producerBioElement.textContent = producer.bio || 'Este productor aún no ha escrito su biografía.';

            // MANEJO DE LOGO CORREGIDO
            const logoPath = getImageUrl(producer.profileImage);

            if (producerLogoElement) {
                 if (logoPath) {
                     producerLogoElement.src = logoPath;
                     producerLogoElement.style.display = 'block';
                 } else {
                     producerLogoElement.src = '/img/logo_default.png'; // Fallback visual
                     // Si la imagen es nula, mostramos el nombre más centrado
                     producerLogoElement.style.display = 'none'; 
                     producerNameElement.style.paddingTop = '0px'; 
                 }
            }


            buildContactLinks(producer.contact, producer.email);
            buildGallery(producer.galleryImages);

        } catch (error) {
            console.error("Fallo al obtener el perfil del productor:", error);
            
            // Si el error es de red/servidor (el que causó la imagen "Error de conexión")
            if (producerNameElement) producerNameElement.textContent = "Error de conexión con el servidor.";
            if (producerBioElement) producerBioElement.textContent = "No se pudo establecer conexión con la base de datos o API.";
        }
    }

    // --- 5. EJECUTAR ---
    fetchProducerData();
});