console.log("login.js conectado correctamente");

const loginForm = document.getElementById("login-form");

function obtenerDatosToken(token) {
    const parteCentral = token.split(".")[1];

    const datos = JSON.parse(atob(parteCentral));

    return datos;
}

loginForm.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    console.log("Formulario enviado");

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    console.log("Usuario:", usuario);
    console.log("Contraseña:", password);

    const respuesta = await fetch("http://localhost:2323/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: usuario,
            password: password
        })
    });

    const datos = await respuesta.json();

    console.log("Respuesta del servidor:", datos);

    if (respuesta.ok) {

        localStorage.setItem("token", datos.token);

        console.log("Token guardado correctamente");

        const datosToken = obtenerDatosToken(datos.token);

        console.log("Datos del token:", datosToken);
        console.log("Rol del usuario:", datosToken.rol);

        if (datosToken.rol === "alumno") {
            console.log("El usuario es alumno");
            window.location.href = "alumno.html";
        }

        if (datosToken.rol === "profesor") {
            console.log("El usuario es profesor");
            window.location.href = "profesor.html";
        }

    }

});