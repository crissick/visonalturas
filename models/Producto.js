/*
 3. PRODUCTOS
==========================================================================
*/
const mongoose = require("mongoose");

const productos_tabla = new mongoose.Schema({
    id_producto: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    version: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    }
});

const ProductoModel = mongoose.model("producto", productos_tabla, "productos");

module.exports = ProductoModel;
