// GranoCraft/server.js (Versión Final Completa)

// 1. IMPORTACIONES
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const fs = require('fs'); 
require('dotenv').config();

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

// 3. CONEXIÓN A MONGODB
mongoose.connect(DB_URL)
    .then(() => console.log('✅ Conexión exitosa a MongoDB.'))
    .catch(err => {
        console.error('❌ Error de conexión a la Base de Datos:', err.message);
    });

// 4. MIDDLEWARE BASE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE MULTER ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Carpeta "uploads" creada.');
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')); }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { cb(null, true); } 
    else { cb(new Error('Solo se permiten archivos de imagen.'), false); }
};
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname))); 

// --- Middlewares de Autenticación y Roles  ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_LITERAL_SECRET);
            
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).send('No autorizado, usuario no encontrado.');
            }
            
            req.user = user; 
            next(); 
        } catch (error) {
            console.error('Fallo de verificación JWT:', error.message);
            return res.status(401).send('No autorizado, token fallido o expirado.'); 
        }
    } else {
        return res.status(401).send('No autorizado, no hay token.');
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') { next(); } 
    else { res.status(403).send('Acción no autorizada. Requiere rol de administrador.'); }
};

const isProducer = (req, res, next) => {
    if (req.user && req.user.role === 'producer') { next(); } 
    else { res.status(403).send('Acción no autorizada. Requiere rol de productor.'); }
};


// **********************************************
// 5. RUTAS (APIs)
// **********************************************

// --- Rutas de Autenticación ---
app.post('/register', async (req, res) => { 
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('El correo electrónico ya está registrado.');
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword }); 
        await newUser.save();
        res.status(201).send('¡Usuario registrado exitosamente! Ya puedes iniciar sesión.');
    } catch (error) {
        res.status(500).send('Error interno del servidor durante el registro.');
    }
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).send('Credenciales inválidas (usuario no encontrado).');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Credenciales inválidas (contraseña incorrecta).');
        const payload = { id: user._id, role: user.role, email: user.email }; 
        const token = jwt.sign(payload, JWT_LITERAL_SECRET, { expiresIn: '7d' });
        res.status(200).json({ message: 'Inicio de sesión exitoso.', token: token, role: user.role });
    } catch (error){
        res.status(500).send('Error interno del servidor.');
    }
});

// --- RUTA PÚBLICA: Perfil de Productor ---
app.get('/api/public/profile/:id', async (req, res) => {
    try {
        const producer = await User.findById(req.params.id).select('producerNamePublic bio contact email profileImage galleryImages');
        if (!producer) return res.status(404).send('Productor no encontrado.');
        res.json(producer);
    } catch (error) {
        res.status(500).send('Error interno del servidor al buscar perfil.');
    }
});

// --- API: Gestión de Perfil ---
app.get('/api/profile', protect, async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).send('Error al obtener perfil.');
    }
});
app.put('/api/profile', protect, async (req, res) => { 
    try {
        const updates = req.body;
        delete updates.role;
        delete updates.email;
        delete updates.profileImage;
        delete updates.galleryImages;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, { $set: updates }, { new: true, runValidators: true }
        ).select('-password');
        if (!updatedUser) return res.status(404).send('Usuario no encontrado.');
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).send('Error al actualizar perfil: ' + error.message);
    }
});

// --- API: Gestión de Imagen de Perfil/Logo ---
app.post('/api/profile/image', protect, upload.single('profileImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo.');
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado.');
        if (user.profileImage && fs.existsSync(user.profileImage)) {
            fs.unlinkSync(user.profileImage);
        }
        user.profileImage = req.file.path.replace(/\\/g, "/"); 
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
        if (fs.existsSync(user.profileImage)) {
            fs.unlinkSync(user.profileImage);
        }
        user.profileImage = undefined; 
        await user.save();
        res.status(200).send('Imagen de perfil eliminada.');
    } catch (error) {
        res.status(500).send('Error al eliminar imagen de perfil: ' + error.message);
    }
});

// --- API: Gestión de Galería (Carrusel) ---
app.post('/api/profile/gallery', protect, upload.array('galleryImages', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No se subieron archivos.');
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado.');
        const newImageUrls = req.files.map(file => file.path.replace(/\\/g, "/"));
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
        if (fs.existsSync(imageUrl)) {
            fs.unlinkSync(imageUrl);
        }
        res.status(200).send('Imagen eliminada.');
    } catch (error) {
        res.status(500).send('Error al eliminar imagen: ' + error.message);
    }
});

// --- API CRUD: Gestión de Productos ---
app.post('/api/products', protect, isProducer, upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).send('La imagen del producto es obligatoria.');
    const imageUrl = req.file.path.replace(/\\/g, "/");
    try {
        const newProduct = new Product({ ...req.body, imageUrl: imageUrl, owner: req.user.id });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).send('Error al crear producto: ' + error.message);
    }
});
app.get('/api/products/my', protect, async (req, res) => {
    try {
        let products;
        if (req.user.role === 'admin') {
            products = await Product.find({}).populate('owner', 'email').sort({ createdAt: -1 }); 
        } else { 
            products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 }); 
        }
        res.status(200).json(products);
    } catch (error) { res.status(500).send('Error al obtener productos.'); }
});
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({})
            .populate({
                path: 'owner',
                select: 'producerNamePublic contact email _id profileImage', 
            })
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).send('Error al obtener productos.');
    }
});
app.get('/api/products/:id', async (req, res) => { 
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Producto no encontrado.');
        res.status(200).json(product);
    } catch (error) { res.status(500).send('Error al obtener producto.'); }
});
app.put('/api/products/:id', protect, upload.single('imageFile'), async (req, res) => { 
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Producto no encontrado.');
        if (product.owner.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).send('No autorizado.');
        const updatedData = { ...req.body };
        if (req.file) { 
            if (product.imageUrl && fs.existsSync(product.imageUrl)) fs.unlinkSync(product.imageUrl);
            updatedData.imageUrl = req.file.path.replace(/\\/g, "/"); 
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
        if (product.imageUrl && fs.existsSync(product.imageUrl)) fs.unlinkSync(product.imageUrl);
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).send('Producto eliminado.');
    } catch (error) { res.status(500).send('Error al eliminar producto.'); }
});

// --- API: Gestión de Ubicación (PRODUCTOR) ---
app.get('/api/locations', async (req, res) => { 
     try {
         const locations = await Location.find({}).populate('owner', 'producerNamePublic _id');
         res.status(200).json(locations);
     } catch (error) { res.status(500).send('Error al obtener ubicaciones.'); }
});
app.get('/api/locations/my-location', protect, isProducer, async (req, res) => { 
     try {
         const location = await Location.findOne({ owner: req.user.id });
         res.status(200).json(location || {}); 
     } catch (error) { res.status(500).send('Error al obtener ubicación.'); }
});
app.post('/api/locations', protect, isProducer, upload.single('imageFile'), async (req, res) => { 
     const locationData = { ...req.body, owner: req.user.id };
     try {
         const existingLocation = await Location.findOne({ owner: req.user.id });
        if (req.file) {
            if (existingLocation && existingLocation.imageUrl && fs.existsSync(existingLocation.imageUrl)) {
                fs.unlinkSync(existingLocation.imageUrl);
            }
            locationData.imageUrl = req.file.path.replace(/\\/g, "/");
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


// --- NUEVO: API: Gestión de Ubicaciones (ADMIN) ---

// GET Todas las ubicaciones (para el panel de admin)
app.get('/api/admin/locations', protect, isAdmin, async (req, res) => {
    try {
        const locations = await Location.find({}).populate('owner', 'email');
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).send('Error al obtener ubicaciones de admin.');
    }
});

// POST Crear una ubicación como Admin (sin dueño)
app.post('/api/admin/locations', protect, isAdmin, upload.single('imageFile'), async (req, res) => {
    const locationData = { ...req.body };
    locationData.owner = undefined; 
    
    if (req.file) {
        locationData.imageUrl = req.file.path.replace(/\\/g, "/");
    }

    try {
        const newLocation = new Location(locationData);
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        res.status(500).send('Error al crear ubicación: ' + error.message);
    }
});

// DELETE Eliminar una ubicación (Admin)
app.delete('/api/admin/locations/:id', protect, isAdmin, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) return res.status(404).send('Ubicación no encontrada.');
        
        // Borrar imagen si existe
        if (location.imageUrl && fs.existsSync(location.imageUrl)) {
            fs.unlinkSync(location.imageUrl);
        }
        res.status(200).send('Ubicación eliminada.');
    } catch (error) {
        res.status(500).send('Error al eliminar ubicación.');
    }
});


// --- API: Gestión de Usuarios (Admin) ---
app.get('/api/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send('Error al obtener usuarios.');
    }
});
app.put('/api/users/:id/role', protect, isAdmin, async (req, res) => { 
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID de usuario inválido.');
    try {
        const { role } = req.body;
        if (!['producer', 'admin'].includes(role)) return res.status(400).send('Rol inválido.');
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, { role }, { new: true, runValidators: true }
        ).select('-password');
        if (!updatedUser) return res.status(404).send('Usuario no encontrado.');
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).send('Error al actualizar el rol: ' + error.message);
    }
});
app.delete('/api/users/:id', protect, isAdmin, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID de usuario inválido.');
    try {
        const user = await User.findById(req.params.id);
        if (user && req.user && user._id.toString() === req.user.id) {
            return res.status(403).send('No puedes eliminar tu propia cuenta desde el panel.');
        }
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).send('Usuario no encontrado.');
        res.status(200).send('Usuario eliminado exitosamente.');
    } catch (error) {
        res.status(500).send('Error al eliminar usuario.');
    }
});

// --- API CRUD: Gestión de Posts (Admin) ---
app.post('/api/posts', protect, isAdmin, upload.single('imageFile'), async (req, res) => { 
    const imageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const { title, content } = req.body;
    if (!title || !content) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).send('El título y el contenido son obligatorios.');
    }
    try {
        const newPost = new Post({ title, content, imageUrl: imageUrl, author: req.user.id });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
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
            if (post.imageUrl && fs.existsSync(post.imageUrl)) fs.unlinkSync(post.imageUrl);
            updatedData.imageUrl = req.file.path.replace(/\\/g, "/"); 
        }
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).send('Error al actualizar post: ' + error.message);
    }
});
app.get('/api/posts/:id', async (req, res) => { 
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const post = await Post.findById(req.params.id).populate('author', 'email producerNamePublic');
        if (!post) return res.status(404).send('Post no encontrado.');
        res.status(200).json(post);
    } catch (error) { res.status(500).send('Error al obtener post.'); }
});
app.get('/api/posts', async (req, res) => { 
    try {
        const posts = await Post.find({}).populate('author', 'email producerNamePublic').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).send('Error al obtener posts.');
    }
});
app.delete('/api/posts/:id', protect, isAdmin, async (req, res) => { 
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('ID inválido.');
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).send('Post no encontrado.');
        if (deletedPost.imageUrl && fs.existsSync(deletedPost.imageUrl)) {
            fs.unlinkSync(deletedPost.imageUrl);
        }
        res.status(200).send('Post eliminado.');
    } catch (error) { res.status(500).send('Error al eliminar post.'); }
});

// **********************************************
// 6. INICIO DEL SERVIDOR
// **********************************************
app.listen(PORT, () => {
    console.log(`🚀 Servidor GranoCraft en ejecución en http://localhost:${PORT}`);
});