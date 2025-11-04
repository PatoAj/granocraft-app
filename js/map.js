// js/map.js

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('mapaPublico');
    const locationsListContainer = document.getElementById('locationsListContainer');
    
    if (!mapElement) { return; }

    // 2. Inicializar el mapa de Leaflet
    const map = L.map('mapaPublico').setView([15.7835, -90.2308], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // 3. Función para crear el contenido del Popup (ventana emergente)
    function createPopupContent(location) {
        const imageUrl = location.imageUrl 
            ? `/${location.imageUrl}` 
            : 'https://via.placeholder.com/300x150/A18A76/FFFFFF?text=Sin+Imagen';

        // Usamos el nombre del productor para mayor claridad
        const producerName = location.owner ? location.owner.producerNamePublic : 'N/A';

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
        const imageUrl = location.imageUrl 
            ? `/${location.imageUrl}` 
            : 'https://via.placeholder.com/150x100/A18A76/FFFFFF?text=Sin+Imagen';

        const producerName = location.owner ? location.owner.producerNamePublic : 'N/A';
        const producerId = location.owner ? location.owner._id : '#';

        // Enlace al perfil del productor
        const profileLink = producerId !== '#' 
            ? `<a href="profile.html?id=${producerId}" style="color: #8a5a44; text-decoration: underline;">Ver Perfil</a>`
            : '';

        return `
            <div class="location-card">
                <img src="${imageUrl}" alt="${location.locationName}">
                <div class="location-card-content">
                    <h3>${location.locationName}</h3>
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
                throw new Error(`Error al cargar ubicaciones: ${response.status}`);
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

        } catch (error) {
            console.error('Error al cargar las ubicaciones en el mapa:', error);
            locationsListContainer.innerHTML = '<p style="text-align: center; color: red;">No se pudieron cargar las ubicaciones en el mapa.</p>';
            map.openPopup('Error al cargar las ubicaciones.', map.getCenter());
        }
    }

    // Iniciar la carga de ubicaciones
    loadLocations();
});