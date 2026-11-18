/*
 5. COMPARTIDOS
==========================================================================
*/
const mongoose = require("mongoose");

const compartidos_tabla = new mongoose.Schema({
    id_compartido: {
        type: String,
        required: true,
        unique: true
    },
    serial: {
        type: String,
        required: true
    },
    id_usuario: {
        type: String,
        required: true
    },
    permiso: {
        type: String,
        default: "ver"
    }
});

const CompartidoModel = mongoose.model("compartido", compartidos_tabla, "compartidos");

module.exports = CompartidoModel;
