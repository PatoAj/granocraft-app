const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('./auth');

// =========================================================================
//                             R U T A S  D E  U S U A R I O S (A D M I N)
// =========================================================================

// 1. GET /api/users (Privado - Solo Admin) - Obtener todos los usuarios
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        // Busca todos los usuarios, excluyendo el campo 'password' por seguridad
        const users = await User.find().select('-password'); 
        res.json(users);
    } catch (err) {
        res.status(500).send('Error al obtener la lista de usuarios: ' + err.message);
    }
});

// 2. PUT /api/users/:id/role (Cambiar rol)
router.put('/:id/role', verifyToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['producer', 'admin'].includes(role)) {
            return res.status(400).send('Rol inválido.');
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { role }, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).send('Usuario no encontrado.');
        }
        res.json(updatedUser);
    } catch (err) {
        res.status(500).send('Error al actualizar el rol: ' + err.message);
    }
});


// 3. DELETE /api/users/:id (Eliminar usuario)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).send('Usuario no encontrado para eliminar.');
        }

        res.status(200).send('Usuario eliminado exitosamente.');
    } catch (err) {
        res.status(500).send('Error al eliminar usuario.');
    }
});


module.exports = router;