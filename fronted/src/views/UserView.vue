<template>
  <div class="usuario">
    <h1>EMERGENCIA</h1>
    <p>{{ mensaje }}</p>

    <div class="pestanas" v-if="token != ''">
      <button :class="clasePestana('datos')" @click="cambiarPestana('datos')">MIS DATOS</button>
      <button :class="clasePestana('dispositivos')" @click="cambiarPestana('dispositivos')">MIS DISPOSITIVOS</button>
      <button :class="clasePestana('alertas')" @click="cambiarPestana('alertas')">ALERTAS</button>
      <button :class="clasePestana('vivo')" @click="cambiarPestana('vivo')">LIVE STREAM</button>
    </div>

    <div class="listado" v-if="token != '' && pestana == 'datos'">
      <div class="fila_dato"><span><b>CÉDULA:</b> {{ usuario.cedula }}</span></div>

      <div class="fila_dato" v-if="editando != 'nombre'">
        <span><b>NOMBRE:</b> {{ usuario.nombre }}</span>
        <button class="boton_lapiz" title="editar nombre" @click="editar('nombre', usuario.nombre)">✎</button>
      </div>
      <div class="fila_dato" v-else>
        <input class="casilla_fila" type="text" v-model="valor_editado" @keyup.enter="cambiarNombre">
        <span class="botones_lapiz">
          <button class="boton_lapiz" title="guardar" @click="cambiarNombre">✔</button>
          <button class="boton_lapiz" title="cancelar" @click="cancelarEdicion">✕</button>
        </span>
      </div>

      <div class="fila_dato"><span><b>CORREO:</b> {{ usuario.correo }}</span></div>
      <div class="fila_dato"><span><b>TELÉFONO:</b> {{ usuario.telefono }}</span></div>
      <div class="fila_dato"><span><b>ID USUARIO:</b> {{ usuario.id_usuario }}</span></div>
      <div class="fila_dato"><span><b>ROL:</b> {{ usuario.id_rol }} - {{ rol }}</span></div>
    </div>

    <div class="seccion" v-if="token != '' && pestana == 'dispositivos'">
      <table>
        <thead>
          <tr>
            <th>Serial</th>
            <th>Nombre</th>
            <th>Ubicación</th>
            <th>Conexión</th>
            <th>Batería</th>
            <th>Permiso</th>
            <th>Al detectar</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="disp in dispositivos" :key="disp.serial">
            <td>{{ disp.serial }}</td>

            <td>
              <div class="celda_editable" v-if="editando != 'nombre_' + disp.serial">
                <span>{{ disp.nombre }}</span>
                <button class="boton_lapiz" v-if="disp.permiso == 'dueno'" title="editar nombre" @click="editar('nombre_' + disp.serial, disp.nombre)">✎</button>
              </div>
              <div class="celda_editable" v-else>
                <input class="casilla_fila" type="text" v-model="valor_editado" @keyup.enter="guardarDispositivo(disp, 'nombre')">
                <button class="boton_lapiz" title="guardar" @click="guardarDispositivo(disp, 'nombre')">✔</button>
                <button class="boton_lapiz" title="cancelar" @click="cancelarEdicion">✕</button>
              </div>
            </td>
            <td>
              <div class="celda_editable" v-if="editando != 'ubicacion_' + disp.serial">
                <span>{{ disp.ubicacion }}</span>
                <button class="boton_lapiz" v-if="disp.permiso == 'dueno'" title="editar ubicación" @click="editar('ubicacion_' + disp.serial, disp.ubicacion)">✎</button>
              </div>
              <div class="celda_editable" v-else>
                <input class="casilla_fila" type="text" v-model="valor_editado" @keyup.enter="guardarDispositivo(disp, 'ubicacion')">
                <button class="boton_lapiz" title="guardar" @click="guardarDispositivo(disp, 'ubicacion')">✔</button>
                <button class="boton_lapiz" title="cancelar" @click="cancelarEdicion">✕</button>
              </div>
            </td>

            <td>{{ disp.conexion }}</td>
            <td>
              <div class="bateria" v-if="disp.bateria != null">
                <div :class="claseBateria(disp.bateria)" :style="{ width : disp.bateria + '%' }"></div>
              </div>
              {{ textoBateria(disp.bateria) }}
            </td>
            <td>{{ textoPermiso(disp.permiso) }}</td>
            <td>
              <div class="celda_reaccion" v-if="disp.permiso == 'dueno'">
                <label><input type="checkbox" v-model="disp.reaccion.rele_1"> RELÉ 1</label>
                <label><input type="checkbox" v-model="disp.reaccion.rele_2"> RELÉ 2</label>
                <input class="casilla_segundos" type="number" min="1" max="120" v-model.number="disp.reaccion.segundos"> s
                <button class="boton_lapiz" title="guardar" @click="guardarReaccion(disp)">✔</button>
              </div>
              <span v-else>{{ textoReaccion(disp.reaccion) }}</span>
            </td>
            <td>
              <button class="boton_fila" v-if="disp.permiso != 'ver'" @click="apagarAlarma(disp.serial)">APAGAR</button>
              <button class="boton_fila" @click="verEnVivo(disp.serial)">VER</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="dispositivos.length == 0">todavía no tienes dispositivos</p>

      <div class="formulario">
        <h3>VINCULAR DISPOSITIVO</h3>
        <input class="casilla" type="text" v-model="serial" placeholder="SERIAL (VA-000123)">
        <input class="casilla" type="text" v-model="codigo" placeholder="CÓDIGO DE LA CAJA">
        <input class="casilla" type="text" v-model="nombre_dispositivo" placeholder="NOMBRE (OPCIONAL)">
        <input class="casilla" type="text" v-model="ubicacion" placeholder="UBICACIÓN (OPCIONAL)">
        <button class="boton_accion" @click="vincularDispositivo">VINCULAR</button>
      </div>
    </div>

    <div class="seccion" v-if="token != '' && pestana == 'alertas'">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Dispositivo</th>
            <th>Nivel</th>
            <th>Estado</th>
            <th>Atendida por</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alerta in alertas" :key="alerta.id_alerta">
            <td>{{ leerFecha(alerta.fecha_hora) }}</td>
            <td>{{ alerta.nombre }} ({{ alerta.serial }})</td>
            <td>{{ alerta.nivel }}</td>
            <td>{{ alerta.estado }}</td>
            <td>{{ alerta.desactivada_por }}</td>
            <td>
              <button class="boton_fila" v-if="alerta.estado == 'activa'" @click="atenderAlerta(alerta.id_alerta)">ATENDER</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="alertas.length == 0">no hay alertas</p>
    </div>

    <div class="seccion" v-if="token != '' && pestana == 'vivo'">
      <select class="casilla selector_vivo" v-model="serial_vivo" @change="cambiarCamara">
        <option value="">ESCOGE UN DISPOSITIVO</option>
        <option v-for="disp in dispositivos" :key="disp.serial" :value="disp.serial">{{ disp.nombre }} ({{ disp.serial }})</option>
      </select>

      <div class="pantalla">
        <img class="imagen_vivo" v-if="foto_vivo != ''" :src="foto_vivo" alt="última foto del dispositivo">
        <p v-else>{{ aviso_vivo }}</p>
      </div>
      <p class="nota_vivo" v-if="hora_foto != ''">foto del {{ hora_foto }}</p>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import { SERVIDOR, marcarActividad } from '../servidor'

  export default {
    name: 'UserView',
    data(){
      return {
        mensaje : "",
        token : "",
        usuario : {},
        rol : "",
        pestana : "datos",
        actualizador : null,
        editando : "",
        valor_editado : "",
        dispositivos : [],
        serial : "",
        codigo : "",
        nombre_dispositivo : "",
        ubicacion : "",
        alertas : [],
        serial_vivo : "",
        foto_vivo : "",
        id_foto_vivo : "",
        hora_foto : "",
        aviso_vivo : "escoge un dispositivo para verlo",
        camara : null
      }
    },
    mounted(){
      this.cargarUsuario()
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

      async cargarUsuario(){
        let token_guardado = localStorage.getItem("token")
        if(token_guardado == null){
          this.$router.push("/")
          return
        }
        this.token = token_guardado

        try{
          const perfil = await axios.get(SERVIDOR + "/perfil", this.conToken())
          if(this.revisarRespuesta(perfil)){
            this.usuario = perfil.data.usuario
            this.rol = perfil.data.rol
            localStorage.setItem("nombre", this.usuario.nombre)
            localStorage.setItem("rol", this.usuario.id_rol)
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      cambiarPestana(nombre){
        marcarActividad()
        this.pestana = nombre
        this.mensaje = ""
        this.editando = ""
        if(nombre == "dispositivos"){
          this.traerDispositivos()
        }else if(nombre == "alertas"){
          this.traerAlertas()
        }else if(nombre == "vivo"){
          this.traerDispositivos()
          this.traerUltimaFoto()
        }
      },

      clasePestana(nombre){
        if(this.pestana == nombre){
          return "boton_pestana pestana_activa"
        }
        return "boton_pestana"
      },

      actualizarSolo(){
        if(this.token == ""){
          return
        }
        if(this.pestana == "dispositivos"){
          this.traerDispositivos()
        }else if(this.pestana == "alertas"){
          this.traerAlertas()
        }
      },

      editar(casilla, valor_actual){
        marcarActividad()
        this.editando = casilla
        if(valor_actual){
          this.valor_editado = valor_actual
        }else{
          this.valor_editado = ""
        }
      },

      cancelarEdicion(){
        this.editando = ""
        this.valor_editado = ""
      },

      async cambiarNombre(){
        marcarActividad()
        try{
          let datos = {
            nombre : this.valor_editado
          }
          const respuesta = await axios.put(SERVIDOR + "/perfil/nombre", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            if(respuesta.data.nombre){
              this.usuario.nombre = respuesta.data.nombre
              localStorage.setItem("nombre", respuesta.data.nombre)
              this.cancelarEdicion()
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async traerDispositivos(){
        try{
          const propios = await axios.get(SERVIDOR + "/listadispositivos", this.conToken())
          if(this.revisarRespuesta(propios) == false){
            return
          }
          const compartidos = await axios.get(SERVIDOR + "/compartidos", this.conToken())
          if(this.revisarRespuesta(compartidos) == false){
            return
          }
          this.dispositivos = propios.data.dispositivos.concat(compartidos.data.dispositivos)

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async vincularDispositivo(){
        marcarActividad()
        try{
          let datos = {
            serial : this.serial,
            codigo : this.codigo,
            nombre : this.nombre_dispositivo,
            ubicacion : this.ubicacion
          }
          const respuesta = await axios.post(SERVIDOR + "/vincular", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            if(respuesta.data.mensaje == "dispositivo vinculado"){
              this.serial = ""
              this.codigo = ""
              this.nombre_dispositivo = ""
              this.ubicacion = ""
              this.traerDispositivos()
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async guardarDispositivo(disp, campo){
        marcarActividad()
        let datos = {}
        if(campo == "nombre"){
          datos.nombre = this.valor_editado
        }else{
          datos.ubicacion = this.valor_editado
        }
        try{
          const respuesta = await axios.put(SERVIDOR + "/dispositivo/" + disp.serial + "/nombre", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            if(respuesta.data.mensaje == "dispositivo actualizado"){
              disp.nombre = respuesta.data.nombre
              disp.ubicacion = respuesta.data.ubicacion
              this.cancelarEdicion()
            }
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async guardarReaccion(disp){
        marcarActividad()
        let datos = {
          rele_1 : disp.reaccion.rele_1,
          rele_2 : disp.reaccion.rele_2,
          segundos : disp.reaccion.segundos
        }
        try{
          const respuesta = await axios.put(SERVIDOR + "/dispositivo/" + disp.serial + "/reaccion", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje + " en " + disp.serial
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      textoReaccion(reaccion){
        if(reaccion == null){
          return ""
        }
        let reles = []
        if(reaccion.rele_1){
          reles.push("relé 1")
        }
        if(reaccion.rele_2){
          reles.push("relé 2")
        }
        if(reles.length == 0){
          return "ningún relé"
        }
        return reles.join(" + ") + " por " + reaccion.segundos + " s"
      },

      async apagarAlarma(serial){
        marcarActividad()
        try{
          let datos = {
            serial : serial,
            accion : "apagar_alarma"
          }
          const respuesta = await axios.post(SERVIDOR + "/ordenes", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje + " a " + serial
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      textoBateria(bateria){
        if(bateria == null){
          return "sin dato"
        }else if(bateria <= 20){
          return bateria + "% baja"
        }else if(bateria <= 40){
          return bateria + "% media"
        }
        return bateria + "%"
      },

      textoPermiso(permiso){
        if(permiso == "dueno"){
          return "dueño"
        }
        return permiso
      },

      claseBateria(bateria){
        if(bateria <= 20){
          return "bateria_nivel bateria_baja"
        }
        return "bateria_nivel"
      },

      async traerAlertas(){
        try{
          const respuesta = await axios.get(SERVIDOR + "/alertas", this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.alertas = respuesta.data.alertas
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async atenderAlerta(id_alerta){
        marcarActividad()
        let comentario = prompt("comentario (opcional)")
        if(comentario == null){
          return
        }
        try{
          let datos = {
            comentario : comentario
          }
          const respuesta = await axios.put(SERVIDOR + "/alertas/" + id_alerta + "/atender", datos, this.conToken())
          if(this.revisarRespuesta(respuesta)){
            this.mensaje = respuesta.data.mensaje
            this.traerAlertas()
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

      leerFecha(fecha){
        if(fecha == null){
          return ""
        }
        return new Date(fecha).toLocaleString("es-CO")
      }
    }
  }
</script>

<style scoped>
  .pestanas{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .boton_pestana,
  .boton_accion,
  .boton_fila{
    padding: 8px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  }

  .boton_pestana{
    width: 170px;
    color: #0f3640;
    background: #e8f1f3;
    border: 2px solid #1e5f6f;
  }

  .pestana_activa{
    color: #ffffff;
    background: #1e5f6f;
  }

  .boton_accion{
    width: 160px;
    color: #ffffff;
    background: #1e5f6f;
    border: 2px solid #0f3640;
  }

  .boton_fila{
    margin: 2px 4px 2px 0;
    padding: 4px 8px;
    color: #ffffff;
    background: #1e5f6f;
    border: 2px solid #0f3640;
  }

  .listado{
    box-sizing: border-box;
    width: 80%;
    max-width: 450px;
    margin: 0 auto;
    padding: 10px 14px;
    text-align: left;
    color: #111111;
    background: #f4f9fa;
    border: 2px solid #1e5f6f;
    border-radius: 6px;
  }

  .fila_dato{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    border-bottom: 1px solid #e8f1f3;
  }

  .fila_dato:last-child{
    border-bottom: none;
  }

  .celda_editable{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .boton_lapiz{
    padding: 2px 6px;
    font-size: 18px;
    color: #1e5f6f;
    background: none;
    border: none;
    cursor: pointer;
  }

  .botones_lapiz{
    display: flex;
    flex-shrink: 0;
  }

  .boton_lapiz:hover{
    color: #0f3640;
    background: #e8f1f3;
    border-radius: 4px;
  }

  .celda_reaccion{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .casilla_segundos{
    width: 56px;
    padding: 4px 6px;
    color: #111111;
    border: 2px solid #1e5f6f;
    border-radius: 4px;
  }

  .casilla_fila{
    box-sizing: border-box;
    width: 100%;
    min-width: 90px;
    padding: 5px 8px;
    color: #111111;
    border: 2px solid #1e5f6f;
    border-radius: 4px;
  }

  .seccion{
    width: 90%;
    max-width: 1000px;
    margin: 0 auto;
  }

  .casilla{
    display: block;
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    color: #111111;
    border: 2px solid #1e5f6f;
    border-radius: 4px;
  }

  .formulario{
    width: 100%;
    max-width: 400px;
    margin: 20px auto;
  }

  table{
    width: 100%;
    margin-top: 10px;
    border-collapse: collapse;
    font-size: 14px;
  }

  th{
    padding: 10px 12px;
    text-align: left;
    color: #ffffff;
    background: #1e5f6f;
  }

  td{
    padding: 8px 12px;
    text-align: left;
    color: #111111;
    border-bottom: 1px solid #e8f1f3;
  }

  tbody tr:nth-child(even){
    background: #f4f9fa;
  }

  .bateria{
    width: 60px;
    height: 8px;
    border: 1px solid #1e5f6f;
    border-radius: 2px;
  }

  .bateria_nivel{
    height: 100%;
    background: #1e5f6f;
  }

  .bateria_baja{
    background: #111111;
  }

  .selector_vivo{
    max-width: 400px;
    margin: 0 auto 15px auto;
  }

  .pantalla{
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 720px;
    min-height: 300px;
    margin: 0 auto;
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
