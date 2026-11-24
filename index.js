/*
 SERVICIOS_VISION_DATABASE  Backend pagina Visi0n de Alturas
==========================================================================
*/
const env = require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;
app.use(express.json({ limit : "5mb" }));
const cors = require('cors');
app.use(cors({
    origin : '*',
    exposedHeaders : ['access-token']
}));
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// PALABRA CLAVE DEL TOKEN
app.set('llave', process.env.LLAVE_TOKEN);

/*
 CONEXION A MONGODB
==========================================================================
*/
const connectionstring = process.env.MONGO_URL;
const conectarDB = require('./db');

/*
 REGLAS DEL PRODUCTO
==========================================================================
*/
const {
    ROL_CON_PRODUCTO,
    ROL_SIN_PRODUCTO,
    PERMISO_DUENO,
    PERMISO_CONTROLAR,
    PERMISO_VER,
    TOKEN_USUARIO,
    TOKEN_EQUIPO,
    CLAVE_DESARME_MAX,
    MAX_INVITADOS,
    MAX_CONTACTOS,
    MAX_ORDENES,
    MINUTOS_SIN_CONEXION,
    ACCIONES,
    VERSIONES,
    CARPETA_FOTOS
} = require('./funciones/reglas');

fs.mkdirSync(CARPETA_FOTOS, { recursive : true });


/*
 MODELOS
==========================================================================
*/
const RolModel = require('./models/Rol');
const UsuarioModel = require('./models/Usuario');
const ProductoModel = require('./models/Producto');
const DispositivoModel = require('./models/Dispositivo');
const CompartidoModel = require('./models/Compartido');
const DeteccionModel = require('./models/Deteccion');
const AlertaModel = require('./models/Alerta');


/*
 AYUDAS
==========================================================================
*/
const {
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
    vistaContactos,
    buscarProducto,
    permisoSobre,
    misDispositivos,
    desvincular,
    actualizarRol
} = require('./funciones/funciones_ayudas');


/*
 RUTAS PROTEGIDAS
==========================================================================
*/
const {
    rutasProtegidas,
    rutasAdmin,
    rutasSoporte,
    rutasEquipo,
    crearToken
} = require('./funciones/middleware');


/*
 PRUEBA: EL SERVIDOR RESPONDE
==========================================================================
*/
app.get('/', (req, res) =>{
    console.log("He escuchado el request get");
    let payload = {
        mensaje : "Test OK"
    }
    res.send(payload);
});

app.get('/hola', (req, res) =>{
    console.log("Solicitó hola");
    let payload = {
        mensaje : "hola"
    }
    res.send(payload);
});


/*
 USUARIOS: REGISTRO
==========================================================================
*/
app.post('/registro', async (req, res) =>{
    let usuario = req.body;
    console.log("Solicitó registro");

    let payload = {
        mensaje : ""
    }

    if(usuario && texto(usuario.cedula) && texto(usuario.nombre) && texto(usuario.correo) && texto(usuario.clave)){

        if(texto(usuario.clave).length < 6){
            payload.mensaje = "la clave debe tener mínimo 6 caracteres";
            return res.send(payload);
        }

        usuario.id_usuario = crearId("USU");
        usuario.cedula = texto(usuario.cedula);
        usuario.nombre = texto(usuario.nombre);
        usuario.telefono = texto(usuario.telefono);
        usuario.correo = texto(usuario.correo).toLowerCase();
        usuario.clave = await bcrypt.hash(texto(usuario.clave), 10);
        usuario.nombres_anteriores = [];
        usuario.id_rol = ROL_SIN_PRODUCTO;

        let registro = new UsuarioModel(usuario);

        registro.save().then(item =>{
            console.log("usuario guardado en la base de datos");
            payload.mensaje = "registro correctamente guardado";
            res.send(payload);

        }).catch(err =>{
            console.log("error al guardar usuario");
            payload.mensaje = traducirError(err);
            res.send(payload);
        });

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 USUARIOS: LOGIN
==========================================================================
*/
app.post('/login', async (req, res) =>{
    let usuario = req.body;
    console.log("Solicitó login");

    if(usuario && texto(usuario.correo) && texto(usuario.clave)){
        let correo = texto(usuario.correo).toLowerCase();
        let clave = texto(usuario.clave);

        let query = { "correo" : correo };

        let payload = {
            mensaje : ""
        }

        try{
            const usuariodb = await UsuarioModel.findOne(query);

            if(usuariodb){
                let clave_en_db = usuariodb.clave;

                if(await bcrypt.compare(clave, clave_en_db)){
                    usuariodb.sesion = usuariodb.sesion + 1;
                    await usuariodb.save();

                    let datos_token = {
                        tipo : TOKEN_USUARIO,
                        id_usuario : usuariodb.id_usuario,
                        correo : usuariodb.correo,
                        id_rol : usuariodb.id_rol,
                        sesion : usuariodb.sesion
                    }
                    payload.check = true;
                    payload.mensaje = "login correcto";
                    const token = crearToken(datos_token, app.get('llave'));
                    payload.token = token;
                    res.send(payload);

                }else{
                    payload.mensaje = "usuario o clave incorrectos";
                    res.send(payload);
                }

            }else{
                payload.mensaje = "usuario o clave incorrectos";
                res.send(payload);
            }

        }catch(err){
            console.log("error en login");
            payload.mensaje = "error en login";
            res.send(payload);
        }

    }else{
        let payload = {
            mensaje : "faltan datos"
        }
        res.send(payload);
    }
});


/*
 USUARIOS: CERRAR SESIÓN
==========================================================================
*/
app.post('/logout', rutasProtegidas, async (req, res) =>{
    let id_usuario = req.decoded.id_usuario;
    console.log("Solicitó cerrar sesión");

    let query = { "id_usuario" : id_usuario };
    let payload = {
        mensaje : ""
    }

    try{
        const usuariodb = await UsuarioModel.findOne(query);

        if(usuariodb){
            usuariodb.sesion = usuariodb.sesion + 1;
            await usuariodb.save();
            payload.mensaje = "sesión cerrada";
        }else{
            payload.mensaje = "usuario no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al cerrar sesión");
        payload.mensaje = "error al cerrar sesión";
        res.send(payload);
    }
});


/*
 USUARIOS: MI PERFIL
==========================================================================
*/
app.get('/perfil', rutasProtegidas, async (req, res) =>{
    let id_usuario = req.decoded.id_usuario;
    console.log("Solicitó perfil");

    let query = { "id_usuario" : id_usuario };
    let ocultos = {
        clave : 0,
        sesion : 0,
        _id : 0,
        __v : 0
    }
    let payload = {
        mensaje : ""
    }

    try{
        const usuariodb = await UsuarioModel.findOne(query, ocultos);

        if(usuariodb){
            let query_rol = { "id_rol" : usuariodb.id_rol };
            const roldb = await RolModel.findOne(query_rol);

            payload.mensaje = "ok";
            payload.usuario = usuariodb;
            payload.rol = "";
            if(roldb){
                payload.rol = roldb.nombre_rol;
            }
            res.send(payload);

        }else{
            payload.mensaje = "usuario no encontrado";
            res.send(payload);
        }

    }catch(err){
        console.log("error al buscar perfil");
        payload.mensaje = "error al buscar perfil";
        res.send(payload);
    }
});


/*
 USUARIOS: CAMBIAR NOMBRE
==========================================================================
*/
app.put('/perfil/nombre', rutasProtegidas, async (req, res) =>{
    let usuario = req.body;
    console.log("Solicitó cambiar nombre");

    let payload = {
        mensaje : ""
    }

    if(usuario && texto(usuario.nombre)){
        let nombre = texto(usuario.nombre);
        let query = { "id_usuario" : req.decoded.id_usuario };

        try{
            const usuariodb = await UsuarioModel.findOne(query);

            if(usuariodb == null){
                payload.mensaje = "usuario no encontrado";
            }else if(usuariodb.nombre == nombre){
                payload.mensaje = "es el mismo nombre";
            }else{
                usuariodb.nombres_anteriores.push(usuariodb.nombre);
                usuariodb.nombre = nombre;
                await usuariodb.save();

                payload.mensaje = "nombre cambiado";
                payload.nombre = usuariodb.nombre;
                payload.nombres_anteriores = usuariodb.nombres_anteriores;
            }
            res.send(payload);

        }catch(err){
            console.log("error al cambiar nombre");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 MIS DISPOSITIVOS: VINCULAR
==========================================================================
*/
app.post('/vincular', rutasProtegidas, async (req, res) =>{
    let dispositivo = req.body;
    console.log("Solicitó vincular dispositivo");

    let payload = {
        mensaje : ""
    }

    if(dispositivo && texto(dispositivo.serial) && texto(dispositivo.codigo)){
        let serial = texto(dispositivo.serial).toUpperCase();
        let codigo = texto(dispositivo.codigo).toUpperCase();

        let query = { "serial" : serial };
        let query_usuario = { "id_usuario" : req.decoded.id_usuario };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const usuariodb = await UsuarioModel.findOne(query_usuario);

            if(usuariodb == null){
                payload.mensaje = "usuario no encontrado";

            }else if(dispositivodb == null || !(await bcrypt.compare(codigo, dispositivodb.codigo_vinculacion))){
                payload.mensaje = "serial o código incorrectos";

            }else if(dispositivodb.id_usuario){
                payload.mensaje = "este dispositivo ya tiene dueño";

            }else{
                let query_producto = { "id_producto" : dispositivodb.id_producto };
                const productodb = await ProductoModel.findOne(query_producto);

                dispositivodb.id_usuario = usuariodb.id_usuario;
                dispositivodb.nombre = texto(dispositivo.nombre) || productodb.nombre;
                dispositivodb.ubicacion = texto(dispositivo.ubicacion);
                dispositivodb.fecha_vinculacion = new Date();
                dispositivodb.contactos_de_llamada = [];
                if(usuariodb.telefono){
                    dispositivodb.contactos_de_llamada.push({ nombre : usuariodb.nombre, telefono : usuariodb.telefono });
                }
                await dispositivodb.save();
                await actualizarRol(usuariodb.id_usuario);

                console.log("dispositivo vinculado");
                payload.mensaje = "dispositivo vinculado";
                payload.dispositivo = vistaDispositivo(dispositivodb, productodb, PERMISO_DUENO);
            }
            res.send(payload);

        }catch(err){
            console.log("error al vincular dispositivo");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 MIS DISPOSITIVOS: LISTA
==========================================================================
*/
app.get('/listadispositivos', rutasProtegidas, async (req, res) =>{
    let id_usuario = req.decoded.id_usuario;
    console.log("Solicitó lista de dispositivos");

    let query = { "id_usuario" : id_usuario };
    let orden = {
        fecha_vinculacion : -1
    }
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivos = await DispositivoModel.find(query).limit(100).sort(orden);
        const productos = await ProductoModel.find({});

        payload.mensaje = "ok";
        payload.dispositivos = dispositivos.map(d => vistaDispositivo(d, buscarProducto(productos, d.id_producto), PERMISO_DUENO));
        res.send(payload);

    }catch(err){
        console.log("error al listar dispositivos");
        payload.mensaje = "error al listar dispositivos";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: INFORMACION
==========================================================================
*/
app.get('/dispositivo/:serial', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    console.log("Solicitó un dispositivo");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso){
            let query_producto = { "id_producto" : dispositivodb.id_producto };
            const productodb = await ProductoModel.findOne(query_producto);

            payload.mensaje = "ok";
            payload.dispositivo = vistaDispositivo(dispositivodb, productodb, permiso);
        }else{
            payload.mensaje = "dispositivo no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al buscar dispositivo");
        payload.mensaje = "error al buscar dispositivo";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: NOMBRE Y UBICACION
==========================================================================
*/
app.put('/dispositivo/:serial/nombre', rutasProtegidas, async (req, res) =>{
    let dispositivo = req.body;
    let serial = req.params.serial;
    console.log("Solicitó cambiar nombre del dispositivo");

    let payload = {
        mensaje : ""
    }

    if(dispositivo && (texto(dispositivo.nombre) || dispositivo.ubicacion != undefined)){
        let query = { "serial" : serial };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const permiso = await permisoSobre(dispositivodb, req.decoded);

            if(permiso == null){
                payload.mensaje = "dispositivo no encontrado";
            }else if(permiso != PERMISO_DUENO){
                payload.mensaje = "solo el dueño puede hacer esto";
            }else{
                if(texto(dispositivo.nombre)){
                    dispositivodb.nombre = texto(dispositivo.nombre);
                }
                if(dispositivo.ubicacion != undefined){
                    dispositivodb.ubicacion = texto(dispositivo.ubicacion);
                }
                await dispositivodb.save();

                payload.mensaje = "dispositivo actualizado";
                payload.nombre = dispositivodb.nombre;
                payload.ubicacion = dispositivodb.ubicacion;
            }
            res.send(payload);

        }catch(err){
            console.log("error al cambiar nombre del dispositivo");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: DESVINCULAR
==========================================================================
*/
app.delete('/borrardispositivo/:serial', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    console.log("Solicitó desvincular dispositivo");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null || dispositivodb.id_usuario == null){
            payload.mensaje = "dispositivo no encontrado";
        }else if(permiso != PERMISO_DUENO){
            payload.mensaje = "solo el dueño puede hacer esto";
        }else{
            await desvincular(dispositivodb);
            payload.mensaje = "dispositivo desvinculado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al desvincular dispositivo");
        payload.mensaje = "error al desvincular dispositivo";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: CONTACTOS DE LLAMADA
==========================================================================
*/
app.get('/dispositivo/:serial/contactos', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    console.log("Solicitó contactos de llamada");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null){
            payload.mensaje = "dispositivo no encontrado";
        }else if(permiso != PERMISO_DUENO){
            payload.mensaje = "solo el dueño puede hacer esto";
        }else{
            payload.mensaje = "ok";
            payload.contactos = vistaContactos(dispositivodb);
        }
        res.send(payload);

    }catch(err){
        console.log("error al listar contactos");
        payload.mensaje = "error al listar contactos";
        res.send(payload);
    }
});


app.post('/dispositivo/:serial/contactos', rutasProtegidas, async (req, res) =>{
    let contacto = req.body;
    let serial = req.params.serial;
    console.log("Solicitó agregar contacto");

    let payload = {
        mensaje : ""
    }

    if(contacto && texto(contacto.nombre) && texto(contacto.telefono)){
        let query = { "serial" : serial };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const permiso = await permisoSobre(dispositivodb, req.decoded);

            if(permiso == null){
                payload.mensaje = "dispositivo no encontrado";
            }else if(permiso != PERMISO_DUENO){
                payload.mensaje = "solo el dueño puede hacer esto";
            }else if(dispositivodb.contactos_de_llamada.length >= MAX_CONTACTOS){
                payload.mensaje = "máximo " + MAX_CONTACTOS + " contactos";
            }else{
                let registro = {
                    nombre : texto(contacto.nombre),
                    telefono : texto(contacto.telefono)
                }
                dispositivodb.contactos_de_llamada.push(registro);
                await dispositivodb.save();

                payload.mensaje = "contacto agregado";
                payload.contactos = vistaContactos(dispositivodb);
            }
            res.send(payload);

        }catch(err){
            console.log("error al agregar contacto");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


app.delete('/dispositivo/:serial/contactos/:id_contacto', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    let id_contacto = req.params.id_contacto;
    console.log("Solicitó quitar contacto");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null){
            payload.mensaje = "dispositivo no encontrado";
        }else if(permiso != PERMISO_DUENO){
            payload.mensaje = "solo el dueño puede hacer esto";
        }else{
            let antes = dispositivodb.contactos_de_llamada.length;
            dispositivodb.contactos_de_llamada = dispositivodb.contactos_de_llamada.filter(c => String(c._id) != id_contacto);

            if(dispositivodb.contactos_de_llamada.length == antes){
                payload.mensaje = "contacto no encontrado";
            }else{
                await dispositivodb.save();
                payload.mensaje = "contacto quitado";
                payload.contactos = vistaContactos(dispositivodb);
            }
        }
        res.send(payload);

    }catch(err){
        console.log("error al quitar contacto");
        payload.mensaje = "error al quitar contacto";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: INVITADOS
==========================================================================
*/
app.get('/dispositivo/:serial/invitados', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    console.log("Solicitó invitados");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null){
            payload.mensaje = "dispositivo no encontrado";
        }else if(permiso != PERMISO_DUENO){
            payload.mensaje = "solo el dueño puede hacer esto";
        }else{
            const compartidos = await CompartidoModel.find(query);

            let query_invitados = { "id_usuario" : { $in : compartidos.map(c => c.id_usuario) } };
            const invitados = await UsuarioModel.find(query_invitados);

            payload.mensaje = "ok";
            payload.invitados = compartidos.map(c =>{
                let invitadodb = invitados.find(u => u.id_usuario == c.id_usuario);
                let vista = {
                    id_compartido : c.id_compartido,
                    nombre : "",
                    correo : "",
                    permiso : c.permiso
                }
                if(invitadodb){
                    vista.nombre = invitadodb.nombre;
                    vista.correo = invitadodb.correo;
                }
                return vista;
            });
        }
        res.send(payload);

    }catch(err){
        console.log("error al listar invitados");
        payload.mensaje = "error al listar invitados";
        res.send(payload);
    }
});


app.post('/dispositivo/:serial/invitados', rutasProtegidas, async (req, res) =>{
    let invitado = req.body;
    let serial = req.params.serial;
    console.log("Solicitó agregar invitado");

    let payload = {
        mensaje : ""
    }

    let permiso_invitado = "";
    if(invitado){
        permiso_invitado = texto(invitado.permiso) || PERMISO_VER;
    }

    if(invitado && texto(invitado.correo) && (permiso_invitado == PERMISO_VER || permiso_invitado == PERMISO_CONTROLAR)){
        let correo = texto(invitado.correo).toLowerCase();

        let query = { "serial" : serial };
        let query_invitado = { "correo" : correo };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const permiso = await permisoSobre(dispositivodb, req.decoded);
            const invitadodb = await UsuarioModel.findOne(query_invitado);

            if(permiso == null){
                payload.mensaje = "dispositivo no encontrado";
            }else if(permiso != PERMISO_DUENO){
                payload.mensaje = "solo el dueño puede hacer esto";
            }else if(invitadodb == null){
                payload.mensaje = "ese correo no tiene cuenta";
            }else if(invitadodb.id_usuario == dispositivodb.id_usuario){
                payload.mensaje = "no te puedes invitar a ti mismo";
            }else if(await CompartidoModel.findOne({ "serial" : serial, "id_usuario" : invitadodb.id_usuario })){
                payload.mensaje = "esa persona ya es invitada";
            }else if(await CompartidoModel.countDocuments(query) >= MAX_INVITADOS){
                payload.mensaje = "máximo " + MAX_INVITADOS + " invitados; para más, contacta a la empresa";
            }else{
                let registro = new CompartidoModel({
                    id_compartido : crearId("COM"),
                    serial : serial,
                    id_usuario : invitadodb.id_usuario,
                    permiso : permiso_invitado
                });
                await registro.save();

                payload.mensaje = "invitado agregado";
                payload.id_compartido = registro.id_compartido;
            }
            res.send(payload);

        }catch(err){
            console.log("error al agregar invitado");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


app.delete('/dispositivo/:serial/invitados/:id_compartido', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    let id_compartido = req.params.id_compartido;
    console.log("Solicitó quitar invitado");

    let query = { "serial" : serial };
    let query_compartido = { "id_compartido" : id_compartido, "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null){
            payload.mensaje = "dispositivo no encontrado";
        }else if(permiso != PERMISO_DUENO){
            payload.mensaje = "solo el dueño puede hacer esto";
        }else{
            const borrado = await CompartidoModel.deleteOne(query_compartido);
            if(borrado.deletedCount > 0){
                payload.mensaje = "invitado quitado";
            }else{
                payload.mensaje = "invitado no encontrado";
            }
        }
        res.send(payload);

    }catch(err){
        console.log("error al quitar invitado");
        payload.mensaje = "error al quitar invitado";
        res.send(payload);
    }
});


/*
 COMPARTIDOS CONMIGO
==========================================================================
*/
app.get('/compartidos', rutasProtegidas, async (req, res) =>{
    let id_usuario = req.decoded.id_usuario;
    console.log("Solicitó compartidos conmigo");

    let query = { "id_usuario" : id_usuario };
    let payload = {
        mensaje : ""
    }

    try{
        const compartidos = await CompartidoModel.find(query);

        let query_dispositivos = { "serial" : { $in : compartidos.map(c => c.serial) } };
        const dispositivos = await DispositivoModel.find(query_dispositivos);

        let query_duenos = { "id_usuario" : { $in : dispositivos.map(d => d.id_usuario) } };
        const duenos = await UsuarioModel.find(query_duenos);
        const productos = await ProductoModel.find({});

        payload.mensaje = "ok";
        payload.dispositivos = dispositivos.map(d =>{
            let compartidodb = compartidos.find(c => c.serial == d.serial);
            let duenodb = duenos.find(u => u.id_usuario == d.id_usuario);
            let vista = vistaDispositivo(d, buscarProducto(productos, d.id_producto), compartidodb.permiso);
            vista.dueno = "";
            if(duenodb){
                vista.dueno = duenodb.nombre;
            }
            return vista;
        });
        res.send(payload);

    }catch(err){
        console.log("error al listar compartidos");
        payload.mensaje = "error al listar compartidos";
        res.send(payload);
    }
});


/*
 DENTRO DE UN DISPOSITIVO: CLAVE DE DESARME
==========================================================================
*/
app.put('/dispositivo/:serial/clave-desarme', rutasProtegidas, async (req, res) =>{
    let desarme = req.body;
    let serial = req.params.serial;
    console.log("Solicitó cambiar clave de desarme");

    let payload = {
        mensaje : ""
    }

    let clave = NaN;
    if(desarme){
        clave = Number(texto(desarme.clave));
    }

    if(desarme && texto(desarme.clave) != "" && Number.isInteger(clave) && clave >= 0 && clave <= CLAVE_DESARME_MAX){
        let query = { "serial" : serial };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const permiso = await permisoSobre(dispositivodb, req.decoded);

            if(permiso == null){
                payload.mensaje = "dispositivo no encontrado";
            }else if(permiso != PERMISO_DUENO){
                payload.mensaje = "solo el dueño puede hacer esto";
            }else{
                dispositivodb.clave_desarme = await bcrypt.hash(String(clave), 10);
                await dispositivodb.save();

                payload.mensaje = "clave de desarme guardada";
                payload.en_el_equipo = claveEnBits(clave);
            }
            res.send(payload);

        }catch(err){
            console.log("error al cambiar clave de desarme");
            payload.mensaje = "error al cambiar clave de desarme";
            res.send(payload);
        }

    }else{
        payload.mensaje = "la clave es un número de 0 a " + CLAVE_DESARME_MAX;
        res.send(payload);
    }
});


/*
 DETECCIONES: POR DISPOSITIVO
==========================================================================
*/
app.get('/detecciones/:serial', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    let desde = texto(req.query.desde);
    let hasta = texto(req.query.hasta);
    console.log("Solicitó detecciones de un dispositivo");

    let orden = {
        fecha_hora : -1
    }
    let payload = {
        mensaje : ""
    }

    let fecha_desde = null;
    let fecha_hasta = null;
    if(desde){
        fecha_desde = leerFecha(desde, false);
    }
    if(hasta){
        fecha_hasta = leerFecha(hasta, true);
    }
    if((desde && fecha_desde == null) || (hasta && fecha_hasta == null)){
        payload.mensaje = "fecha invalida";
        return res.send(payload);
    }

    let query_dispositivo = { "serial" : serial };

    try{
        const dispositivodb = await DispositivoModel.findOne(query_dispositivo);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso){
            let query = {
                "serial" : serial,
                "fecha_hora" : desdeVinculacion(dispositivodb)
            }
            if(fecha_desde && fecha_desde > query.fecha_hora.$gte){
                query.fecha_hora.$gte = fecha_desde;
            }
            if(fecha_hasta){
                query.fecha_hora.$lt = fecha_hasta;
            }

            const detecciones = await DeteccionModel.find(query, { _id : 0, __v : 0 }).limit(100).sort(orden);
            payload.mensaje = "ok";
            payload.detecciones = detecciones;
        }else{
            payload.mensaje = "dispositivo no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al listar detecciones");
        payload.mensaje = "error al listar detecciones";
        res.send(payload);
    }
});


/*
 DETECCIONES: VER LA FOTO
==========================================================================
*/
app.get('/foto/:id_deteccion', rutasProtegidas, async (req, res) =>{
    let id_deteccion = req.params.id_deteccion;
    console.log("Solicitó una foto");

    let query = { "id_deteccion" : id_deteccion };
    let payload = {
        mensaje : ""
    }

    try{
        const detecciondb = await DeteccionModel.findOne(query);
        let dispositivodb = null;
        if(detecciondb){
            dispositivodb = await DispositivoModel.findOne({ "serial" : detecciondb.serial });
        }
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null || detecciondb.fecha_hora < desdeVinculacion(dispositivodb).$gte){
            payload.mensaje = "foto no encontrada";
            return res.send(payload);
        }

        let ruta = path.join(CARPETA_FOTOS, detecciondb.id_deteccion + ".jpg");

        if(detecciondb.foto_url && fs.existsSync(ruta)){
            res.sendFile(ruta);
        }else{
            payload.mensaje = "esta deteccion no tiene foto";
            res.send(payload);
        }

    }catch(err){
        console.log("error al buscar foto");
        payload.mensaje = "error al buscar foto";
        res.send(payload);
    }
});


/*
 ALERTAS: AVISOS DE TODOS MIS DISPOSITIVOS
==========================================================================
*/
app.get('/alertas', rutasProtegidas, async (req, res) =>{
    let estado = texto(req.query.estado);
    console.log("Solicitó avisos");

    let orden = {
        fecha_hora : -1
    }
    let payload = {
        mensaje : "ok",
        alertas : []
    }

    try{
        const dispositivos = await misDispositivos(req.decoded.id_usuario);

        if(dispositivos.length > 0){
            let query = {
                $or : dispositivos.map(d =>({ serial : d.serial, fecha_hora : desdeVinculacion(d) }))
            }
            if(estado){
                query.estado = estado;
            }

            const alertas = await AlertaModel.find(query, { _id : 0, __v : 0 }).limit(100).sort(orden);
            payload.alertas = alertas.map(a =>{
                let vista = a.toObject();
                vista.nombre = dispositivos.find(d => d.serial == a.serial).nombre;
                return vista;
            });
        }
        res.send(payload);

    }catch(err){
        console.log("error al listar avisos");
        payload.mensaje = "error al listar avisos";
        res.send(payload);
    }
});


/*
 ALERTAS: POR DISPOSITIVO
==========================================================================
*/
app.get('/alertas/:serial', rutasProtegidas, async (req, res) =>{
    let serial = req.params.serial;
    let estado = texto(req.query.estado);
    console.log("Solicitó alertas de un dispositivo");

    let query_dispositivo = { "serial" : serial };
    let orden = {
        fecha_hora : -1
    }
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query_dispositivo);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso){
            let query = {
                "serial" : serial,
                "fecha_hora" : desdeVinculacion(dispositivodb)
            }
            if(estado){
                query.estado = estado;
            }

            const alertas = await AlertaModel.find(query, { _id : 0, __v : 0 }).limit(100).sort(orden);
            payload.mensaje = "ok";
            payload.alertas = alertas;
        }else{
            payload.mensaje = "dispositivo no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al listar alertas");
        payload.mensaje = "error al listar alertas";
        res.send(payload);
    }
});


/*
 ALERTAS: ATENDER CON COMENTARIO
==========================================================================
*/
app.put('/alertas/:id_alerta/atender', rutasProtegidas, async (req, res) =>{
    let alerta = req.body || {};
    let id_alerta = req.params.id_alerta;
    console.log("Solicitó atender alerta");

    let query = { "id_alerta" : id_alerta };
    let payload = {
        mensaje : ""
    }

    try{
        const alertadb = await AlertaModel.findOne(query);
        let dispositivodb = null;
        if(alertadb){
            dispositivodb = await DispositivoModel.findOne({ "serial" : alertadb.serial });
        }
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso == null){
            payload.mensaje = "alerta no encontrada";
        }else if(permiso == PERMISO_VER){
            payload.mensaje = "tu permiso es solo de ver";
        }else if(alertadb.estado != "activa"){
            payload.mensaje = "la alerta ya fue atendida";
        }else{
            alertadb.estado = "atendida";
            alertadb.desactivada_por = req.decoded.correo;
            alertadb.comentario = texto(alerta.comentario);
            alertadb.fecha_desactivacion = new Date();
            await alertadb.save();

            payload.mensaje = "alerta atendida";
            payload.alerta = {
                id_alerta : alertadb.id_alerta,
                estado : alertadb.estado,
                desactivada_por : alertadb.desactivada_por,
                comentario : alertadb.comentario,
                fecha_desactivacion : alertadb.fecha_desactivacion
            }
        }
        res.send(payload);

    }catch(err){
        console.log("error al atender alerta");
        payload.mensaje = "error al atender alerta";
        res.send(payload);
    }
});


/*
 ORDENES AL DISPOSITIVO: PEDIR
==========================================================================
*/
app.post('/ordenes', rutasProtegidas, async (req, res) =>{
    let orden = req.body;
    console.log("Solicitó una orden");

    let payload = {
        mensaje : ""
    }

    if(orden && texto(orden.serial) && ACCIONES.includes(texto(orden.accion))){
        let serial = texto(orden.serial);
        let accion = texto(orden.accion);
        let query = { "serial" : serial };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            const permiso = await permisoSobre(dispositivodb, req.decoded);

            if(permiso == null){
                payload.mensaje = "dispositivo no encontrado";
            }else if(permiso == PERMISO_VER){
                payload.mensaje = "tu permiso es solo de ver";
            }else{
                let registro = {
                    id_orden : crearId("ORD"),
                    accion : accion,
                    estado : "pendiente",
                    pedida_por : req.decoded.correo,
                    fecha_hora : new Date()
                }
                dispositivodb.ordenes.push(registro);
                if(dispositivodb.ordenes.length > MAX_ORDENES){
                    dispositivodb.ordenes.shift();
                }
                await dispositivodb.save();

                payload.mensaje = "orden enviada";
                payload.id_orden = registro.id_orden;
                payload.estado = registro.estado;
            }
            res.send(payload);

        }catch(err){
            console.log("error al pedir orden");
            payload.mensaje = "error al pedir orden";
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos; acciones: " + ACCIONES.join(", ");
        res.send(payload);
    }
});


/*
 ORDENES AL DISPOSITIVO: VER SI YA SE CUMPLIO
==========================================================================
*/
app.get('/ordenes/:id_orden', rutasProtegidas, async (req, res) =>{
    let id_orden = req.params.id_orden;
    console.log("Solicitó estado de una orden");

    let query = { "ordenes.id_orden" : id_orden };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);
        const permiso = await permisoSobre(dispositivodb, req.decoded);

        if(permiso){
            let ordendb = dispositivodb.ordenes.find(o => o.id_orden == id_orden);
            payload.mensaje = "ok";
            payload.orden = {
                id_orden : ordendb.id_orden,
                accion : ordendb.accion,
                estado : ordendb.estado,
                fecha_hora : ordendb.fecha_hora
            }
        }else{
            payload.mensaje = "orden no encontrada";
        }
        res.send(payload);

    }catch(err){
        console.log("error al buscar orden");
        payload.mensaje = "error al buscar orden";
        res.send(payload);
    }
});


/*
 LUCKFOX: LOGIN DEL EQUIPO
==========================================================================
*/
app.post('/equipo/login', async (req, res) =>{
    let equipo = req.body;
    console.log("Login de un equipo");

    if(equipo && texto(equipo.serial) && texto(equipo.clave_equipo)){
        let serial = texto(equipo.serial).toUpperCase();
        let clave_equipo = texto(equipo.clave_equipo);

        let query = { "serial" : serial };

        let payload = {
            mensaje : ""
        }

        try{
            const dispositivodb = await DispositivoModel.findOne(query);

            if(dispositivodb){
                let clave_en_db = dispositivodb.clave_equipo;

                if(await bcrypt.compare(clave_equipo, clave_en_db)){
                    let datos_token = {
                        tipo : TOKEN_EQUIPO,
                        serial : dispositivodb.serial
                    }
                    await marcarConexion(dispositivodb.serial);

                    payload.check = true;
                    payload.mensaje = "login correcto";
                    const token = crearToken(datos_token, app.get('llave'));
                    payload.token = token;
                    res.send(payload);

                }else{
                    payload.mensaje = "serial o clave incorrectos";
                    res.send(payload);
                }

            }else{
                payload.mensaje = "serial o clave incorrectos";
                res.send(payload);
            }

        }catch(err){
            console.log("error en login del equipo");
            payload.mensaje = "error en login";
            res.send(payload);
        }

    }else{
        let payload = {
            mensaje : "faltan datos"
        }
        res.send(payload);
    }
});


/*
 LUCKFOX: REPORTAR ESTADO
==========================================================================
*/
app.put('/equipo/estado', rutasEquipo, async (req, res) =>{
    let estado = req.body || {};
    let serial = req.decoded.serial;
    console.log("Estado de " + serial);

    let query = { "serial" : serial };
    let cambios = {
        conexion : "en línea",
        ultima_conexion : new Date()
    }
    let payload = {
        mensaje : ""
    }

    if(estado.bateria != undefined){
        let bateria = Number(texto(estado.bateria));
        if(texto(estado.bateria) == "" || isNaN(bateria) || bateria < 0 || bateria > 100){
            payload.mensaje = "la bateria va de 0 a 100";
            return res.send(payload);
        }
        cambios.bateria = bateria;
    }
    if(estado.alimentacion != undefined){
        if(texto(estado.alimentacion) != "bateria" && texto(estado.alimentacion) != "fuente"){
            payload.mensaje = "alimentacion: bateria o fuente";
            return res.send(payload);
        }
        cambios.alimentacion = texto(estado.alimentacion);
    }

    try{
        await DispositivoModel.updateOne(query, cambios);
        payload.mensaje = "estado guardado";
        res.send(payload);

    }catch(err){
        console.log("error al guardar estado");
        payload.mensaje = "error al guardar estado";
        res.send(payload);
    }
});


/*
 LUCKFOX: CONSULTAR ORDENES, CONTACTOS Y CLAVE DE DESARME
==========================================================================
*/
app.get('/equipo/ordenes', rutasEquipo, async (req, res) =>{
    let serial = req.decoded.serial;
    console.log("Consulta de " + serial);

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        await marcarConexion(serial);
        const dispositivodb = await DispositivoModel.findOne(query);

        if(dispositivodb){
            payload.mensaje = "ok";
            payload.ordenes = dispositivodb.ordenes
                .filter(o => o.estado == "pendiente")
                .map(o =>({ id_orden : o.id_orden, accion : o.accion }));
            payload.contactos_de_llamada = dispositivodb.contactos_de_llamada.map(c =>({ nombre : c.nombre, telefono : c.telefono }));
            payload.clave_desarme = dispositivodb.clave_desarme;
        }else{
            payload.mensaje = "dispositivo no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al consultar ordenes");
        payload.mensaje = "error al consultar ordenes";
        res.send(payload);
    }
});


/*
 LUCKFOX: CONFIRMAR UNA ORDEN
==========================================================================
*/
app.put('/equipo/ordenes/:id_orden', rutasEquipo, async (req, res) =>{
    let orden = req.body;
    let id_orden = req.params.id_orden;
    let serial = req.decoded.serial;
    console.log("Confirmación de " + serial);

    let payload = {
        mensaje : ""
    }

    let estado = "";
    if(orden){
        estado = texto(orden.estado);
    }

    if(estado == "confirmada" || estado == "fallida"){
        let query = { "serial" : serial };

        try{
            const dispositivodb = await DispositivoModel.findOne(query);
            let ordendb = null;
            if(dispositivodb){
                ordendb = dispositivodb.ordenes.find(o => o.id_orden == id_orden);
            }

            if(ordendb == null){
                payload.mensaje = "orden no encontrada";
            }else if(ordendb.estado != "pendiente"){
                payload.mensaje = "la orden ya fue respondida";
            }else{
                ordendb.estado = estado;
                await dispositivodb.save();
                payload.mensaje = "orden " + estado;
            }
            res.send(payload);

        }catch(err){
            console.log("error al confirmar orden");
            payload.mensaje = "error al confirmar orden";
            res.send(payload);
        }

    }else{
        payload.mensaje = "estado: confirmada o fallida";
        res.send(payload);
    }
});


/*
 LUCKFOX: ENVIAR DETECCION
==========================================================================
*/
app.post('/equipo/deteccion', rutasEquipo, async (req, res) =>{
    let deteccion = req.body;
    let serial = req.decoded.serial;
    console.log("Detección de " + serial);

    let payload = {
        mensaje : ""
    }

    if(deteccion && texto(deteccion.tipo_objeto)){
        let codigo = crearId("DET").substring(4);

        try{
            let registro = {
                id_deteccion : "DET-" + codigo,
                serial : serial,
                tipo_objeto : texto(deteccion.tipo_objeto),
                cerca_zona : deteccion.cerca_zona == true,
                dentro_zona : deteccion.dentro_zona == true
            }

            if(deteccion.foto){
                let foto = Buffer.from(texto(deteccion.foto).replace(/^data:image\/jpeg;base64,/, ""), "base64");
                if(foto[0] != 0xFF || foto[1] != 0xD8){
                    payload.mensaje = "la foto debe ser JPG en base64";
                    return res.send(payload);
                }
                fs.writeFileSync(path.join(CARPETA_FOTOS, registro.id_deteccion + ".jpg"), foto);
                registro.foto_url = "/foto/" + registro.id_deteccion;
            }

            let detecciondb = new DeteccionModel(registro);
            await detecciondb.save();
            payload.id_deteccion = detecciondb.id_deteccion;

            if(registro.cerca_zona || registro.dentro_zona){
                let nivel = "precaucion";
                if(registro.dentro_zona){
                    nivel = "alarma";
                }
                let alertadb = new AlertaModel({
                    id_alerta : "ALE-" + codigo,
                    id_deteccion : detecciondb.id_deteccion,
                    serial : serial,
                    nivel : nivel
                });
                await alertadb.save();
                payload.id_alerta = alertadb.id_alerta;
                payload.nivel = alertadb.nivel;
            }

            console.log("deteccion guardada en la base de datos");
            payload.mensaje = "deteccion correctamente guardada";
            res.send(payload);

        }catch(err){
            console.log("error al guardar deteccion");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 LUCKFOX: DESARME CON LOS BOTONES
==========================================================================
*/
app.put('/equipo/alertas/:id_alerta/desarme', rutasEquipo, async (req, res) =>{
    let desarme = req.body || {};
    let id_alerta = req.params.id_alerta;
    let serial = req.decoded.serial;
    console.log("Desarme en " + serial);

    let query = { "id_alerta" : id_alerta, "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const alertadb = await AlertaModel.findOne(query);

        if(alertadb == null){
            payload.mensaje = "alerta no encontrada";
        }else if(alertadb.estado != "activa"){
            payload.mensaje = "la alerta ya fue atendida";
        }else{
            alertadb.estado = "atendida";
            alertadb.desactivada_por = "botones del equipo";
            alertadb.intentos_fallidos = Number(texto(desarme.intentos_fallidos)) || 0;
            alertadb.fecha_desactivacion = new Date();
            await alertadb.save();

            payload.mensaje = "alerta desactivada en el equipo";
        }
        res.send(payload);

    }catch(err){
        console.log("error en desarme");
        payload.mensaje = "error en desarme";
        res.send(payload);
    }
});


/*
 MANTENIMIENTO: BUSCAR CLIENTE
==========================================================================
*/
app.get('/soporte/clientes', rutasSoporte, async (req, res) =>{
    let buscar = texto(req.query.buscar);
    console.log("Soporte busca cliente");

    let payload = {
        mensaje : ""
    }

    if(buscar.length < 2){
        payload.mensaje = "escribe al menos 2 letras del nombre o correo";
        return res.send(payload);
    }

    let parecido = {
        $regex : escaparTexto(buscar),
        $options : "i"
    }
    let query = {
        "id_rol" : { $in : [ROL_CON_PRODUCTO, ROL_SIN_PRODUCTO] },
        $or : [ { "nombre" : parecido }, { "correo" : parecido } ]
    }
    let visibles = {
        nombre : 1,
        telefono : 1,
        correo : 1,
        _id : 0
    }

    try{
        const clientes = await UsuarioModel.find(query, visibles).limit(50);
        payload.mensaje = "ok";
        payload.clientes = clientes;
        res.send(payload);

    }catch(err){
        console.log("error al buscar cliente");
        payload.mensaje = "error al buscar cliente";
        res.send(payload);
    }
});


/*
 MANTENIMIENTO: DISPOSITIVOS SIN CONEXION
==========================================================================
*/
app.get('/soporte/sin-conexion', rutasSoporte, async (req, res) =>{
    console.log("Soporte pide dispositivos sin conexión");

    let limite = new Date(Date.now() - MINUTOS_SIN_CONEXION * 60 * 1000);
    let query = {
        "id_usuario" : { $ne : null },
        $or : [ { "ultima_conexion" : null }, { "ultima_conexion" : { $lt : limite } } ]
    }
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivos = await DispositivoModel.find(query).limit(100).sort({ ultima_conexion : 1 });

        let query_duenos = { "id_usuario" : { $in : dispositivos.map(d => d.id_usuario) } };
        const duenos = await UsuarioModel.find(query_duenos);

        payload.mensaje = "ok";
        payload.dispositivos = dispositivos.map(d =>{
            let duenodb = duenos.find(u => u.id_usuario == d.id_usuario);
            let vista = {
                serial : d.serial,
                nombre : d.nombre,
                ultima_conexion : d.ultima_conexion,
                dueno : "",
                telefono_dueno : ""
            }
            if(duenodb){
                vista.dueno = duenodb.nombre;
                vista.telefono_dueno = duenodb.telefono;
            }
            return vista;
        });
        res.send(payload);

    }catch(err){
        console.log("error al listar sin conexion");
        payload.mensaje = "error al listar sin conexion";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: BUSCAR USUARIOS
==========================================================================
*/
app.get('/admin/usuarios', rutasAdmin, async (req, res) =>{
    let buscar = texto(req.query.buscar);
    console.log("Admin busca usuarios");

    let query = {}
    let ocultos = {
        clave : 0,
        sesion : 0,
        _id : 0,
        __v : 0
    }
    let payload = {
        mensaje : ""
    }

    if(buscar){
        let parecido = {
            $regex : escaparTexto(buscar),
            $options : "i"
        }
        query = {
            $or : [ { "nombre" : parecido }, { "correo" : parecido } ]
        }
        if(/^\d+$/.test(buscar)){
            query.$or.push({ "cedula" : Number(buscar) });
        }
    }

    try{
        const usuarios = await UsuarioModel.find(query, ocultos).limit(100);
        const roles = await RolModel.find({});

        payload.mensaje = "ok";
        payload.usuarios = usuarios.map(u =>{
            let vista = u.toObject();
            let roldb = roles.find(r => r.id_rol == u.id_rol);
            vista.rol = "";
            if(roldb){
                vista.rol = roldb.nombre_rol;
            }
            return vista;
        });
        res.send(payload);

    }catch(err){
        console.log("error al buscar usuarios");
        payload.mensaje = "error al buscar usuarios";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: CAMBIAR ROL
==========================================================================
*/
app.put('/admin/usuarios/:id_usuario/rol', rutasAdmin, async (req, res) =>{
    let usuario = req.body || {};
    let id_usuario = req.params.id_usuario;
    console.log("Admin cambia rol");

    let payload = {
        mensaje : ""
    }

    if(id_usuario == req.decoded.id_usuario){
        payload.mensaje = "no puedes cambiar tu propio rol";
        return res.send(payload);
    }

    let query = { "id_usuario" : id_usuario };
    let query_rol = { "id_rol" : Number(texto(usuario.id_rol)) };

    try{
        const roldb = await RolModel.findOne(query_rol);
        const usuariodb = await UsuarioModel.findOne(query);

        if(roldb == null){
            payload.mensaje = "ese rol no existe";
        }else if(usuariodb == null){
            payload.mensaje = "usuario no encontrado";
        }else{
            usuariodb.id_rol = roldb.id_rol;
            usuariodb.sesion = usuariodb.sesion + 1;
            await usuariodb.save();
            payload.mensaje = "rol cambiado a " + roldb.nombre_rol + "; debe entrar de nuevo";
        }
        res.send(payload);

    }catch(err){
        console.log("error al cambiar rol");
        payload.mensaje = "error al cambiar rol";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: BORRAR CUENTA
==========================================================================
*/
app.delete('/admin/usuarios/:id_usuario', rutasAdmin, async (req, res) =>{
    let id_usuario = req.params.id_usuario;
    console.log("Admin borra usuario");

    let payload = {
        mensaje : ""
    }

    if(id_usuario == req.decoded.id_usuario){
        payload.mensaje = "no puedes borrar tu propia cuenta";
        return res.send(payload);
    }

    let query = { "id_usuario" : id_usuario };

    try{
        const usuariodb = await UsuarioModel.findOne(query);

        if(usuariodb){
            const suyos = await DispositivoModel.find(query);
            for(let dispositivodb of suyos){
                await desvincular(dispositivodb);
            }
            await CompartidoModel.deleteMany(query);
            await UsuarioModel.deleteOne(query);
            payload.mensaje = "cuenta borrada";
        }else{
            payload.mensaje = "usuario no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al borrar usuario");
        payload.mensaje = "error al borrar usuario";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: CARGAR DISPOSITIVO NUEVO
==========================================================================
*/
app.post('/admin/dispositivos', rutasAdmin, async (req, res) =>{
    let dispositivo = req.body;
    console.log("Admin carga dispositivo");

    let payload = {
        mensaje : ""
    }

    if(dispositivo && texto(dispositivo.serial) && texto(dispositivo.id_producto)){
        let serial = texto(dispositivo.serial).toUpperCase();
        let id_producto = texto(dispositivo.id_producto);

        let query_producto = { "id_producto" : id_producto };

        try{
            const productodb = await ProductoModel.findOne(query_producto);

            if(productodb){
                let codigo_vinculacion = await crearCodigoUnico(app.get('llave'));
                let clave_equipo = crearClaveEquipo();

                let registro = new DispositivoModel({
                    serial : serial,
                    id_producto : id_producto,
                    codigo_vinculacion : await bcrypt.hash(codigo_vinculacion, 10),
                    huella_codigo : huellaCodigo(codigo_vinculacion, app.get('llave')),
                    clave_equipo : await bcrypt.hash(clave_equipo, 10)
                });
                await registro.save();

                console.log("dispositivo cargado");
                payload.mensaje = "dispositivo cargado; anota los códigos, no se vuelven a mostrar";
                payload.serial = serial;
                payload.codigo_vinculacion = codigo_vinculacion;
                payload.clave_equipo = clave_equipo;
            }else{
                payload.mensaje = "producto no existe";
            }
            res.send(payload);

        }catch(err){
            console.log("error al cargar dispositivo");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: BUSCAR DISPOSITIVOS
==========================================================================
*/
app.get('/admin/dispositivos', rutasAdmin, async (req, res) =>{
    let serial = texto(req.query.serial);
    console.log("Admin busca dispositivos");

    let query = {}
    let payload = {
        mensaje : ""
    }

    if(serial){
        query = {
            "serial" : { $regex : escaparTexto(serial), $options : "i" }
        }
    }

    try{
        const dispositivos = await DispositivoModel.find(query).limit(100).sort({ serial : 1 });

        let query_duenos = { "id_usuario" : { $in : dispositivos.map(d => d.id_usuario) } };
        const duenos = await UsuarioModel.find(query_duenos);
        const productos = await ProductoModel.find({});

        payload.mensaje = "ok";
        payload.dispositivos = dispositivos.map(d =>{
            let duenodb = duenos.find(u => u.id_usuario == d.id_usuario);
            let vista = vistaDispositivo(d, buscarProducto(productos, d.id_producto), PERMISO_DUENO);
            vista.dueno = "sin dueño";
            vista.correo_dueno = "";
            vista.telefono_dueno = "";
            if(duenodb){
                vista.dueno = duenodb.nombre;
                vista.correo_dueno = duenodb.correo;
                vista.telefono_dueno = duenodb.telefono;
            }
            return vista;
        });
        res.send(payload);

    }catch(err){
        console.log("error al buscar dispositivos");
        payload.mensaje = "error al buscar dispositivos";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: CODIGO NUEVO
==========================================================================
*/
app.put('/admin/dispositivos/:serial/codigo', rutasAdmin, async (req, res) =>{
    let serial = req.params.serial;
    console.log("Admin genera código nuevo");

    let query = { "serial" : serial };
    let payload = {
        mensaje : ""
    }

    try{
        const dispositivodb = await DispositivoModel.findOne(query);

        if(dispositivodb){
            let codigo_vinculacion = await crearCodigoUnico(app.get('llave'));
            dispositivodb.codigo_vinculacion = await bcrypt.hash(codigo_vinculacion, 10);
            dispositivodb.huella_codigo = huellaCodigo(codigo_vinculacion, app.get('llave'));
            await dispositivodb.save();

            payload.mensaje = "código nuevo; anótalo, no se vuelve a mostrar";
            payload.codigo_vinculacion = codigo_vinculacion;
        }else{
            payload.mensaje = "dispositivo no encontrado";
        }
        res.send(payload);

    }catch(err){
        console.log("error al generar código");
        payload.mensaje = "error al generar código";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: CREAR CÓDIGO NUEVO
==========================================================================
*/
app.post('/admin/codigos', rutasAdmin, async (req, res) =>{
    let dispositivo = req.body || {};
    console.log("Admin crea código nuevo");

    let payload = {
        mensaje : ""
    }

    if(texto(dispositivo.id_producto)){
        let query_producto = { "id_producto" : texto(dispositivo.id_producto) };

        try{
            const productodb = await ProductoModel.findOne(query_producto);

            if(productodb){
                let serial = await siguienteSerial();
                let codigo_vinculacion = await crearCodigoUnico(app.get('llave'));
                let clave_equipo = crearClaveEquipo();

                let registro = new DispositivoModel({
                    serial : serial,
                    id_producto : productodb.id_producto,
                    codigo_vinculacion : await bcrypt.hash(codigo_vinculacion, 10),
                    huella_codigo : huellaCodigo(codigo_vinculacion, app.get('llave')),
                    clave_equipo : await bcrypt.hash(clave_equipo, 10)
                });
                await registro.save();

                console.log("código creado");
                payload.mensaje = "código creado; imprímelo en la caja, no se vuelve a mostrar";
                payload.serial = serial;
                payload.producto = productodb.nombre;
                payload.codigo_vinculacion = codigo_vinculacion;
                payload.clave_equipo = clave_equipo;
            }else{
                payload.mensaje = "producto no existe";
            }
            res.send(payload);

        }catch(err){
            console.log("error al crear código");
            payload.mensaje = traducirError(err);
            res.send(payload);
        }

    }else{
        payload.mensaje = "faltan datos";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: RESUMEN
==========================================================================
*/
app.get('/admin/resumen', rutasAdmin, async (req, res) =>{
    console.log("Admin pide resumen");

    let limite = new Date(Date.now() - MINUTOS_SIN_CONEXION * 60 * 1000);
    let query_vinculados = { "id_usuario" : { $ne : null } };
    let query_en_linea = { "ultima_conexion" : { $gt : limite } };
    let query_activas = { "estado" : "activa" };
    let payload = {
        mensaje : ""
    }

    try{
        const roles = await RolModel.find({});
        const por_rol = await UsuarioModel.aggregate([
            { $group : { _id : "$id_rol", cantidad : { $sum : 1 } } },
            { $sort : { _id : 1 } }
        ]);

        payload.mensaje = "ok";
        payload.usuarios = await UsuarioModel.countDocuments({});
        payload.por_rol = por_rol.map(g =>{
            let roldb = roles.find(r => r.id_rol == g._id);
            let nombre = "rol " + g._id;
            if(roldb){
                nombre = roldb.nombre_rol;
            }
            return { id_rol : g._id, rol : nombre, cantidad : g.cantidad };
        });
        payload.productos = await ProductoModel.countDocuments({});
        payload.dispositivos = await DispositivoModel.countDocuments({});
        payload.vinculados = await DispositivoModel.countDocuments(query_vinculados);
        payload.libres = payload.dispositivos - payload.vinculados;
        payload.en_linea = await DispositivoModel.countDocuments(query_en_linea);
        payload.alertas_activas = await AlertaModel.countDocuments(query_activas);
        res.send(payload);

    }catch(err){
        console.log("error en resumen");
        payload.mensaje = "error en resumen";
        res.send(payload);
    }
});


/*
 ADMINISTRADOR: DISPOSITIVOS REGISTRADOS POR MES
==========================================================================
*/
app.get('/admin/estadisticas/registros', rutasAdmin, async (req, res) =>{
    console.log("Admin pide estadísticas");

    let payload = {
        mensaje : ""
    }

    try{
        const grupos = await DispositivoModel.aggregate([
            { $match : { fecha_vinculacion : { $ne : null } } },
            { $group : {
                _id : { $dateToString : { format : "%Y-%m", date : "$fecha_vinculacion", timezone : "America/Bogota" } },
                vinculados : { $sum : 1 }
            } },
            { $sort : { _id : 1 } }
        ]);

        payload.mensaje = "ok";
        payload.registros = grupos.map(g =>({ mes : g._id, vinculados : g.vinculados }));
        res.send(payload);

    }catch(err){
        console.log("error en estadisticas");
        payload.mensaje = "error en estadisticas";
        res.send(payload);
    }
});


/*
 PRODUCTOS: GUARDAR
==========================================================================
*/
app.post('/guardarproducto', rutasAdmin, (req, res) =>{
    let producto = req.body;
    console.log("Solicitó guardar producto");

    let payload = {
        mensaje : ""
    }

    if(producto && texto(producto.id_producto) && texto(producto.nombre) && VERSIONES.includes(texto(producto.version))){

        producto.id_producto = texto(producto.id_producto);
        producto.nombre = texto(producto.nombre);
        producto.version = texto(producto.version);
        producto.descripcion = texto(producto.descripcion);

        let registro = new ProductoModel(producto);

        registro.save().then(item =>{
            console.log("producto guardado en la base de datos");
            payload.mensaje = "producto correctamente guardado";
            payload.producto = item;
            res.send(payload);

        }).catch(err =>{
            console.log("error al guardar producto");
            payload.mensaje = traducirError(err);
            res.send(payload);
        });

    }else{
        payload.mensaje = "faltan datos; version: " + VERSIONES.join(", ");
        res.send(payload);
    }
});


/*
 PRODUCTOS: LISTA
==========================================================================
*/
app.get('/listaproductos', rutasAdmin, async (req, res) =>{
    console.log("Solicitó lista de productos");

    let payload = {
        mensaje : ""
    }

    try{
        const productos = await ProductoModel.find({}, { _id : 0, __v : 0 });
        payload.mensaje = "ok";
        payload.productos = productos;
        res.send(payload);

    }catch(err){
        console.log("error al listar productos");
        payload.mensaje = "error al listar productos";
        res.send(payload);
    }
});


/*
 ROLES: LISTA
==========================================================================
*/
app.get('/listaroles', rutasAdmin, async (req, res) =>{
    console.log("Solicitó lista de roles");

    let payload = {
        mensaje : ""
    }

    try{
        const roles = await RolModel.find({}, { _id : 0, __v : 0 }).sort({ id_rol : 1 });
        payload.mensaje = "ok";
        payload.roles = roles;
        res.send(payload);

    }catch(err){
        console.log("error al listar roles");
        payload.mensaje = "error al listar roles";
        res.send(payload);
    }
});


/*
 HORA DEL SERVIDOR
==========================================================================
*/
app.get('/hora', (req, res) =>{
    let payload = {
        hora : new Date()
    }
    res.send(payload);
});


/*
 PAGINA
==========================================================================
*/
app.use('/app', express.static(path.join(__dirname, 'pagina')));


/*
 ERRORES
==========================================================================
*/
app.use((err, req, res, next) =>{
    let payload = {
        mensaje : "no se pudo completar la solicitud"
    }
    if(err.type == "entity.parse.failed"){
        payload.mensaje = "JSON mal escrito";
    }else if(err.type == "entity.too.large"){
        payload.mensaje = "la foto es muy grande";
    }
    res.send(payload);
});


/*
 SERVIDOR
==========================================================================
*/
const iniciarServidor = async () =>{
    console.log("Cargando...");
    await conectarDB(connectionstring);
    const server = app.listen(port, () =>{
        console.log("Servidor escuchando por " + port);
    });
}

iniciarServidor();
