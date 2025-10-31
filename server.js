// GranoCraft/server.js (Versión Cloudinary)

// 1. IMPORTACIONES
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const fs = require('fs'); 
require('dotenv').config();

// --- NUEVO: Importaciones de Cloudinary ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Importar Modelos
const User = require('./models/User');
const Product = require('./models/Product');
const Post = require('./models/Post');
const Location = require('./models/Location');

// 2. CONFIGURACIÓN INICIAL
const app = express();
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/granocraft_db';
const JWT_LITERAL_SECRET = "EstaEsMiLlaveSecretaParaGranoCraft2025"; 

// --- NUEVO: Configuración de Cloudinary ---
// (Lee las variables que pusiste en Render/dotenv)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 3. CONEXIÓN A MONGODB
mongoose.connect(DB_URL)
    .then(() => console.log('✅ Conexión exitosa a MongoDB.'))
    .catch(err => {
        console.error('❌ Error de conexión a la Base de Datos:', err.message);
    });

// 4. MIDDLEWARE BASE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE MULTER (MODIFICADA) ---
// Ya no usamos 'uploads/' ni 'fs.existsSync(uploadsDir)'

// Configurar Multer para que suba a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determinar la carpeta en Cloudinary basado en la ruta
    let folderName = 'GranoCraft/general';
    if (req.originalUrl.includes('/api/products')) folderName = 'GranoCraft/products';
    if (req.originalUrl.includes('/api/profile/image')) folderName = 'GranoCraft/profiles';
    if (req.originalUrl.includes('/api/profile/gallery')) folderName = 'GranoCraft/gallery';
    if (req.originalUrl.includes('/api/posts')) folderName = 'GranoCraft/blog';
    if (req.originalUrl.includes('/api/locations')) folderName = 'GranoCraft/locations';

    return {
      folder: folderName,
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      // Crear un ID público único (nombre del archivo en Cloudinary)
      public_id: `granocraft_${Date.now()}` 
    };
  }
});

const upload = multer({ storage: storage }); // ¡Ahora usa el storage de Cloudinary!

// --- SERVIR ARCHIVOS ESTÁTICOS ---
// Ya no necesitamos servir /uploads, pero sí el resto de la app
app.use(express.static(path.join(__dirname))); 

// --- Middlewares de Autenticación y Roles ---
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_LITERAL_SECRET);
            req.user = { id: decoded.id, role: decoded.role, email: decoded.email }; 
            next(); 
        } catch (error) {
            console.error('Fallo de verificación JWT:', error.message);
            return res.status(401).send('No autorizado, token fallido o expirado.'); 
        }
    } else {
        return res.status(401).send('No autorizado, no hay token.');
    }
};

const isAdmin = (req, res, next) => { /* ... (sin cambios) ... */ };
const isProducer = (req, res, next) => { /* ... (sin cambios) ... */ };


// **********************************************
// 5. RUTAS (APIs) - MODIFICADAS
// **********************************************

// --- Rutas de Autenticación --- (Sin cambios)
app.post('/register', async (req, res) => { /* ... (sin cambios) ... */ });
app.post('/login', async (req, res) => { /* ... (sin cambios) ... */ });

// --- RUTA PÚBLICA: Perfil de Productor --- (Sin cambios)
app.get('/api/public/profile/:id', async (req, res) => { /* ... (sin cambios) ... */ });

// --- API: Gestión de Perfil (Propio) --- (Sin cambios)
app.get('/api/profile', protect, async (req, res) => { /* ... (sin cambios) ... */ });
app.put('/api/profile', protect, async (req, res) => { /* ... (sin cambios) ... */ });

// --- API: Gestión de Imagen de Perfil/Logo (MODIFICADA) ---
app.post('/api/profile/image', protect, upload.single('profileImage'), async (req, res) => {
    if (!req.file) return res.status(400).send('No se ha subido ningún archivo.');
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado.');

        // TODO: Eliminar imagen antigua de Cloudinary (user.profileImage)
        
        user.profileImage = req.file.path; // req.file.path ahora es la URL de Cloudinary
        await user.save();
        res.status(200).json({ profileImage: user.profileImage });
    } catch (error) {
        res.status(500).send('Error al subir la imagen de perfil: ' + error.message);
    }
});

app.delete('/api/profile/image', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.profileImage) return res.status(404).send('No hay imagen de perfil para eliminar.');

        // TODO: Eliminar imagen de Cloudinary (user.profileImage)
        
        user.profileImage = undefined; 
        await user.save();
        res.status(200).send('Imagen de perfil eliminada.');
    } catch (error) {
        res.status(500).send('Error al eliminar imagen de perfil: ' + error.message);
    }
});

// --- API: Gestión de Galería (MODIFICADA) ---
app.post('/api/profile/gallery', protect, upload.array('galleryImages', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No se subieron archivos.');
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado.');

        const newImageUrls = req.files.map(file => file.path); // URLs de Cloudinary
        user.galleryImages.push(...newImageUrls);
        await user.save();
        res.status(200).json(user.galleryImages); 
    } catch (error) {
        res.status(500).send('Error al subir imágenes: ' + error.message);
    }
});

app.delete('/api/profile/gallery', protect, async (req, res) => {
    const { imageUrl } = req.body; 
    if (!imageUrl) return res.status(400).send('URL de imagen requerida.');
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado.');

        user.galleryImages = user.galleryImages.filter(img => img !== imageUrl);
        await user.save();
        
        // TODO: Eliminar imagen de Cloudinary (imageUrl)
        
        res.status(200).send('Imagen eliminada.');
    } catch (error) {
        res.status(500).send('Error al eliminar imagen: ' + error.message);
    }
});


// --- API CRUD: Gestión de Productos (MODIFICADA) ---
app.post('/api/products', protect, isProducer, upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).send('La imagen del producto es obligatoria.');
    const imageUrl = req.file.path; // URL de Cloudinary
    try {
        const newProduct = new Product({ ...req.body, imageUrl: imageUrl, owner: req.user.id });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).send('Error al crear producto: ' + error.message);
    }
});

app.get('/api/products/my', protect, async (req, res) => { /* ... (sin cambios) ... */ });
app.get('/api/products', async (req, res) => { /* ... (sin cambios) ... */ });
app.get('/api/products/:id', async (req, res) => { /* ... (sin cambios) ... */ });

app.put('/api/products/:id', protect, upload.single('imageFile'), async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Producto no encontrado.');
        if (product.owner.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).send('No autorizado.');
        const updatedData = { ...req.body };
        if (req.file) { 
            // TODO: Eliminar imagen antigua de Cloudinary (product.imageUrl)
            updatedData.imageUrl = req.file.path; // Nueva URL de Cloudinary
        }
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
        if (!updatedProduct) return res.status(404).send('No se pudo actualizar.');
        res.status(200).json(updatedProduct);
    } catch (error) { res.status(500).send('Error al actualizar producto.'); }
});

app.delete('/api/products/:id', protect, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Producto no encontrado.');
        if (product.owner.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).send('No autorizado.');
        
        // TODO: Eliminar imagen de Cloudinary (product.imageUrl)
        await Product.findByIdAndDelete(req.params.id);
        
        res.status(200).send('Producto eliminado.');
    } catch (error) { res.status(500).send('Error al eliminar producto.'); }
});

// --- API: Gestión de Ubicación (MODIFICADA) ---
app.get('/api/locations', async (req, res) => { /* ... (sin cambios) ... */ });
app.get('/api/locations/my-location', protect, isProducer, async (req, res) => { /* ... (sin cambios) ... */ });
app.post('/api/locations', protect, isProducer, upload.single('imageFile'), async (req, res) => { 
    const locationData = { ...req.body, owner: req.user.id };
    try {
        const existingLocation = await Location.findOne({ owner: req.user.id });
        if (req.file) {
            // TODO: Eliminar imagen antigua de Cloudinary (existingLocation.imageUrl)
            locationData.imageUrl = req.file.path; // URL de Cloudinary
        }
        
        if (existingLocation) {
            const updatedLocation = await Location.findByIdAndUpdate(existingLocation._id, locationData, { new: true, runValidators: true });
            res.status(200).json(updatedLocation);
        } else {
            const newLocation = new Location(locationData);
            await newLocation.save();
            res.status(201).json(newLocation);
        }
    } catch (error) {
         res.status(500).send('Error al guardar ubicación: ' + error.message);
    }
});

// --- API: Gestión de Usuarios (Admin) --- (Sin cambios)
app.get('/api/users', protect, isAdmin, async (req, res) => { /* ... (sin cambios) ... */ });
app.put('/api/users/:id/role', protect, isAdmin, async (req, res) => { /* ... (sin cambios) ... */ });
app.delete('/api/users/:id', protect, isAdmin, async (req, res) => { /* ... (sin cambios) ... */ });

// --- API CRUD: Gestión de Posts (Admin) (MODIFICADA) ---
app.post('/api/posts', protect, isAdmin, upload.single('imageFile'), async (req, res) => {
    const imageUrl = req.file ? req.file.path : null; // URL de Cloudinary
    const { title, content } = req.body;
    if (!title || !content) {
        // No es necesario borrar el archivo de /uploads, Cloudinary lo maneja
        return res.status(400).send('El título y el contenido son obligatorios.');
    }
    try {
        const newPost = new Post({ title, content, imageUrl: imageUrl, author: req.user.id });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        if (error.code === 11000) return res.status(409).send('Ya existe un post con este título.');
        res.status(500).send('Error al crear post: ' + error.message);
    }
});
app.put('/api/posts/:id', protect, isAdmin, upload.single('imageFile'), async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const updatedData = { ...req.body };
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send('Post no encontrado.');
        if (req.file) { 
            // TODO: Eliminar imagen antigua de Cloudinary (post.imageUrl)
            updatedData.imageUrl = req.file.path; 
        }
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).send('Error al actualizar post: ' + error.message);
    }
});
app.get('/api/posts/:id', async (req, res) => { /* ... (sin cambios) ... */ });
app.get('/api/posts', async (req, res) => { /* ... (sin cambios) ... */ });
app.delete('/api/posts/:id', protect, isAdmin, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).send('Post no encontrado.');
        
        // TODO: Eliminar imagen de Cloudinary (deletedPost.imageUrl)
        
        res.status(200).send('Post eliminado.');
    } catch (error) { res.status(500).send('Error al eliminar post.'); }
});

// **********************************************
// 6. INICIO DEL SERVIDOR
// **********************************************
app.listen(PORT, () => {
    console.log(`🚀 Servidor GranoCraft en ejecución en http://localhost:${PORT}`);
});