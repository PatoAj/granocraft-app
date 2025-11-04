// GranoCraft/js/producer_profile.js

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

    if (!producerId) {
        producerNameElement.textContent = "Error: Productor no especificado.";
        producerBioElement.textContent = "Asegúrese de usar un enlace de perfil válido.";
        return;
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
    
    // --- 3. FUNCIÓN PARA CONSTRUIR LA GALERÍA (AHORA CON SIMPLELIGHTBOX) ---
    function buildGallery(images) {
        if (!images || images.length === 0) {
            profileGalleryContainer.style.display = 'none';
            return;
        }

        galleryGrid.innerHTML = '';
        images.forEach(imageUrl => {
            const imgPath = `/${imageUrl}`;
            const galleryItemLink = document.createElement('a');
            galleryItemLink.href = imgPath;
            galleryItemLink.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = 'Imagen de galería del productor';
            
            galleryItemLink.appendChild(img);
            galleryGrid.appendChild(galleryItemLink);
        });

        profileGalleryContainer.style.display = 'block';

        // Inicializar SimpleLightbox después de que las imágenes se han cargado
        new SimpleLightbox('.gallery-grid a', {
            captions: true,
            captionDelay: 10,
            animationSpeed: 150,
            preloading: true,
            quitOnEsc: true,
            loop: true,
        });
    }

    // --- 4. FUNCIÓN PRINCIPAL PARA OBTENER LOS DATOS ---
    async function fetchProducerData() {
        try {
            const response = await fetch(`/api/public/profile/${producerId}`); 
            if (!response.ok) {
                producerNameElement.textContent = "Perfil no encontrado.";
                return;
            }
            
            const producer = await response.json();
            
            const name = producer.producerNamePublic || 'Productor GranoCraft';
            profileTitle.textContent = `${name} | Perfil`;
            producerNameElement.textContent = name;
            producerBioElement.textContent = producer.bio || 'Este productor aún no ha escrito su biografía.';

            if (producer.profileImage) {
                producerLogoElement.src = `/${producer.profileImage}`;
                producerLogoElement.style.display = 'block';
            } else {
                producerLogoElement.style.display = 'none';
                producerNameElement.style.paddingTop = '0px';
            }

            buildContactLinks(producer.contact, producer.email);
            buildGallery(producer.galleryImages);

        } catch (error) {
            console.error("Fallo al obtener el perfil del productor:", error);
            producerNameElement.textContent = "Error de conexión con el servidor.";
        }
    }

    // --- 5. EJECUTAR ---
    fetchProducerData();
});