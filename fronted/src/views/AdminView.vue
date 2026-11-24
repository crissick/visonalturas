<template>
  <div class="admin">
    <div class="franja">
      <h1>ADMINISTRACIÓN</h1>
      <p>{{ mensaje }}</p>
    </div>

    <div class="cuerpo" v-if="token != ''">
      <div class="menu">
        <button :class="claseMenu('resumen')" @click="cambiarPestana('resumen')">RESUMEN</button>
        <button :class="claseMenu('usuarios')" @click="cambiarPestana('usuarios')">USUARIOS</button>
        <button :class="claseMenu('dispositivos')" @click="cambiarPestana('dispositivos')">DISPOSITIVOS</button>
        <button :class="claseMenu('codigos')" @click="cambiarPestana('codigos')">CÓDIGOS NUEVOS</button>
        <button :class="claseMenu('productos')" @click="cambiarPestana('productos')">PRODUCTOS</button>
        <button :class="claseMenu('vivo')" @click="cambiarPestana('vivo')">LIVE STREAM</button>
      </div>

      <div class="contenido">
        <div v-if="pestana == 'resumen'">
          <div class="tarjetas">
            <div class="tarjeta"><p class="numero">{{ resumen.usuarios }}</p><p>usuarios</p></div>
            <div class="tarjeta"><p class="numero">{{ resumen.productos }}</p><p>productos</p></div>
            <div class="tarjeta"><p class="numero">{{ resumen.dispositivos }}</p><p>dispositivos</p></div>
            <div class="tarjeta"><p class="numero">{{ resumen.vinculados }}</p><p>vinculados</p></div>
            <div class="tarjeta"><p class="numero">{{ resumen.libres }}</p><p>sin dueño</p></div>
            <div class="tarjeta"><p class="numero">{{ resumen.en_linea }}</p><p>en línea</p></div>
            <div class="tarjeta tarjeta_alerta"><p class="numero">{{ resumen.alertas_activas }}</p><p>alertas activas</p></div>
          </div>

          <div class="dos_tablas">
            <div>
              <h3>USUARIOS POR ROL</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="grupo in resumen.por_rol" :key="grupo.id_rol">
                    <td>{{ grupo.id_rol }} - {{ grupo.rol }}</td>
                    <td>{{ grupo.cantidad }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3>VINCULADOS POR MES</h3>
              <table>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Vinculados</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="registro in registros" :key="registro.mes">
                    <td>{{ registro.mes }}</td>
                    <td>{{ registro.vinculados }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="registros.length == 0">todavía no hay vinculados</p>
            </div>
          </div>

          <h3>EQUIPOS SIN CONEXIÓN</h3>
          <table>
            <thead>
              <tr>
                <th>Serial</th>
                <th>Nombre</th>
                <th>Dueño</th>
                <th>Teléfono</th>
                <th>Última conexión</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="disp in sin_conexion" :key="disp.serial">
                <td>{{ disp.serial }}</td>
                <td>{{ disp.nombre }}</td>
                <td>{{ disp.dueno }}</td>
                <td>{{ disp.telefono_dueno }}</td>
                <td>{{ leerFecha(disp.ultima_conexion) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="sin_conexion.length == 0">ningún equipo vinculado está sin conexión</p>
        </div>

        <div v-if="pestana == 'usuarios'">
          <input class="casilla_corta" type="text" v-model="buscar" placeholder="BUSCAR: NOMBRE, CORREO O CÉDULA">
          <button class="boton_accion" @click="buscarUsuarios">BUSCAR</button>
          <table>
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reg in usuarios" :key="reg.id_usuario">
                <td>{{ reg.cedula }}</td>
                <td>{{ reg.nombre }}</td>
                <td>{{ reg.correo }}</td>
                <td>{{ reg.telefono }}</td>
                <td>{{ reg.rol }}</td>
                <td class="acciones">
                  <select class="selector_fila" v-model="rol_nuevo[reg.id_usuario]">
                    <option v-for="r in roles" :key="r.id_rol" :value="r.id_rol">{{ r.nombre_rol }}</option>
                  </select>
                  <button class="boton_fila" @click="cambiarRol(reg.id_usuario)">CAMBIAR ROL</button>
                  <button class="boton_borrar" @click="borrarUsuario(reg.id_usuario, reg.nombre)">BORRAR</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pestana == 'dispositivos'">
          <input class="casilla_corta" type="text" v-model="buscar_serial" placeholder="BUSCAR POR SERIAL">
          <button class="boton_accion" @click="buscarDispositivos">BUSCAR</button>
          <table>
            <thead>
              <tr>
                <th>Serial</th>
                <th>Producto</th>
                <th>Nombre</th>
                <th>Dueño</th>
                <th>Correo</th>
                <th>Conexión</th>
                <th>Batería</th>
                <th>Vinculado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="disp in dispositivos" :key="disp.serial">
                <td>{{ disp.serial }}</td>
                <td>{{ disp.producto }}</td>
                <td>{{ disp.nombre }}</td>
                <td>{{ disp.dueno }}</td>
                <td>{{ disp.correo_dueno }}</td>
                <td>{{ disp.conexion }}</td>
                <td>{{ textoBateria(disp.bateria) }}</td>
                <td>{{ leerFecha(disp.fecha_vinculacion) }}</td>
                <td>
                  <button class="boton_fila" @click="regenerarCodigo(disp.serial)">CÓDIGO NUEVO</button>
                  <button class="boton_fila" @click="verEnVivo(disp.serial)">VER</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="dispositivos.length == 0">no hay dispositivos</p>

          <div class="caja_codigo" v-if="codigo_regenerado != ''">
            <p>{{ serial_regenerado }}: código nuevo de la caja</p>
            <p class="codigo_grande">{{ codigo_regenerado }}</p>
          </div>
        </div>

        <div v-if="pestana == 'codigos'">
          <p>escoge el producto y crea el código. el servidor revisa que no se repita con ninguno de los que ya existen.</p>
          <select class="casilla_corta" v-model="id_producto">
            <option v-for="prod in productos" :key="prod.id_producto" :value="prod.id_producto">{{ prod.nombre }} ({{ prod.version }})</option>
          </select>
          <button class="boton_accion" @click="crearCodigo">CREAR NUEVO CÓDIGO</button>
          <p v-if="productos.length == 0">primero crea un producto</p>

          <div class="caja_codigo" v-if="ultimo_codigo.serial">
            <p><b>SERIAL:</b> {{ ultimo_codigo.serial }}</p>
            <p>código de la caja (va impreso):</p>
            <p class="codigo_grande">{{ ultimo_codigo.codigo }}</p>
            <p><b>CLAVE DE LA LUCKFOX</b> (va dentro del equipo):</p>
            <p class="clave_equipo">{{ ultimo_codigo.clave }}</p>
            <p>anótalos: el servidor no los vuelve a mostrar</p>
          </div>

          <h3 v-if="codigos_creados.length > 0">CREADOS AHORA (PARA IMPRIMIR)</h3>
          <table v-if="codigos_creados.length > 0">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Producto</th>
                <th>Código de la caja</th>
                <th>Clave de la LuckFox</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cod in codigos_creados" :key="cod.serial">
                <td>{{ cod.serial }}</td>
                <td>{{ cod.producto }}</td>
                <td class="codigo_tabla">{{ cod.codigo }}</td>
                <td class="clave_equipo">{{ cod.clave }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="codigos_creados.length > 0">esta lista se borra al salir de la página</p>
        </div>

        <div v-if="pestana == 'productos'">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in productos" :key="prod.id_producto">
                <td>{{ prod.id_producto }}</td>
                <td>{{ prod.nombre }}</td>
                <td>{{ prod.version }}</td>
                <td>{{ prod.descripcion }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="productos.length == 0">no hay productos</p>

          <div class="formulario">
            <h3>CREAR PRODUCTO</h3>
            <input class="casilla" type="text" v-model="id_producto_nuevo" placeholder="ID (VA-V1)">
            <input class="casilla" type="text" v-model="nombre_producto" placeholder="NOMBRE (VISIÓN DE ALTURAS V1)">
            <select class="casilla" v-model="version">
              <option value="bodega">bodega</option>
              <option value="rascacielos">rascacielos</option>
              <option value="centro comercial">centro comercial</option>
            </select>
            <input class="casilla" type="text" v-model="descripcion" placeholder="DESCRIPCIÓN (OPCIONAL)">
            <button class="boton_accion" @click="crearProducto">CREAR</button>
          </div>
        </div>

        <div v-if="pestana == 'vivo'">
          <select class="casilla_corta" v-model="serial_vivo" @change="cambiarCamara">
            <option value="">ESCOGE UN DISPOSITIVO</option>
            <option v-for="disp in dispositivos" :key="disp.serial" :value="disp.serial">{{ disp.serial }} - {{ disp.nombre }} ({{ disp.dueno }})</option>
          </select>

          <div class="pantalla">
            <img class="imagen_vivo" v-if="foto_vivo != ''" :src="foto_vivo" alt="última foto del dispositivo">
            <p v-else>{{ aviso_vivo }}</p>
          </div>
          <p class="nota_vivo" v-if="hora_foto != ''">foto del {{ hora_foto }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import { SERVIDOR, marcarActividad } from '../servidor'

  export default {
    name: 'AdminView',
    data(){
      return {
        mensaje : "",
        token : "",
        pestana : "resumen",
        actualizador : null,
        resumen : {},
        registros : [],
        sin_conexion : [],
        usuarios : [],
        roles : [],
        rol_nuevo : {},
        buscar : "",
        dispositivos : [],
        buscar_serial : "",
        serial_regenerado : "",
        codigo_regenerado : "",
        productos : [],
        id_producto : "",
        ultimo_codigo : {},
        codigos_creados : [],
        id_producto_nuevo : "",
        nombre_producto : "",
        version : "bodega",
        descripcion : "",
        serial_vivo : "",
        foto_vivo : "",
        id_foto_vivo : "",
        hora_foto : "",
        aviso_vivo : "escoge un dispositivo para verlo",
        camara : null
      }
    },
    mounted(){
      this.entrar()
      this.actualizador = setInterval(this.actualizarSolo, 15000)
      this.camara = setInterval(this.actualizarCamara, 5000)
    },
    unmounted(){
      clearInterval(this.actualizador)
      clearInterval(this.camara)
      this.quitarFoto()
    },
    methods:{

      conToken(){
        let opciones = {
          headers : { "access-token" : this.token }
        }
        return opciones
      },

      revisarRespuesta(respuesta){
        if(respuesta.headers["access-token"]){
          this.token = respuesta.headers["access-token"]
          localStorage.setItem("token", this.token)
          return true
        }
        this.salir(respuesta.data.mensaje)
        return false
      },

      salir(aviso){
        localStorage.removeItem("token")
        localStorage.removeItem("nombre")
        localStorage.removeItem("vence")
        localStorage.removeItem("rol")
        this.token = ""
        clearInterval(this.actualizador)
        clearInterval(this.camara)
        if(aviso){
          alert(aviso)
        }
        this.$router.push("/")
      },

      async entrar(){
        let token_guardado = localStorage.getItem("token")
        if(token_guardado == null){
          this.$router.push("/")
          return
        }
        this.token = token_guardado

        try{
          const perfil = await axios.get(SERVIDOR + "/perfil", this.conToken())
          if(this.revisarRespuesta(perfil) == false){
            return
          }
          if(perfil.data.usuario.id_rol != 1){
            this.token = ""
            this.$router.push("/usuario")
            return
          }
          localStorage.setItem("nombre", perfil.data.usuario.nombre)
          localStorage.setItem("rol", perfil.data.usuario.id_rol)
          this.traerResumen()

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      cambiarPestana(nombre){
        marcarActividad()
        this.pestana = nombre
        this.mensaje = ""
        if(nombre == "resumen"){
          this.traerResumen()
        }else if(nombre == "usuarios"){
          this.traerRoles()
          this.traerUsuarios()
        }else if(nombre == "dispositivos"){
          this.traerDispositivos()
        }else if(nombre == "codigos" || nombre == "productos"){
          this.traerProductos()
        }else if(nombre == "vivo"){
          this.traerDispositivos()
          this.traerUltimaFoto()
        }
      },

      claseMenu(nombre){
        if(this.pestana == nombre){
          return "boton_menu menu_activo"
        }
        return "boton_menu"
      },

      actualizarSolo(){
        if(this.token == ""){
          return
        }
        if(this.pestana == "resumen"){
          this.traerResumen()
        }else if(this.pestana == "dispositivos"){
          this.traerDispositivos()
        }
      },

      async traerResumen(){
        try{
          const resumen = await axios.get(SERVIDOR + "/admin/resumen", this.conToken())
          if(this.revisarRespuesta(resumen) == false){
            return
          }
          this.resumen = resumen.data

          const meses = await axios.get(SERVIDOR + "/admin/estadisticas/registros", this.conToken())
          if(this.revisarRespuesta(meses) == false){
            return
          }
          this.registros = meses.data.registros

          const sin = await axios.get(SERVIDOR + "/soporte/sin-conexion", this.conToken())
          if(this.revisarRespuesta(sin) == false){
            return
          }
          this.sin_conexion = sin.data.dispositivos

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      buscarUsuarios(){
        marcarActividad()
        this.traerUsuarios()
      },

      async traerUsuarios(){
        try{
          let opciones = this.conToken()
          opciones.params = { buscar : this.buscar }
          const respuesta = await axios.get(SERVIDOR + "/admin/usuarios", opciones)
          if(this.revisarRespuesta(respuesta)){
            this.usuarios = respuesta.data.usuarios
            for(let u of this.usuarios){
              this.rol_nuevo[u.id_usuario] = u.id_rol
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async traerRoles(){
        try{
          const respuesta = await axios.get(SERVIDOR + "/listaroles", this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.roles = respuesta.data.roles
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async cambiarRol(id_usuario){
        marcarActividad()
        try{
          let datos = {
            id_rol : this.rol_nuevo[id_usuario]
          }
          const respuesta = await axios.put(SERVIDOR + "/admin/usuarios/" + id_usuario + "/rol", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            this.traerUsuarios()
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async borrarUsuario(id_usuario, nombre){
        marcarActividad()
        if(confirm("¿borrar la cuenta de " + nombre + "? sus dispositivos quedan libres") == false){
          return
        }
        try{
          const respuesta = await axios.delete(SERVIDOR + "/admin/usuarios/" + id_usuario, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            this.traerUsuarios()
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      buscarDispositivos(){
        marcarActividad()
        this.traerDispositivos()
      },

      async traerDispositivos(){
        try{
          let opciones = this.conToken()
          opciones.params = { serial : this.buscar_serial }
          const respuesta = await axios.get(SERVIDOR + "/admin/dispositivos", opciones)
          if(this.revisarRespuesta(respuesta)){
            this.dispositivos = respuesta.data.dispositivos
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async regenerarCodigo(serial){
        marcarActividad()
        if(confirm("¿código nuevo para " + serial + "? el de la caja deja de servir") == false){
          return
        }
        try{
          const respuesta = await axios.put(SERVIDOR + "/admin/dispositivos/" + serial + "/codigo", {}, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            this.serial_regenerado = serial
            this.codigo_regenerado = respuesta.data.codigo_vinculacion
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      verEnVivo(serial){
        this.serial_vivo = serial
        this.quitarFoto()
        this.cambiarPestana("vivo")
      },

      cambiarCamara(){
        marcarActividad()
        this.quitarFoto()
        this.traerUltimaFoto()
      },

      actualizarCamara(){
        if(this.token != "" && this.pestana == "vivo"){
          this.traerUltimaFoto()
        }
      },

      async traerUltimaFoto(){
        if(this.serial_vivo == ""){
          this.aviso_vivo = "escoge un dispositivo para verlo"
          return
        }
        try{
          const lista = await axios.get(SERVIDOR + "/detecciones/" + this.serial_vivo, this.conToken())
          if(this.revisarRespuesta(lista) == false){
            return
          }
          let detecciones = []
          if(lista.data.detecciones){
            detecciones = lista.data.detecciones
          }
          let ultima = detecciones.find(d => d.foto_url)
          if(ultima == undefined){
            this.quitarFoto()
            this.aviso_vivo = "este equipo todavía no ha mandado fotos"
            return
          }
          if(ultima.id_deteccion == this.id_foto_vivo){
            return
          }

          let opciones = this.conToken()
          opciones.responseType = "blob"
          const foto = await axios.get(SERVIDOR + "/foto/" + ultima.id_deteccion, opciones)
          if(this.revisarRespuesta(foto) == false){
            return
          }
          if(String(foto.headers["content-type"]).includes("image") == false){
            this.aviso_vivo = "no se pudo cargar la foto"
            return
          }
          this.quitarFoto()
          this.foto_vivo = URL.createObjectURL(foto.data)
          this.id_foto_vivo = ultima.id_deteccion
          this.hora_foto = this.leerFecha(ultima.fecha_hora)

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.aviso_vivo = mensaje
        }
      },

      quitarFoto(){
        if(this.foto_vivo != ""){
          URL.revokeObjectURL(this.foto_vivo)
        }
        this.foto_vivo = ""
        this.id_foto_vivo = ""
        this.hora_foto = ""
      },

      textoBateria(bateria){
        if(bateria == null){
          return "sin dato"
        }else if(bateria <= 20){
          return bateria + "% baja"
        }
        return bateria + "%"
      },

      leerFecha(fecha){
        if(fecha == null){
          return ""
        }
        return new Date(fecha).toLocaleString("es-CO")
      },

      async crearCodigo(){
        marcarActividad()
        try{
          let datos = {
            id_producto : this.id_producto
          }
          const respuesta = await axios.post(SERVIDOR + "/admin/codigos", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            if(respuesta.data.serial){
              this.ultimo_codigo = {
                serial : respuesta.data.serial,
                producto : respuesta.data.producto,
                codigo : respuesta.data.codigo_vinculacion,
                clave : respuesta.data.clave_equipo
              }
              this.codigos_creados.push(this.ultimo_codigo)
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async traerProductos(){
        try{
          const respuesta = await axios.get(SERVIDOR + "/listaproductos", this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.productos = respuesta.data.productos
            if(this.productos.length > 0 && this.id_producto == ""){
              this.id_producto = this.productos[0].id_producto
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async crearProducto(){
        marcarActividad()
        try{
          let datos = {
            id_producto : this.id_producto_nuevo,
            nombre : this.nombre_producto,
            version : this.version,
            descripcion : this.descripcion
          }
          const respuesta = await axios.post(SERVIDOR + "/guardarproducto", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            this.traerProductos()
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      }
    }
  }
</script>

<style scoped>
  .franja{
    padding: 10px 0;
    color: #ffffff;
    background: #0f3640;
  }

  .franja h1{
    margin: 0;
    letter-spacing: 3px;
  }

  .franja p{
    margin: 5px 0 0 0;
  }

  .cuerpo{
    display: flex;
    min-height: 500px;
  }

  .menu{
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 170px;
    padding: 20px 10px;
    background: #111111;
  }

  .boton_menu{
    padding: 10px;
    text-align: left;
    border: 2px solid #1e5f6f;
    border-radius: 4px;
    color: #ffffff;
    background: #111111;
    font-weight: bold;
  }

  .menu_activo{
    background: #1e5f6f;
  }

  .contenido{
    flex: 1;
    min-width: 0;
    padding: 20px;
    text-align: left;
    overflow-x: auto;
  }

  .tarjetas{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .tarjeta{
    width: 130px;
    padding: 10px;
    text-align: center;
    border: 2px solid #0f3640;
    border-radius: 6px;
  }

  .tarjeta p{
    margin: 0;
  }

  .tarjeta_alerta{
    color: #ffffff;
    background: #111111;
  }

  .numero{
    font-size: 32px;
    font-weight: bold;
  }

  .dos_tablas{
    display: flex;
    gap: 40px;
  }

  .dos_tablas > div{
    flex: 1;
  }

  .boton_accion,
  .boton_fila,
  .boton_borrar{
    padding: 8px;
    border-radius: 4px;
    border: 2px solid #111111;
    color: #ffffff;
    font-weight: bold;
  }

  .boton_accion{
    background: #0f3640;
  }

  .boton_fila{
    padding: 4px 8px;
    background: #1e5f6f;
  }

  .boton_borrar{
    padding: 4px 8px;
    background: #111111;
  }

  .casilla,
  .casilla_corta{
    box-sizing: border-box;
    margin-bottom: 10px;
    padding: 10px;
    color: #111111;
    border: 2px solid #111111;
    border-radius: 4px;
  }

  .casilla{
    display: block;
    width: 100%;
  }

  .casilla_corta{
    width: 50%;
    margin-right: 10px;
  }

  .selector_fila{
    display: block;
    width: 100%;
    margin-bottom: 4px;
    padding: 4px;
  }

  .acciones{
    min-width: 150px;
  }

  .acciones button{
    margin: 2px 4px 2px 0;
  }

  .formulario{
    max-width: 400px;
    margin-top: 20px;
  }

  .caja_codigo{
    max-width: 420px;
    margin-top: 20px;
    padding: 15px;
    border: 3px solid #0f3640;
    border-radius: 6px;
  }

  .caja_codigo p{
    margin: 4px 0;
  }

  .codigo_grande{
    font-family: Consolas, "Courier New", monospace;
    font-size: 40px;
    font-weight: bold;
    letter-spacing: 8px;
    color: #0f3640;
  }

  .codigo_tabla{
    font-family: Consolas, "Courier New", monospace;
    font-weight: bold;
    letter-spacing: 3px;
  }

  .clave_equipo{
    font-family: Consolas, "Courier New", monospace;
    font-size: 12px;
    word-break: break-all;
  }

  table{
    width: 100%;
    margin-top: 10px;
    border-collapse: collapse;
    font-size: 14px;
  }

  th{
    padding: 10px 8px;
    text-align: left;
    color: #ffffff;
    background: #1e5f6f;
  }

  td{
    padding: 8px;
    text-align: left;
    color: #111111;
    border-bottom: 1px solid #e8f1f3;
  }

  tbody tr:nth-child(even){
    background: #f4f9fa;
  }

  .pantalla{
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 720px;
    min-height: 300px;
    margin-top: 10px;
    color: #1e5f6f;
    background: #e8f1f3;
    border: 2px solid #1e5f6f;
    border-radius: 6px;
  }

  .imagen_vivo{
    display: block;
    width: 100%;
    border-radius: 4px;
  }

  .nota_vivo{
    font-size: 13px;
    color: #1e5f6f;
  }
</style>
