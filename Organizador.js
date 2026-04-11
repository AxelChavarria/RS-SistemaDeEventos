import { Asistente } from "./Asistente.js";
import { crearEvento } from "./funcionesBD.js";

export class Organizador extends Asistente{

    listaEventos;

    enviarCorreo(){}

    modificarEventoPendiente(){}

    verParticipantes(evento){}

    confirmarAsistencia(idEvento){}

    crearSolicitud(motivo, idEvento){}

    async crearEvento(){

        console.log(localStorage.getItem("usuario"));
        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

        if (usuarioGuardado) {
            const idUsuario = usuarioGuardado.idUsuario;
        }
        let informacion ={

            idOrganizador: idUsuario, // usuario Axel
            nombre: document.getElementById("nombre").value.trim(),
            categoria: document.getElementById("categoria").value.trim(),
            fecha: document.getElementById("fecha").value.trim(),
            modalidad: document.getElementById("modalidad").value.trim(),
            enlace: document.getElementById("enlace").value.trim(),
            cupo: document.getElementById("cupo").value.trim()
        }

        let respuesta = await crearEvento(informacion);

        alert(respuesta.Mensaje);

    }
}