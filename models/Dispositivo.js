/*
 4. DISPOSITIVOS
==========================================================================
*/
const mongoose = require("mongoose");

const dispositivos_tabla = new mongoose.Schema({
    serial: {
        type: String,
        required: true,
        unique: true
    },
    id_usuario: {
        type: String,
        default: null
    },
    id_producto: {
        type: String,
        required: true
    },
    codigo_vinculacion: {
        type: String,
        required: true
    },
    huella_codigo: {
        type: String,
        unique: true,
        sparse: true
    },
    clave_equipo: {
        type: String,
        required: true
    },
    clave_desarme: {
        type: String,
        default: null
    },
    reaccion: {
        rele_1: {
            type: Boolean,
            default: true
        },
        rele_2: {
            type: Boolean,
            default: false
        },
        segundos: {
            type: Number,
            default: 30
        }
    },
    nombre: {
        type: String
    },
    ubicacion: {
        type: String
    },
    contactos_de_llamada: [{
        nombre: {
            type: String
        },
        telefono: {
            type: String,
            required: true
        }
    }],
    bateria: {
        type: Number
    },
    alimentacion: {
        type: String
    },
    conexion: {
        type: String,
        default: "sin conexión"
    },
    ultima_conexion: {
        type: Date,
        default: null
    },
    fecha_vinculacion: {
        type: Date,
        default: null
    },
    ordenes: [{
        id_orden: {
            type: String
        },
        accion: {
            type: String
        },
        estado: {
            type: String
        },
        pedida_por: {
            type: String
        },
        fecha_hora: {
            type: Date,
            default: Date.now
        }
    }]
});

const DispositivoModel = mongoose.model("dispositivo", dispositivos_tabla, "dispositivos");

module.exports = DispositivoModel;
