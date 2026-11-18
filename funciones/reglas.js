/*
 REGLAS DEL PRODUCTO
==========================================================================
*/
const path = require('path');

// ROLES
const ROL_ADMIN = 1;
const ROL_CON_PRODUCTO = 2;
const ROL_SIN_PRODUCTO = 3;
const ROL_SOCIO = 4;

// PERMISOS SOBRE UN DISPOSITIVO
const PERMISO_DUENO = "dueno";
const PERMISO_CONTROLAR = "controlar";
const PERMISO_VER = "ver";

// TIPOS DE TOKEN
const TOKEN_USUARIO = "usuario";
const TOKEN_EQUIPO = "equipo";

// CLAVE DE DESARME
const BITS_DESARME = 5;
const CLAVE_DESARME_MAX = Math.pow(2, BITS_DESARME) - 1;

// LIMITES
const MAX_INVITADOS = 3;
const MAX_CONTACTOS = 5;
const MAX_ORDENES = 20;
const MINUTOS_SIN_CONEXION = 10;

// LISTAS PERMITIDAS
const ACCIONES = ["encender_sirena", "apagar_sirena", "encender_luz", "apagar_luz", "apagar_alarma"];
const VERSIONES = ["bodega", "rascacielos", "centro comercial"];

// CARPETA DE FOTOS
const CARPETA_FOTOS = path.join(__dirname, "..", "fotos");


/*
 EXPORTAR
==========================================================================
*/
module.exports = {
    ROL_ADMIN,
    ROL_CON_PRODUCTO,
    ROL_SIN_PRODUCTO,
    ROL_SOCIO,
    PERMISO_DUENO,
    PERMISO_CONTROLAR,
    PERMISO_VER,
    TOKEN_USUARIO,
    TOKEN_EQUIPO,
    BITS_DESARME,
    CLAVE_DESARME_MAX,
    MAX_INVITADOS,
    MAX_CONTACTOS,
    MAX_ORDENES,
    MINUTOS_SIN_CONEXION,
    ACCIONES,
    VERSIONES,
    CARPETA_FOTOS
};
