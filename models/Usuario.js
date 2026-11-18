/*
 2. USUARIOS
==========================================================================
*/
const mongoose = require("mongoose");

const usuarios_tabla = new mongoose.Schema({
    id_usuario: {
        type: String,
        required: true,
        unique: true
    },
    cedula: {
        type: Number,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    nombres_anteriores: {
        type: [String]
    },
    clave: {
        type: String,
        required: true
    },
    telefono: {
        type: String
    },
    correo: {
        type: String,
        required: true,
        unique: true
    },
    id_rol: {
        type: Number,
        default: 3
    },
    sesion: {
        type: Number,
        default: 0
    }
});

const UsuarioModel = mongoose.model("usuario", usuarios_tabla, "usuarios");

module.exports = UsuarioModel;
