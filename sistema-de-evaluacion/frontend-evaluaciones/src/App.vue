<template>

  <div class="contenedor">

    <h1 class="titulo">Sistema de Evaluaciones</h1>


    <!-- LOGIN -->
    <div
      v-if="!logueado && !mostrarRegistro"
      class="pagina-login"
    >

    <img
      :src="personajeLogin"
      class="personaje-login"
      alt="Personaje de inicio de sesión"
    >
      <div class="ventana-login">


        <h2 class="subtitulo-login">Iniciar Sesión</h2>

        <form @submit.prevent="login">

          <div>
            <label>Usuario</label>

            <input
              type="text"
              v-model="usuario"
              placeholder="Ingrese usuario"
            >
          </div>

          <br>

          <div>
            <label>Contraseña</label>

            <input
              type="password"
              v-model="password"
              placeholder="Ingrese contraseña"
            >
          </div>

          <br>

          <button
            type="submit"
            :disabled="cargando"
          >
            {{ cargando ? "Iniciando sesión..." : "Iniciar Sesión" }}
          </button>

        </form>

        <p v-if="mensaje">
          {{ mensaje }}
        </p>

        <div class="ir-registro">

          <p>¿No te registraste?</p>

          <button
            type="button"
            @click="mostrarRegistro = true"
          >
            Registrarse
          </button>

        </div>

      </div>

    </div>


    <!-- REGISTRO -->
    <div
      v-if="!logueado && mostrarRegistro"
      class="pagina-registro"
    >

      <div class="ventana-registro">

        <img
          :src="personajeRegistro"
          class="personaje-registro"
          alt="Personaje de registro"
        >

        <h2 class="subtitulo-login">Crear usuario</h2>

        <form @submit.prevent="registrarUsuario">

          <div>
            <label>Usuario</label>

            <input
              type="text"
              v-model="usuarioRegistro"
              placeholder="Ingrese usuario"
            >
          </div>

          <br>

          <div>
            <label>Contraseña</label>

            <input
              type="password"
              v-model="passwordRegistro"
              placeholder="Ingrese contraseña"
            >
          </div>

          <br>

          <div>
            <label>Confirmar contraseña</label>

            <input
              type="password"
              v-model="confirmarPassword"
              placeholder="Repita la contraseña"
            >
          </div>

          <br>

          <div>
            <label>Cédula</label>

            <input
              type="number"
              v-model="cedula"
              placeholder="Ingrese cédula"
            >
          </div>

          <br>

          <div>
            <label>Rol</label>

            <select v-model="rol">

              <option value="alumno">
                Alumno
              </option>

              <option value="profesor">
                Profesor
              </option>

            </select>
          </div>

          <br>

          <button
            type="submit"
            :disabled="cargandoRegistro"
          >
            {{
              cargandoRegistro
                ? "Creando usuario..."
                : "Crear usuario"
            }}
          </button>

          <p v-if="mensajeRegistro">
            {{ mensajeRegistro }}
          </p>

        </form>

        <div class="volver-login">

          <p>¿Ya tenés una cuenta?</p>

          <button
            type="button"
            @click="mostrarRegistro = false"
          >
            Volver al login
          </button>

        </div>

      </div>

    </div>


    <!-- USUARIO LOGUEADO -->
    <div
      v-if="logueado"
      class="usuario-logueado"
    >

      <h2 class="subtitulo-logueado">¡Bienvenido!</h2>

      <p v-if="alumno">
        {{ usuario }}
      </p>

      <button @click="logout">
        Cerrar sesión
      </button>

    </div>

  </div>

</template>


<script setup>

import { ref, onMounted } from "vue"
import personajeLogin from "./assets/pj-1.png"
import personajeRegistro from "./assets/pj-2.png"


// -------------------------
// VARIABLES REACTIVAS
// -------------------------

// -------------------------
// variables para login
// -------------------------

const alumno = ref(null)
const usuario = ref("")
const password = ref("")
const mensaje = ref("")
const logueado = ref(false)
const cargando = ref(false)

// -------------------------
// VARIABLES PARA REGISTRO
// -------------------------

const mostrarRegistro = ref(false)

const usuarioRegistro = ref("")
const passwordRegistro = ref("")
const confirmarPassword = ref("")
const rol = ref("alumno")
const cedula = ref("")

const cargandoRegistro = ref(false)
const mensajeRegistro = ref("")

// -------------------------
// COMPROBAR SESIÓN AL CARGAR
// -------------------------

onMounted(async () => {

  const tokenGuardado = localStorage.getItem("token")

  console.log("Token encontrado:", tokenGuardado)

  // Si no hay token, no hacemos nada
  if (!tokenGuardado) {
    return
  }

  try {

    // Comprobamos si el token sigue siendo válido
    const respuestaAlumno = await fetch(
      "http://localhost:2323/api/alumnos/perfil",
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${tokenGuardado}`
        }
      }
    )


    const datosAlumno = await respuestaAlumno.json()


    // Si el token ya no sirve
    if (!respuestaAlumno.ok) {

      localStorage.removeItem("token")

      return
    }


    // Guardamos los datos del alumno
    alumno.value = datosAlumno

    // Marcamos que está logueado
    logueado.value = true

  } catch (error) {

    console.error(
      "Error al comprobar la sesión:",
      error
    )

  }

})


// -------------------------
// FUNCIÓN LOGIN
// -------------------------

async function login() {

  // Limpiamos mensajes anteriores
  mensaje.value = ""
  cargando.value = true
  try {

    // Enviamos usuario y contraseña al backend
    const respuesta = await fetch(
      "http://localhost:2323/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          usuario: usuario.value,
          password: password.value
        })
      }
    )


    // Convertimos la respuesta a JSON
    const datos = await respuesta.json()


    console.log(
      "Respuesta del servidor:",
      datos
    )


    // Si el backend devuelve un error
    if (!respuesta.ok) {

      mensaje.value = datos.mensaje

      return
    }


    // Guardamos el JWT
    localStorage.setItem(
      "token",
      datos.token
    )


    // Recuperamos el token
    const tokenGuardado =
      localStorage.getItem("token")


    // Pedimos el perfil del alumno
    const respuestaAlumno = await fetch(
      "http://localhost:2323/api/alumnos/perfil",
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${tokenGuardado}`
        }
      }
    )


    const datosAlumno =
      await respuestaAlumno.json()


    console.log(
      "Respuesta de alumno:",
      datosAlumno
    )


    // Si hubo un problema obteniendo el perfil
    if (!respuestaAlumno.ok) {

      localStorage.removeItem("token")

      mensaje.value =
        datosAlumno.mensaje ||
        "No se pudo obtener el perfil"

      return
    }


    // Guardamos los datos del alumno
    alumno.value = datosAlumno


    // Cambiamos la pantalla
    logueado.value = true


    console.log(
      "¿Está logueado?",
      logueado.value
    )


    } catch (error) {

    console.error(
      "Error al conectar con el servidor:",
      error
    )

    mensaje.value =
      "No se pudo conectar con el servidor"

  } finally {

    cargando.value = false

  }

}


// -------------------------
// FUNCIÓN LOGOUT
// -------------------------

function logout() {

  // Eliminamos el token
  localStorage.removeItem("token")


  // Volvemos al login
  logueado.value = false


  // Limpiamos los datos
  alumno.value = null

  usuario.value = ""

  password.value = ""

  mensaje.value = ""

}

async function registrarUsuario() {

  mensajeRegistro.value = ""
  cargandoRegistro.value = true

  try {

    const respuesta = await fetch(
      "http://localhost:2323/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: usuarioRegistro.value,
          password: passwordRegistro.value,
          confirmarPassword: confirmarPassword.value,
          rol: rol.value,
          cedula: cedula.value
        })
      }
    )

    const datos = await respuesta.json()

    console.log("Respuesta del registro:", datos)

    mensajeRegistro.value = datos.mensaje

  } catch (error) {

    console.error(
      "Error al conectar con el servidor:",
      error
    )

  } finally {

    cargandoRegistro.value = false

  }
}

</script>


<style>

body {
  font-family: Arial, sans-serif;
  margin: 0;
  min-height: 100vh;
  background: #f7f7f7;
}

.titulo {
   position: relative;
  z-index: 3;
  white-space: normal;
  line-height: 1.2;
  text-align: center;
  justify-content: center;
  margin-bottom: -20px;
  margin-top: -40px;
}

.contenedor {
  width: 90%;
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  box-sizing: border-box;
}


/* VENTANA DEL LOGIN */

.ventana-login {
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  background: white;
  border-radius: 20px;
  padding: 50px 35px 35px;
  box-shadow: 0 8px 25px rgba(20, 35, 80, 0.35);
}

.subtitulo-login {
  margin-top: 0;
  position: relative;
  z-index: 2;
}

/* PERSONAJE DEL LOGIN */

.personaje-login {
  position: relative;
  width: 160px;
  right: -160px;
  top: 53px;
  z-index: 0;
}

/* CAMPOS */

input,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

/* BOTONES */

button {
  padding: 16px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* REGISTRO */


.ventana-registro {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 50px 35px 35px;
  box-shadow: 0 8px 25px rgba(20, 35, 80, 0.35);
  margin-top: 60px;
  padding-top: 1px;
}

.subtitulo-registro {
  text-align: center;
  margin-bottom: -70px;
}

.personaje-registro {
  position: relative;
  width: 160px;
  right: -290px;
  top: 640px;
  z-index: 0;
}

</style>