/*
 FUNCIONES DE AYUDA
==========================================================================
*/
const crypto = require('crypto');

// MODELOS
const RolModel = require('../models/Rol');
const UsuarioModel = require('../models/Usuario');
const DispositivoModel = require('../models/Dispositivo');
const CompartidoModel = require('../models/Compartido');

// REGLAS
const { ROL_ADMIN, ROL_CON_PRODUCTO, ROL_SIN_PRODUCTO, ROL_SOCIO, PERMISO_DUENO, BITS_DESARME, MINUTOS_SIN_CONEXION } = require('./reglas');


/*
 TEXTOS Y ERRORES
==========================================================================
*/

function traducirError(err) {
    if(err.code == 11000){
        return "el dato ya se encuentra registrado";
    }else if(err.name == "ValidationError" || err.name == "CastError"){
        return "datos invalidos";
    }else{
        return "no se pudo completar la solicitud";
    }
}

function texto(valor) {
    if(typeof valor == "string" || typeof valor == "number"){
        return String(valor).trim();
    }
    return "";
}

function escaparTexto(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/*
 CODIGOS Y CLAVES
==========================================================================
*/

function crearId(prefijo) {
    return prefijo + "-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

function crearCodigo() {
    const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";
    for(let i = 0; i < 6; i++){
        codigo += letras[crypto.randomInt(letras.length)];
    }
    return codigo;
}

function huellaCodigo(codigo, llave) {
    return crypto.createHmac("sha256", llave).update(texto(codigo).toUpperCase()).digest("hex");
}

function rutaVideo(serial, llave) {
    let huella = crypto.createHmac("sha256", llave).update("video-" + texto(serial).toUpperCase()).digest("hex");
    return texto(serial).toLowerCase() + "-" + huella.substring(0, 16);
}

async function crearCodigoUnico(llave) {
    let codigo = crearCodigo();
    let query = { "huella_codigo" : huellaCodigo(codigo, llave) };
    while(await DispositivoModel.exists(query)){
        codigo = crearCodigo();
        query = { "huella_codigo" : huellaCodigo(codigo, llave) };
    }
    return codigo;
}

async function siguienteSerial() {
    let query = { "serial" : { $regex : /^VA-\d{6}$/ } };
    const ultimodb = await DispositivoModel.findOne(query).sort({ serial : -1 });
    let numero = 1;
    if(ultimodb){
        numero = Number(ultimodb.serial.slice(3)) + 1;
    }
    return "VA-" + String(numero).padStart(6, "0");
}

function crearClaveEquipo() {
    return crypto.randomBytes(12).toString("hex");
}

function claveEnBits(numero) {
    let bits = numero.toString(2).padStart(BITS_DESARME, "0");
    return bits.split("").map(b =>{
        if(b == "1"){
            return 1;
        }
        return 0;
    });
}


/*
 FECHAS Y CONEXION
==========================================================================
*/

function leerFecha(valor, fin) {
    let entrada = valor;
    if(valor.length == 10){
        entrada = valor + "T00:00:00-05:00";
    }
    let fecha = new Date(entrada);
    if(isNaN(fecha)){
        return null;
    }
    if(fin && valor.length == 10){
        fecha.setDate(fecha.getDate() + 1);
    }
    return fecha;
}

function desdeVinculacion(dispositivo) {
    if(dispositivo && dispositivo.fecha_vinculacion){
        return { $gte : dispositivo.fecha_vinculacion };
    }
    return { $gte : new Date(0) };
}

function estadoConexion(dispositivo) {
    let limite = Date.now() - MINUTOS_SIN_CONEXION * 60 * 1000;
    if(dispositivo.ultima_conexion && dispositivo.ultima_conexion.getTime() > limite){
        return "en línea";
    }
    return "sin conexión";
}

async function marcarConexion(serial) {
    let query = { "serial" : serial };
    let cambios = {
        conexion : "en línea",
        ultima_conexion : new Date()
    }
    await DispositivoModel.updateOne(query, cambios);
}


/*
 LO QUE SE MUESTRA
==========================================================================
*/

function vistaDispositivo(dispositivo, producto, permiso) {
    let nombre_producto = dispositivo.id_producto;
    let version = "";
    if(producto){
        nombre_producto = producto.nombre;
        version = producto.version;
    }
    return {
        serial : dispositivo.serial,
        producto : nombre_producto,
        version : version,
        nombre : dispositivo.nombre,
        ubicacion : dispositivo.ubicacion,
        bateria : dispositivo.bateria,
        alimentacion : dispositivo.alimentacion,
        conexion : estadoConexion(dispositivo),
        ultima_conexion : dispositivo.ultima_conexion,
        fecha_vinculacion : dispositivo.fecha_vinculacion,
        tiene_clave_desarme : dispositivo.clave_desarme != null,
        reaccion : vistaReaccion(dispositivo),
        permiso : permiso
    }
}

function vistaReaccion(dispositivo) {
    let reaccion = {
        rele_1 : true,
        rele_2 : true,
        segundos : 30
    }
    if(dispositivo.reaccion){
        reaccion.rele_1 = dispositivo.reaccion.rele_1;
        reaccion.rele_2 = dispositivo.reaccion.rele_2;
        reaccion.segundos = dispositivo.reaccion.segundos;
    }
    return reaccion;
}

function vistaContactos(dispositivo) {
    return dispositivo.contactos_de_llamada.map((c, i) =>({
        id_contacto : c._id,
        orden : i + 1,
        nombre : c.nombre,
        telefono : c.telefono
    }));
}

function buscarProducto(productos, id_producto) {
    return productos.find(p => p.id_producto == id_producto);
}


/*
 PERMISOS Y DUEÑOS
==========================================================================
*/

async function permisoSobre(dispositivodb, decoded) {
    if(dispositivodb == null){
        return null;
    }
    if(decoded.id_rol == ROL_ADMIN || dispositivodb.id_usuario == decoded.id_usuario){
        return PERMISO_DUENO;
    }
    let query = { "serial" : dispositivodb.serial, "id_usuario" : decoded.id_usuario };
    const compartidodb = await CompartidoModel.findOne(query);
    if(compartidodb){
        return compartidodb.permiso;
    }
    return null;
}

async function misDispositivos(id_usuario) {
    let query = { "id_usuario" : id_usuario };
    const propios = await DispositivoModel.find(query);
    const compartidos = await CompartidoModel.find(query);

    let query_compartidos = { "serial" : { $in : compartidos.map(c => c.serial) } };
    const invitado = await DispositivoModel.find(query_compartidos);
    return propios.concat(invitado);
}

async function desvincular(dispositivodb) {
    let dueno_anterior = dispositivodb.id_usuario;

    dispositivodb.id_usuario = null;
    dispositivodb.nombre = "";
    dispositivodb.ubicacion = "";
    dispositivodb.contactos_de_llamada = [];
    dispositivodb.clave_desarme = null;
    dispositivodb.ordenes = [];
    dispositivodb.fecha_vinculacion = null;
    await dispositivodb.save();

    let query = { "serial" : dispositivodb.serial };
    await CompartidoModel.deleteMany(query);
    await actualizarRol(dueno_anterior);
}

async function actualizarRol(id_usuario) {
    let query = { "id_usuario" : id_usuario };
    const usuariodb = await UsuarioModel.findOne(query);

    if(usuariodb && (usuariodb.id_rol == ROL_CON_PRODUCTO || usuariodb.id_rol == ROL_SIN_PRODUCTO)){
        const cantidad = await DispositivoModel.countDocuments(query);
        if(cantidad > 0){
            usuariodb.id_rol = ROL_CON_PRODUCTO;
        }else{
            usuariodb.id_rol = ROL_SIN_PRODUCTO;
        }
        await usuariodb.save();
    }
}

async function crearRoles() {
    let roles = [
        { id_rol : ROL_ADMIN, nombre_rol : "administrador" },
        { id_rol : ROL_CON_PRODUCTO, nombre_rol : "cliente con producto" },
        { id_rol : ROL_SIN_PRODUCTO, nombre_rol : "cliente sin producto" },
        { id_rol : ROL_SOCIO, nombre_rol : "socio de mantenimiento" }
    ];

    for(let rol of roles){
        let query = { "id_rol" : rol.id_rol };
        const roldb = await RolModel.findOne(query);
        if(roldb == null){
            let registro = new RolModel(rol);
            await registro.save();
            console.log("rol creado: " + rol.nombre_rol);
        }
    }
}


/*
 EXPORTAR
==========================================================================
*/
module.exports = {
    traducirError,
    texto,
    escaparTexto,
    crearId,
    crearCodigo,
    huellaCodigo,
    crearCodigoUnico,
    siguienteSerial,
    crearClaveEquipo,
    claveEnBits,
    leerFecha,
    desdeVinculacion,
    marcarConexion,
    vistaDispositivo,
    vistaReaccion,
    rutaVideo,
    vistaContactos,
    buscarProducto,
    permisoSobre,
    misDispositivos,
    desvincular,
    actualizarRol,
    crearRoles
};
