/*
 CONEXION A MONGODB
==========================================================================
*/
const mongoose = require('mongoose');
const { crearRoles } = require('./funciones/funciones_ayudas');

const conectarDB = async (connectionString) =>{
    try{
        await mongoose.connect(connectionString);
        console.log("Conectado a la base de datos");
        crearRoles();
    }catch(err){
        console.log("no se pudo conectar a la base de datos");
    }
}


/*
 EXPORTAR
==========================================================================
*/
module.exports = conectarDB;
