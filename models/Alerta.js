/*
 7. ALERTAS
==========================================================================
*/
const mongoose = require("mongoose");

const alertas_tabla = new mongoose.Schema({
    id_alerta: {
        type: String,
        required: true,
        unique: true
    },
    id_deteccion: {
        type: String,
        required: true
    },
    serial: {
        type: String,
        required: true
    },
    nivel: {
        type: String
    },
    estado: {
        type: String,
        default: "activa"
    },
    desactivada_por: {
        type: String
    },
    intentos_fallidos: {
        type: Number,
        default: 0
    },
    comentario: {
        type: String
    },
    fecha_hora: {
        type: Date,
        default: Date.now
    },
    fecha_desactivacion: {
        type: Date
    }
});

const AlertaModel = mongoose.model("alerta", alertas_tabla, "alertas");

module.exports = AlertaModel;
