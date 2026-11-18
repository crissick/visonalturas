/*
 CONEXION A MONGODB
==========================================================================
*/
const mongoose = require('mongoose');
const { crearRoles } = require('./funciones/funciones_ayudas');

function conectar(connectionString){
    mongoose.connect(connectionString)
        .then(() =>{
            console.log("Conectado a la base de datos");
            crearRoles();
        }).catch(err =>{
            console.log("no se pudo conectar a la base de datos");
        });
}


/*
 EXPORTAR
==========================================================================
*/
module.exports = conectar;
