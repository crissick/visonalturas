<template>
  <p class="presentacion_hora">{{ hora }}</p>

  <nav>
    <router-link to="/">USUARIOS</router-link> |
    <router-link to="/usuario">EMERGENCIA</router-link>
    <span v-if="es_admin"> | <router-link to="/admin">ADMIN</router-link></span>
  </nav>

  <div class="barra_usuario" v-if="nombre_usuario != ''">
    <span class="nombre_usuario">{{ nombre_usuario }}</span>
    <span class="tiempo_sesion">SESIÓN {{ tiempo_sesion }}</span>
    <button class="boton_salir" @click="cerrarSesion('')">CERRAR SESIÓN</button>
  </div>

  <router-view/>
</template>

<script>
  import axios from 'axios'
  import { SERVIDOR } from './servidor'

  export default {
    name: 'App',
    data(){
      return {
        hora : "",
        hora_utc : null,
        marca : 0,
        reloj : null,
        sincronizador : null,
        nombre_usuario : "",
        es_admin : false,
        segundos_sesion : 0,
        revisor : null
      }
    },
    computed:{
      tiempo_sesion(){
        let minutos = Math.floor(this.segundos_sesion / 60)
        let segundos = this.segundos_sesion % 60
        let texto_segundos = String(segundos)
        if(segundos < 10){
          texto_segundos = "0" + segundos
        }
        return minutos + ":" + texto_segundos
      }
    },
    mounted(){
      this.sincronizarHora()
      this.reloj = setInterval(this.mostrarHora, 1000)
      this.sincronizador = setInterval(this.sincronizarHora, 60000)
      this.revisor = setInterval(this.revisarSesion, 1000)
    },
    unmounted(){
      clearInterval(this.reloj)
      clearInterval(this.sincronizador)
      clearInterval(this.revisor)
    },
    methods:{
      async sincronizarHora(){
        try{
          const respuesta = await axios.get(SERVIDOR + "/hora")
          this.hora_utc = new Date(respuesta.data.hora).getTime()
          this.marca = performance.now()
          this.mostrarHora()

        }catch(error){
          const mensaje = "sin hora o conexion eth"
          this.hora_utc = null
          this.hora = mensaje
        }
      },
      mostrarHora(){
        if(this.hora_utc == null){
          return
        }
        let pasado = performance.now() - this.marca
        let ahora = new Date(this.hora_utc + pasado)
        this.hora = ahora.toISOString().substring(11, 19) + " UTC"
      },

      revisarSesion(){
        let token = localStorage.getItem("token")
        let nombre = localStorage.getItem("nombre")
        if(token == null || nombre == null){
          this.nombre_usuario = ""
          this.es_admin = false
          return
        }
        this.nombre_usuario = nombre
        this.es_admin = false
        if(localStorage.getItem("rol") == "1"){
          this.es_admin = true
        }

        let vence = Number(localStorage.getItem("vence"))
        let faltan = Math.round((vence - Date.now()) / 1000)
        if(faltan <= 0){
          this.cerrarSesion("sesión cerrada por inactividad")
        }else{
          this.segundos_sesion = faltan
        }
      },

      async cerrarSesion(aviso){
        let token = localStorage.getItem("token")
        localStorage.removeItem("token")
        localStorage.removeItem("nombre")
        localStorage.removeItem("vence")
        localStorage.removeItem("rol")
        this.nombre_usuario = ""
        this.es_admin = false

        try{
          await axios.post(SERVIDOR + "/logout", {}, {
            headers : { "access-token" : token }
          })
        }catch(error){
          console.log("no se pudo avisar al servidor")
        }

        if(aviso != ""){
          alert(aviso)
        }
        this.$router.push("/")
      }
    }
  }
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #111111;
}

.presentacion_hora {
  position: fixed;
  top: 6px;
  left: 6px;
  z-index: 10;
  margin: 0;
  padding: 3px 8px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 1.5px;
  color: #111111;
  background: #ffffff;
  border: 2px solid #111111;
  border-radius: 6px;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #111111;
}

nav a.router-link-exact-active {
  color: #1e5f6f;
}

.barra_usuario {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: -15px 0 15px 0;
}

.nombre_usuario {
  font-weight: bold;
  color: #0f3640;
}

.tiempo_sesion {
  font-family: Consolas, "Courier New", monospace;
  font-weight: bold;
  color: #1e5f6f;
}

.boton_salir {
  padding: 6px 10px;
  border-radius: 4px;
  border: 2px solid #111111;
  color: #ffffff;
  background: #111111;
  font-weight: bold;
}
</style>
