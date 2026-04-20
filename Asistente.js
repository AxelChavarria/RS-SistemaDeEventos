import {Usuario} from "./Usuario.js";
import { registraUsuario, inscribirse } from "./funcionesBD.js";

export class Asistente extends Usuario{

    carnet;
    
    async registrarUsuario(){
        

        let contrasena = document.getElementById("contrasena").value.trim();
        let confirmacion = document.getElementById("confirmar-contrasena").value.trim();

        if (contrasena == confirmacion) {

            let informacion ={
                nombre: document.getElementById("nombre").value.trim(),
                apellido: document.getElementById("apellidos").value.trim(),
                carnet: document.getElementById("carne").value.trim(),
                contrasena: document.getElementById("contrasena").value.trim(),
                correo: document.getElementById("correo").value.trim()
            }

            
            registraUsuario(informacion);
        } else {

            alert("Las contraseñas no coinciden");
        }

        
    }

    async inscribirseAEvento(){

        const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

        let informacion = {
            idEvento: eventoGuardado.idEvento,
            idUsuario: usuarioGuardado.idUsuario
        }
        
        let resultado = await inscribirse(informacion);
        alert(resultado.Mensaje); // DEBUG
    }
    
}
