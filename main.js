import { Asistente} from './Asistente.js';
import { Usuario } from './Usuario.js';
import { Organizador } from './Organizador.js';
import {  obtenerEventosProximos } from './funcionesBD.js';
    
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
