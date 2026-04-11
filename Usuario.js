import {loginUsuario} from "./funcionesBD.js";

export class Usuario{

    nombre;
    apellido;
    contraseña;
    correo;
    idUsuario;


    async iniciarSesion(){

        let informacion = {
            correo: document.getElementById("correo").value.trim(),
            contrasena: document.getElementById("contrasena").value.trim()
        }

        let respuesta = await loginUsuario(informacion);

        if (respuesta.Codigo === 0){
            if (respuesta.Rol === "ASISTENTE") {
                window.location.href = "../views/estudiante/inicio-estudiante.html";
            } else if (respuesta.Rol === "ORGANIZADOR") {
                window.location.href = "../views/organizador/inicio-organizador.html";
            } else if (respuesta.Rol === "ADMINISTRADOR") {
                window.location.href = "../views/administrador/inicio-admin.html";
            } else {
                alert("Rol no reconocido");
            }
        
        } else {

            alert(respuesta.Mensaje);
        }

    }

    async restablecerContraseña(correo, contraseña){}

}