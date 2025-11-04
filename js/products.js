// GranoCraft/js/products.js

// Función para cargar los productos de la API
async function fetchProducts() {
    try {
        // Usa la ruta API pública de los datos del productor
        const response = await fetch('/api/products'); 
        if (!response.ok) {
            throw new Error(`Error al cargar productos: ${response.status}`);
        }
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Fallo al obtener los productos:", error);
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = '<p style="color: red;">No se pudieron cargar los productos. Asegúrese que el servidor esté activo.</p>';
        }
    }
}

// Función para crear la tarjeta HTML de cada producto
function createProductCard(product) {
    
    // 1. Manejar la ruta de la imagen
    let imageUrl = product.imageUrl || 'https://via.placeholder.com/200';
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
         imageUrl = '/' + imageUrl;
    }

    // 2. Determinar el nombre público y el enlace
    const producerId = product.owner ? product.owner._id : '#';
    const producerPublicName = product.owner ? (product.owner.producerNamePublic || 'Productor Anónimo') : (product.producerName || 'Productor Desconocido');

    // 3. Crear el enlace al perfil público
    const producerLink = `<a href="profile.html?id=${producerId}" style="color: #8a5a44; font-weight: bold; text-decoration: underline;">${producerPublicName}</a>`;


    return `
        <div class="card">
            <img src="${imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            
            <p><strong>Productor:</strong> ${producerLink}</p> 
            
            <p>Origen: ${product.origin} | Tueste: ${product.roastLevel}</p>
            <p>${product.description}</p>
            <p class="price">Q ${product.price.toFixed(2)}</p>
        </div>
    `;
}

// Función para inyectar las tarjetas en el contenedor
function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p>Actualmente no hay productos disponibles.</p>';
        return;
    }

    const productHtml = products.map(createProductCard).join('');
    grid.innerHTML = productHtml;
}

fetchProducts();