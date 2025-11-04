const mongoose = require('mongoose');

// Definición del Esquema para las Entradas de Blog
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio.'],
        trim: true,
        unique: true // Asegura que no haya dos posts con el mismo título
    },
    content: {
        type: String,
        required: [true, 'El contenido es obligatorio.']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    imageUrl: {
        type: String,
        required: false,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    }
}, {
    timestamps: true
});

// Middleware para generar el 'slug' automáticamente antes de guardar
postSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = this.title.toLowerCase()
                             .replace(/[^a-z0-9 -]/g, '')
                             .replace(/\s+/g, '-')
                             .replace(/-+/g, '-');
    }
    next();
});


// Exportar el modelo 'Post'
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
