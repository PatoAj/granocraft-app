const mongoose = require('mongoose');

// Definición del Esquema para las Entradas de Blog
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio.'], // Mensaje de error personalizado
        trim: true,
        unique: true // Asegura que no haya dos posts con el mismo título
    },
    content: {
        type: String,
        required: [true, 'El contenido es obligatorio.']
    },
    // Vincula el post con el usuario que lo creó (debe ser un 'admin')
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Referencia a la colección 'User'
    },
    imageUrl: { // URL de una imagen opcional para el post
        type: String,
        required: false, // No es obligatorio
        trim: true
    },
    // Añadimos un campo 'slug' para URLs amigables (opcional pero bueno para SEO)
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true // Optimiza búsquedas por slug
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});

// Middleware para generar el 'slug' automáticamente antes de guardar
postSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        // Convierte el título a un formato URL (ej: "Mi Título" -> "mi-titulo")
        this.slug = this.title.toLowerCase()
                             .replace(/[^a-z0-9 -]/g, '') // Elimina caracteres no válidos
                             .replace(/\s+/g, '-')       // Reemplaza espacios con guiones
                             .replace(/-+/g, '-');      // Elimina guiones duplicados
    }
    next();
});


// Exportar el modelo 'Post'
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
