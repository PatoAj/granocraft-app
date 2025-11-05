// js/map.js (CÓDIGO CORREGIDO para manejar rutas Cloudinary/Locales)

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('mapaPublico');
    const locationsListContainer = document.getElementById('locationsListContainer');
    
    if (!mapElement) { return; }

    // 1. FUNCIÓN PARA MANEJAR RUTAS CLOUDINARY O LOCALES
    /**
     * Determina la URL correcta de la imagen (Cloudinary, local o placeholder).
     */
    function getImageUrl(path, width, height, placeholderText = 'Sin Imagen') {
        if (!path) {
            // Placeholder si no hay imagen
            return `https://via.placeholder.com/${width}x${height}/A18A76/FFFFFF?text=${placeholderText}`;
        }
        if (path.startsWith('http')) {
            // Es una URL absoluta (Cloudinary o externa), devolverla tal cual
            return path;
        }
        // Es una ruta relativa (antigua /uploads/), añadir /
        return `/${path}`;
    }

    // 2. Inicializar el mapa de Leaflet
    const map = L.map('mapaPublico').setView([15.7835, -90.2308], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // 3. Función para crear el contenido del Popup (ventana emergente)
    function createPopupContent(location) {
        // Usar la función corregida para la imagen del Popup (300x150)
        const imageUrl = getImageUrl(location.imageUrl, 300, 150); 
        
        // Usamos el nombre del productor para mayor claridad
        const producerName = location.owner ? (location.owner.producerNamePublic || 'N/A') : 'N/A';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 250px;">
                <img src="${imageUrl}" alt="${location.locationName}" style="width:100%; height:100px; object-fit: cover; border-radius: 4px;">
                <h3 style="color: #3C2A21; margin-top: 10px; margin-bottom: 5px;">${location.locationName}</h3>
                <p style="margin: 3px 0; font-size: 0.9em;"><strong>👨‍🌾 Productor:</strong> ${producerName}</p>
                <p style="margin: 3px 0; font-size: 0.9em;"><strong>📍 Dirección:</strong> ${location.address || 'No especificada'}</p>
                <p style="margin: 3px 0; font-size: 0.9em;"><strong>⏰ Horario:</strong> ${location.schedule || 'Consultar'}</p>
            </div>
        `;
    }

    // 4. Función para crear la tarjeta de lista (Directorio)
    function createLocationCard(location) {
        // Usar la función corregida para la imagen de la Tarjeta (150x100)
        const imageUrl = getImageUrl(location.imageUrl, 150, 100); 

        const producerName = location.owner ? (location.owner.producerNamePublic || 'N/A') : 'N/A';
        const producerId = location.owner ? location.owner._id : '#';

        // Enlace al perfil del productor
        const profileLink = producerId !== '#' 
            ? `<a href="profile.html?id=${producerId}" style="color: #8a5a44; text-decoration: underline;">Ver Perfil</a>`
            : '';
        
        // Obtener el nombre del café/finca, usando el nombre del productor si no está definido
        const displayName = location.locationName || producerName;

        return `
            <div class="location-card">
                <img src="${imageUrl}" alt="${displayName}">
                <div class="location-card-content">
                    <h3>${displayName}</h3>
                    <p><strong>Productor:</strong> ${producerName} ${profileLink}</p>
                    <p>📍 ${location.address}</p>
                    <p>⏰ ${location.schedule || 'Consultar horarios'}</p>
                    <p>🌟 ${location.specialty || 'Café de especialidad'}</p>
                </div>
            </div>
        `;
    }

    // 5. Función para inyectar las tarjetas en el contenedor del directorio
    function displayLocationsList(locations) {
        if (!locationsListContainer) return;

        if (locations.length === 0) {
            locationsListContainer.innerHTML = '<p style="text-align: center;">Aún no hay fincas o cafeterías registradas.</p>';
        } else {
            // Generar todas las tarjetas y mostrarlas
            locationsListContainer.innerHTML = locations.map(createLocationCard).join('');

            // Centrar el mapa si hay ubicaciones
            if (locations[0] && locations[0].latitude) {
                map.setView([locations[0].latitude, locations[0].longitude], 10);
            }
        }
    }


    // 6. Función asíncrona principal para cargar las ubicaciones desde la API
    async function loadLocations() {
        if (!locationsListContainer) return;
        locationsListContainer.innerHTML = '<p style="text-align: center;">Cargando directorio...</p>';

        try {
            // Llamar a la API pública
            const response = await fetch('/api/locations');
            if (!response.ok) {
                // Si hay un error, intentamos mostrarlo de forma útil
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
            
            const locations = await response.json();

            // Filtrar solo ubicaciones con latitud/longitud válidas para el mapa
            const validLocations = locations.filter(loc => loc.latitude && loc.longitude);
            
            // Llenar el Directorio
            displayLocationsList(validLocations);

            // Crear un marcador (pin) por cada ubicación
            validLocations.forEach(location => {
                const marker = L.marker([location.latitude, location.longitude]).addTo(map);
                marker.bindPopup(createPopupContent(location));
            });
            
            // Si no hay ubicaciones válidas, centrar en Guatemala (vista por defecto)
            if (validLocations.length === 0) {
                map.setView([15.7835, -90.2308], 7);
            }

        } catch (error) {
            console.error('Error al cargar las ubicaciones en el mapa:', error);
            locationsListContainer.innerHTML = '<p style="text-align: center; color: red;">Error al cargar las ubicaciones o servidor inactivo.</p>';
            // Mostrar error en el mapa si es un error de red
            if (error.message.includes('Error')) {
                map.openPopup('Error al cargar las ubicaciones. Revise la consola.', map.getCenter());
            }
        }
    }

    // Iniciar la carga de ubicaciones
    loadLocations();
});