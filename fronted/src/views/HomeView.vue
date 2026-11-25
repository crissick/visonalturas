<template>
  <div class="home">
    <div class="barra_superior">
      <button class="boton_login" @click="mostrarLogin">LOGIN</button>
      <button class="boton_registro" @click="mostrarRegistro">REGISTRO</button>
    </div>

    <div class="columna">
        <div v-if="pestana == 'login'">
          <h2>LOGIN</h2>
          <input class="casilla" type="email" v-model="correo" placeholder="CORREO">
          <input class="casilla" type="password" v-model="clave" placeholder="CLAVE">
          <p>{{ correo }}</p>
          <button class="boton_entrar" @click="ingresar">ENTRAR</button>
          <p>{{ mensaje }}</p>
        </div>

        <div v-else>
          <h2>REGISTRO</h2>
          <input class="casilla" type="number" v-model="cedula" placeholder="CÉDULA">
          <input class="casilla" type="text" v-model="nombre" placeholder="NOMBRE">
          <input class="casilla" type="tel" v-model="telefono" placeholder="TELÉFONO (PARA LAS LLAMADAS)">
          <input class="casilla" type="email" v-model="correo" placeholder="CORREO">
          <input class="casilla" type="password" v-model="clave" placeholder="CLAVE (MÍNIMO 6)">
          <p>{{ nombre }}</p>
          <button class="boton_entrar" @click="registrar">REGISTRARME</button>
          <p>{{ mensaje }}</p>
        </div>
    </div>

    <div class="columna">
      <img class="logo" src="../assets/logo_vision.svg" width="220">
      <h1 class="titulo">VISIÓN DE ALTURAS</h1>
    </div>

    <h1 class="lema">COMPROMETIDO CON LA SEGURIDAD</h1>
  </div>
</template>

<script>
  import '@fontsource/orbitron/700.css'
  import axios from 'axios'
  import { SERVIDOR, marcarActividad } from '../servidor'

  export default {
    name: 'HomeView',
    data(){
      return {
        contador : 0,
        pestana : "login",
        cedula : "",
        nombre : "",
        telefono : "",
        correo : "",
        clave : "",
        mensaje : "",
        token : ""
      }
    },
    methods:{
      incrementar(){
        this.contador = this.contador + 2
      },
      mostrarLogin(){
        this.pestana = "login"
        this.mensaje = ""
      },
      mostrarRegistro(){
        this.pestana = "registro"
        this.mensaje = ""
      },

      async ingresar(){
        try{
          let datos = {
            correo : this.correo,
            clave : this.clave
          }
          const respuesta = await axios.post(SERVIDOR + "/login", datos)
          this.mensaje = respuesta.data.mensaje

          if(respuesta.data.check){
            let token_recibido = respuesta.data.token
            this.token = token_recibido
            localStorage.setItem("token", token_recibido)
            marcarActividad()
            this.$router.push("/usuario")
          }else{
            this.token = ""
            localStorage.removeItem("token")
          }

        }catch(error){
          const mensaje = "sin conexion con el servidor"
          this.mensaje = mensaje
        }
      },

      async registrar(){
        try{
          let datos = {
            cedula : this.cedula,
            nombre : this.nombre,
            telefono : this.telefono,
            correo : this.correo,
            clave : this.clave
          }
          const respuesta = await axios.post(SERVIDOR + "/registro", datos)

          if(respuesta.data.mensaje == "registro correctamente guardado"){
            this.pestana = "login"
            this.clave = ""
            this.mensaje = "cuenta creada: ya puedes entrar"
          }else{
            this.mensaje = respuesta.data.mensaje
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
  .barra_superior{
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 10px 0 20px;
  }

  .columna{
    max-width: 450px;
    margin: 0 auto 20px;
    padding: 0 16px;
  }

  .logo{
    display: block;
    max-width: 60%;
    height: auto;
    margin: 10px auto 0;
  }

  .titulo{
    font-family: "Orbitron", Arial, sans-serif;
    font-weight: 700;
    font-size: clamp(20px, 6vw, 32px);
    letter-spacing: 3px;
    white-space: nowrap;
    color: #111111;
  }

  .lema{
    padding: 0 16px;
    font-size: clamp(20px, 5vw, 32px);
  }

  .casilla{
    display: block;
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    color: #111111;
    border: 2px solid #111111;
    border-radius: 4px;
  }

  .contador_incremental,
  .boton_login,
  .boton_registro,
  .boton_entrar{
    padding: 8px;
    border-radius: 4px;
    border: 2px solid #111111;
    color: #ffffff;
    font-weight: bold;
  }

  .contador_incremental{
    width: 300px;
    background: #111111;
  }

  .boton_login{
    width: 140px;
    background: #0f3640;
  }

  .boton_registro{
    width: 140px;
    background: #1e5f6f;
  }

  .boton_entrar{
    width: 140px;
    background: #0f3640;
  }
</style>
