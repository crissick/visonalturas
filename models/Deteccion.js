/*
 6. DETECCIONES
==========================================================================
*/
const mongoose = require("mongoose");

const detecciones_tabla = new mongoose.Schema({
    id_deteccion: {
        type: String,
        required: true,
        unique: true
    },
    serial: {
        type: String,
        required: true
    },
    fecha_hora: {
        type: Date,
        default: Date.now
    },
    tipo_objeto: {
        type: String
    },
    cerca_zona: {
        type: Boolean
    },
    dentro_zona: {
        type: Boolean
    },
    foto_url: {
        type: String
    }
});

const DeteccionModel = mongoose.model("deteccion", detecciones_tabla, "detecciones");

module.exports = DeteccionModel;
