import { Asistente} from './Asistente.js';
import { Usuario } from './Usuario.js';
import { Organizador } from './Organizador.js';
import {  obtenerEventosProximos, notificarRechazo, notificarCancelacion, obtenerInscritos, enviarMensajeAsistentes } from './funcionesBD.js';
    
const asistente = new Asistente();
const usuario = new Usuario();
const organizador = new Organizador();

//busca el formulario de registro y escucha el evento submit
const formRegistro = document.getElementById("form-registro");
if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
        e.preventDefault();
        asistente.registrarUsuario();
    });
}

//busca el formulario de login y escucha el evento submit
const formLogin = document.getElementById("form-login");
if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        usuario.iniciarSesion();
    });
}

//busca el formulario para crear eventos y escucha el evento submit
const formCrearEvento = document.getElementById("form-crear-evento");
if (formCrearEvento) {
    formCrearEvento.addEventListener("submit", (e) => {
        e.preventDefault();
        organizador.crearEvento();
    });
}

//función para guardar localmente la información del evento
function guardarEvento(evento){

    console.log("Estoy en guardar evento");
    console.log(evento);
    let fechaOriginal = evento.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");

    let hora = tiempo.substring(0,5);
    let fechaNormal = `${day}/${month}/${year}`

    localStorage.setItem("evento", JSON.stringify({
        Titulo: evento.NombreEvento,
        Categoria: evento.Categoria,
        Fecha: fechaNormal,
        Hora: hora,
        Lugar: evento.EnlacePlenaria,
        Modalidad: evento.Modalidad,
        Cupos: evento.Cupo,
        //Unidad:
        Descripcion: evento.Descripcion
    }));
}

//busca el formulario para crear eventos y escucha el evento submit
const sectionEventos = document.getElementById("contenedor-lista-eventos");
if (sectionEventos) {
    

    let eventos = await obtenerEventosProximos();
    
    eventos.forEach(evento => {
    let fechaOriginal = evento.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");
    let hora = tiempo.substring(0,5);

    let fechaHora = `${day}/${month}/${year} ${hora}`;

    let article = document.createElement("article");
    article.classList.add("card-evento", "card-evento-horizontal");

    let enlace = document.createElement("a");
    enlace.href = `detalle-evento.html?id=${evento.idEvento}`;
    enlace.classList.add("btn", "btn-primary");
    enlace.textContent = "Ver más";

    enlace.addEventListener("click", () => {
        console.log("click detectado"); // DEBUG
        guardarEvento(evento);
    });


    article.innerHTML = `
        <div class="info-evento">
            <p><strong>Título:</strong> ${evento.NombreEvento}</p>
            <p><strong>Categoría:</strong> ${evento.Categoria}</p>
            <p><strong>Fecha:</strong> ${fechaHora}</p>
            <p><strong>Modalidad:</strong> ${evento.Modalidad}</p>
        </div>

    `;

    
    let divAccion = document.createElement("div");
    divAccion.classList.add("accion-evento");

    divAccion.appendChild(enlace);
    article.appendChild(divAccion);

    sectionEventos.appendChild(article);

});
}

// ENVIAR MENSAJE A ASISTENTES (organizador)
// TODO: quien construya la lista de eventos del organizador debe guardar el id así antes de navegar acá:
// localStorage.setItem("idEventoSeleccionado", evento.idEvento)
const listaDestinatarios = document.getElementById("lista-destinatarios");
if (listaDestinatarios) {

    // cargar inscritos y mostrar checkboxes
    const idEvento = localStorage.getItem("idEventoSeleccionado");
    const inscritos = await obtenerInscritos(idEvento);

    inscritos.forEach(inscrito => {
        const label = document.createElement("label");
        label.style.display = "block";
        label.innerHTML = `
            <input type="checkbox" value="${inscrito.CorreoElectronico}" checked>
            ${inscrito.NombreUsuario} (${inscrito.CorreoElectronico})
        `;
        listaDestinatarios.appendChild(label);
    });

    // enviar mensaje al hacer submit
    document.getElementById("form-enviar-mensaje").addEventListener("submit", async (e) => {
        e.preventDefault();

        // recoger solo los correos cuyo checkbox está marcado
        const checkboxes = listaDestinatarios.querySelectorAll("input[type='checkbox']:checked");
        const correos = Array.from(checkboxes).map(cb => cb.value);

        const asunto = document.getElementById("asunto").value;
        const mensaje = document.getElementById("mensaje").value;

        const resultado = await enviarMensajeAsistentes(correos, asunto, mensaje);

        if (resultado.Codigo === 0) {
            alert("Mensaje enviado correctamente.");
        } else {
            alert("Error al enviar: " + resultado.Mensaje);
        }
    });
}


// EDITOR EVENTO ADMIN (cancelacion)
// TODO: quien construya la lista de eventos admin debe guardar el id así antes de navegar acá:
// localStorage.setItem("idEventoSeleccionado", evento.idEvento)
const btnEliminar = document.getElementById("btn-eliminar-evento");
if (btnEliminar) {

    const seccionCancelacion = document.getElementById("seccion-cancelacion");

    // mostrar seccion al hacer clic en "Eliminar Evento"
    btnEliminar.addEventListener("click", () => {
        seccionCancelacion.style.display = "block";
    });

    // ocultar seccion al hacer clic en "Cancelar"
    document.getElementById("btn-cancelar-cancelacion").addEventListener("click", () => {
        seccionCancelacion.style.display = "none";
    });

    // confirmar cancelacion
    document.getElementById("btn-confirmar-cancelacion").addEventListener("click", async () => {
        const idEvento = localStorage.getItem("idEventoSeleccionado");
        const motivo = document.getElementById("motivo-cancelacion").value;

        const resultado = await notificarCancelacion(idEvento, motivo);

        if (resultado.Codigo === 0) {
            alert("Cancelación notificada a los inscritos correctamente.");
            window.location.href = "moderacion.html"; 
        } else {
            alert("Error al notificar: " + resultado.Mensaje);
        }
    });
}


// DETALLES EVENTO ADMIN (rechazo) 
// TODO: quien construya la lista de eventos admin debe guardar el id así antes de navegar acá:
// localStorage.setItem("idEventoSeleccionado", evento.idEvento)
const formRechazo = document.getElementById("form-rechazo");
if (formRechazo) {

    // la seccion de rechazo empieza oculta
    formRechazo.closest("section").style.display = "none";

    // mostrar seccion al hacer clic en "Rechazar"
    document.getElementById("btn-rechazar").addEventListener("click", () => {
        formRechazo.closest("section").style.display = "block";
    });

    // ocultar seccion al hacer clic en "Cancelar"
    document.getElementById("btn-cancelar-rechazo").addEventListener("click", () => {
        formRechazo.closest("section").style.display = "none";
    });

    // confirmar rechazo
    formRechazo.addEventListener("submit", async (e) => {
        e.preventDefault();

        const idEvento = localStorage.getItem("idEventoSeleccionado");
        const motivo = document.getElementById("motivo-rechazo").value;

        const resultado = await notificarRechazo(idEvento, motivo);

        if (resultado.Codigo === 0) {
            alert("Rechazo notificado al organizador correctamente.");
            window.location.href = "eventos-admin.html";
        } else {
            alert("Error al notificar: " + resultado.Mensaje);
        }
    });
}


//detalle del evento
const sectionDetalle = document.getElementById("detalle-evento");
if (sectionDetalle) {
    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    console.log(eventoGuardado);

    sectionDetalle.innerHTML = `
        <div class="detalle-evento-info">
                <div id="contenedor-info-evento">
                    <p><strong>Título:</strong> ${eventoGuardado.Titulo}</p>
                    <p><strong>Categoria:</strong> ${eventoGuardado.Categoria}</p>
                    <p><strong>Fecha:</strong> ${eventoGuardado.Fecha}</p>
                    <p><strong>Hora:</strong> ${eventoGuardado.Hora}</p>
                    <p><strong>Lugar:</strong> ${eventoGuardado.Lugar}</p>
                    <p><strong>Modalidad:</strong> ${eventoGuardado.Modalidad}</p>
                    <p><strong>Cupos disponibles:</strong> ${eventoGuardado.Cupos}</p>
                    <p><strong>Organizador:</strong> ${eventoGuardado.Organizador}</p>
                </div>
            </div>

            <div class="detalle-evento-descripcion">
                <h3 class="subtitulo-seccion">Descripción del Evento:</h3>

                <!--
                    DESCRIPCION TEMPORAL
                    IMPORTANTE:
                    Este bloque debe ser reemplazado por la descripcion real
                    del evento consultado.
                -->
                <div id="contenedor-descripcion-evento" class="descripcion-box">
                    <p>
                        ${eventoGuardado.Descripcion }
                    </p>
                </div>

                <!--
                    BOTONES DE ACCION
                -->
                <form id="form-inscripcion">
                    <div class="detalle-evento-acciones">
                        <!-- este input luego llevara el id del evento -->
                        <!--IMPORTANTE: no estoy segura de si es necesario, pero podria ser util para el backend saber a que evento se esta inscribiendo el usuario-->
                        <input type="hidden" id="evento_id" name="evento_id" value="ID_DEL_EVENTO">
                        <button type="submit" class="btn btn-primary">Inscribirse</button>
                        <a href="eventos.html" class="btn btn-secondary">Cancelar</a>
                        
                    </div>
                </form>
                
            </div>
    `;

    sectionDetalle.appendChild(article);
}


