import { Asistente } from "./Asistente.js";
import { crearEvento, obtenerInscritos, enviarMensajeAsistentes } from "./funcionesBD.js";

export class Organizador extends Asistente{

    listaEventos;

    async enviarCorreo(){

        let asunto = document.getElementById("asunto").value.trim();
        let mensaje = document.getElementById("mensaje").value.trim();
        
        const seleccionarTodos = document.getElementById("seleccionarTodos");

        // Seleccionar / deseleccionar todos
        seleccionarTodos.addEventListener("change", () => {
            const checkboxes = document.querySelectorAll('input[name="destinatarios"]');

            checkboxes.forEach(cb => {
                cb.checked = seleccionarTodos.checked;
            });
        });

        //Sincronizar el checkbox principal
        document.addEventListener("change", (e) => {
            if (e.target.name === "destinatarios") {
                const todos = document.querySelectorAll('input[name="destinatarios"]');
                const seleccionados = document.querySelectorAll('input[name="destinatarios"]:checked');

                seleccionarTodos.checked = todos.length === seleccionados.length;
            }
        });

        // ✅ Obtener lista de seleccionados
        document.getElementById("btnObtener").addEventListener("click", () => {
            const seleccionados = Array.from(
                document.querySelectorAll('input[name="destinatarios"]:checked')
            ).map(cb => cb.value);

        });

        enviarMensajeAsistentes(seleccionados, asunto, mensaje);
    }

    modificarEventoPendiente(){}

    async verParticipantes(){
        const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
        let inscritos = await obtenerInscritos(eventoGuardado.idEvento);
        return inscritos;
    }

    confirmarAsistencia(idEvento){}

    crearSolicitud(motivo, idEvento){}

    async crearEvento(){

        const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

       
        let informacion = {

            idOrganizador: usuarioGuardado.idUsuario, // usuario Axel
            nombre: document.getElementById("nombre").value.trim(),
            categoria: document.getElementById("categoria").value.trim(),
            fecha: document.getElementById("fecha").value.trim(),
            modalidad: document.getElementById("modalidad").value.trim(),
            enlace: document.getElementById("enlace").value.trim(),
            cupo: document.getElementById("cupo").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim()
        }

        let respuesta = await crearEvento(informacion);

        alert(respuesta.Mensaje);

    }
}