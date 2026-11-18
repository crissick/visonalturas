/*
 1. ROLES
==========================================================================
*/
const mongoose = require("mongoose");

const roles_tabla = new mongoose.Schema({
    id_rol: {
        type: Number,
        required: true,
        unique: true
    },
    nombre_rol: {
        type: String,
        required: true
    }
});

const RolModel = mongoose.model("rol", roles_tabla, "roles");

module.exports = RolModel;
