let direccion = "http://localhost:3000"
if (process.env.NODE_ENV == "production") {
  direccion = window.location.origin
}
export const SERVIDOR = direccion

export const MINUTOS_SESION = 30

export function marcarActividad(){
  let vence = Date.now() + MINUTOS_SESION * 60 * 1000
  localStorage.setItem("vence", vence)
}
