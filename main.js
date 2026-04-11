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

//busca el formulario para crear eventos y escucha el evento submit
const sectionEventos = document.getElementById("contenedor-lista-eventos");
console.log(1);
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

    article.innerHTML = `
        <div class="info-evento">
            <p><strong>Título:</strong> ${evento.NombreEvento}</p>
            <p><strong>Categoría:</strong> ${evento.Categoria}</p>
            <p><strong>Fecha:</strong> ${fechaHora}</p>
            <p><strong>Modalidad:</strong> ${evento.Modalidad}</p>
        </div>

        <div class="accion-evento">
            <a href="detalle-evento.html?id=${evento.idEvento}" class="btn btn-primary">Ver más</a>
        </div>
    `;

    sectionEventos.appendChild(article);
});
}