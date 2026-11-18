/*
 MIDDLEWARE
==========================================================================
*/
const express = require('express');
const jwt = require('jsonwebtoken');
const { ROL_ADMIN, ROL_SOCIO, TOKEN_USUARIO, TOKEN_EQUIPO } = require('./reglas');
const UsuarioModel = require('../models/Usuario');


/*
 RUTAS PROTEGIDAS
==========================================================================
*/
const rutasProtegidas = express.Router();

rutasProtegidas.use((req, res, next) =>{
    const token = req.headers['access-token'];
    if(token){
        jwt.verify(token, req.app.get('llave'), async (err, decoded) =>{
            if(err){
                return res.json({mensaje : mensajeError(err)});
            }else if(decoded.tipo != TOKEN_USUARIO){
                return res.json({mensaje : 'Token invalido'});
            }else if(await sesionVigente(decoded) == false){
                return res.json({mensaje : SESION_CERRADA});
            }else{
                req.decoded = decoded;
                res.setHeader('access-token', crearToken(decoded, req.app.get('llave')));
                next();
            }
        });
    }else{
        res.send({
            mensaje : 'Token vacio'
        });
    }
});


/*
 RUTAS ADMIN
==========================================================================
*/
const rutasAdmin = express.Router();

rutasAdmin.use((req, res, next) =>{
    const token = req.headers['access-token'];
    if(token){
        jwt.verify(token, req.app.get('llave'), async (err, decoded) =>{
            if(err){
                return res.json({mensaje : mensajeError(err)});
            }else if(decoded.tipo != TOKEN_USUARIO){
                return res.json({mensaje : 'Token invalido'});
            }else if(decoded.id_rol != ROL_ADMIN){
                return res.json({mensaje : 'no autorizado'});
            }else if(await sesionVigente(decoded) == false){
                return res.json({mensaje : SESION_CERRADA});
            }else{
                req.decoded = decoded;
                res.setHeader('access-token', crearToken(decoded, req.app.get('llave')));
                next();
            }
        });
    }else{
        res.send({
            mensaje : 'Token vacio'
        });
    }
});


/*
 RUTAS SOPORTE
==========================================================================
*/
const rutasSoporte = express.Router();

rutasSoporte.use((req, res, next) =>{
    const token = req.headers['access-token'];
    if(token){
        jwt.verify(token, req.app.get('llave'), async (err, decoded) =>{
            if(err){
                return res.json({mensaje : mensajeError(err)});
            }else if(decoded.tipo != TOKEN_USUARIO){
                return res.json({mensaje : 'Token invalido'});
            }else if(decoded.id_rol != ROL_ADMIN && decoded.id_rol != ROL_SOCIO){
                return res.json({mensaje : 'no autorizado'});
            }else if(await sesionVigente(decoded) == false){
                return res.json({mensaje : SESION_CERRADA});
            }else{
                req.decoded = decoded;
                res.setHeader('access-token', crearToken(decoded, req.app.get('llave')));
                next();
            }
        });
    }else{
        res.send({
            mensaje : 'Token vacio'
        });
    }
});


/*
 RUTAS EQUIPO
==========================================================================
*/
const rutasEquipo = express.Router();

rutasEquipo.use((req, res, next) =>{
    const token = req.headers['access-token'];
    if(token){
        jwt.verify(token, req.app.get('llave'), (err, decoded) =>{
            if(err){
                return res.json({mensaje : mensajeError(err)});
            }else if(decoded.tipo != TOKEN_EQUIPO){
                return res.json({mensaje : 'Token invalido'});
            }else{
                req.decoded = decoded;
                res.setHeader('access-token', crearToken(decoded, req.app.get('llave')));
                next();
            }
        });
    }else{
        res.send({
            mensaje : 'Token vacio'
        });
    }
});


/*
 FUNCIONES DEL TOKEN
==========================================================================
*/

function crearToken(datos, llave) {
    let datos_token = {
        tipo : datos.tipo
    }
    if(datos.tipo == TOKEN_EQUIPO){
        datos_token.serial = datos.serial;
    }else{
        datos_token.id_usuario = datos.id_usuario;
        datos_token.correo = datos.correo;
        datos_token.id_rol = datos.id_rol;
        datos_token.sesion = datos.sesion;
    }
    const token = jwt.sign(datos_token, llave, {
        expiresIn : "30m"
    });
    return token;
}

const SESION_CERRADA = 'sesión cerrada, vuelve a entrar';

async function sesionVigente(decoded) {
    let query = { "id_usuario" : decoded.id_usuario };
    try{
        const usuariodb = await UsuarioModel.findOne(query);
        if(usuariodb && usuariodb.sesion == decoded.sesion){
            return true;
        }
        return false;
    }catch(err){
        return false;
    }
}


function mensajeError(err) {
    if(err.name == "TokenExpiredError"){
        return 'sesión cerrada por inactividad';
    }
    return 'Token invalido';
}


/*
 EXPORTAR
==========================================================================
*/
module.exports = {
    rutasProtegidas,
    rutasAdmin,
    rutasSoporte,
    rutasEquipo,
    crearToken
};
