import { Asistente } from './Asistente.js';
import { Usuario } from './Usuario.js';
import { Organizador } from './Organizador.js';
//import { Inscripcion } from './Inscripcion.js';

import {  obtenerEventosProximos, verMisEventos, filtrarEventos, obtenerInscripcionesPasadas, obtenerAsistentesEvento, obtenerAnunciosRecientes, obtenerInscripcionesFuturas, desinscribirDeEvento, marcarAsistencia } from './funcionesBD.js';

    
const asistente = new Asistente();
const usuario = new Usuario();
const organizador = new Organizador();

//----Generales----

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

//función para guardar localmente la información del evento
function guardarEvento(evento){

    let fechaOriginal = evento.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");

    let hora = tiempo.substring(0,5);
    let fechaNormal = `${day}/${month}/${year}`

    localStorage.setItem("evento", JSON.stringify({
        idEvento: evento.idEvento,
        Titulo: evento.NombreEvento,
        Categoria: evento.Categoria,
        Fecha: fechaNormal,
        Hora: hora,
        Lugar: evento.EnlacePlenaria,
        Modalidad: evento.Modalidad,
        Cupos: evento.Cupo,
        Nombre: evento.Nombre,
        Descripcion: evento.Descripcion,
        Estado: evento.Estado
    }));
}

const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
        localStorage.clear();
        window.location.replace("../../views/login.html");
    });
}

//-----Compartidas----
//**Página principal**
//**Página principal**->*Anuncio*
const contenedorAnuncio = document.getElementById("contenedor-anuncio-principal");
if (contenedorAnuncio) {

    let anuncios = await obtenerAnunciosRecientes();
    contenedorAnuncio.innerHTML = `
        <p>${anuncios[0].Mensaje}</p>
    `;

}

//**Eventos**
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

//**Eventos**->*Ver más*
const sectionDetalle = document.getElementById("detalle-evento");
if (sectionDetalle) {
    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    

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
                <p><strong>Organizador:</strong> ${eventoGuardado.Nombre}</p>
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

}

//**Eventos**->*Ver más*->Inscribirse
const formInscripcion = document.getElementById("form-inscripcion");
if (formInscripcion) {
    formInscripcion.addEventListener("submit", async (e) => {
        e.preventDefault();
        await asistente.inscribirseAEvento();
    });
}

//**Eventos**->*Filtrar eventos*
const formFiltros = document.getElementById("form-filtros-eventos");
if (formFiltros) {
    formFiltros.addEventListener("submit", async (e) => {
        e.preventDefault();
        let informacion = {
            rango: document.getElementById("filtro-fecha").value.trim(),
            categoria: document.getElementById("filtro-categoria").value.trim(),
            modalidad: document.getElementById("filtro-modalidad").value.trim()
        }
        console.log(informacion); // DEBUG

        let eventos = await filtrarEventos(informacion);
        console.log("Eventos filtrados:", eventos); // DEBUG
        const sectionEventos = document.getElementById("contenedor-lista-eventos");
            
        sectionEventos.innerHTML = ""; // Limpiar eventos actuales

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
    });
    
}

//**Mis Inscritos**
//**Mis Inscritos**->*Eventos Pasados*
const seccionEventosPasados = document.getElementById("contenedor-eventos-pasados");
if (seccionEventosPasados) {
    
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    let inscripciones = await obtenerInscripcionesPasadas(usuarioGuardado.idUsuario);
    
    if(inscripciones.length !== 0){
        inscripciones.forEach(evento => {
            let fechaOriginal = evento.FechaEvento;

            let [fecha, tiempo] = fechaOriginal.split("T");
            let [year, month, day] = fecha.split("-");
            let hora = tiempo.substring(0,5);

            let fechaHora = `${day}/${month}/${year} ${hora}`;
            

            const article = document.createElement("article");

            article.classList.add("card-evento", "card-evento-horizontal");

            const contenedorInfo = document.createElement("div");
            contenedorInfo.classList.add("info-evento");
            contenedorInfo.innerHTML = `
                <p><strong>Título:</strong> ${evento.NombreEvento}</p>
                <p><strong>Categoría:</strong> ${evento.Categoria}</p>
                <p><strong>Fecha:</strong> ${fechaHora}</p>
                <p><strong>Modalidad:</strong> ${evento.Modalidad}</p>
            `;
            

            article.appendChild(contenedorInfo);

            seccionEventosPasados.appendChild(article);
        });
    } else {
        const article = document.createElement("article");

        article.classList.add("card-evento", "card-evento-horizontal");

        const contenedorInfo = document.createElement("div");
        contenedorInfo.classList.add("info-evento");
        contenedorInfo.innerHTML = `
            No hay eventos pasados a los que te hayas inscrito.
        `
        article.appendChild(contenedorInfo);

        seccionEventosPasados.appendChild(article);
    }
}

//**Mis Inscritos**->*Eventos Futuros*
const seccionEventosFuturos = document.getElementById("contenedor-eventos-futuros");
if (seccionEventosFuturos) {
    
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    let inscripciones = await obtenerInscripcionesFuturas(usuarioGuardado.idUsuario);
    
    console.log("Inscripciones futuras:", inscripciones); // DEBUG

    if(inscripciones.length !== 0){
        inscripciones .forEach(evento => {
            
            let fechaOriginal = evento.FechaEvento;

            let [fecha, tiempo] = fechaOriginal.split("T");
            let [year, month, day] = fecha.split("-");
            let hora = tiempo.substring(0,5);

            let fechaHora = `${day}/${month}/${year} ${hora}`;

            const article = document.createElement("article");

            article.classList.add("card-evento", "card-evento-horizontal");

            const contenedorInfo = document.createElement("div");
            contenedorInfo.classList.add("info-evento");
            contenedorInfo.innerHTML = `
                <p><strong>Título:</strong> ${evento.NombreEvento}</p>
                <p><strong>Categoría:</strong> ${evento.Categoria}</p>
                <p><strong>Fecha:</strong> ${fechaHora}</p>
                <p><strong>Modalidad:</strong> ${evento.Modalidad}</p>
            `;

            article.appendChild(contenedorInfo);

            const contenedorBoton = document.createElement("div");
            contenedorBoton.classList.add("accion-evento");


            let enlace = document.createElement("a");
            enlace.classList.add("btn", "btn-primary");
            enlace.textContent = "Detalles";
            enlace.href = `detalle-inscripcion.html?id=${evento.idEvento}`;

            contenedorBoton.appendChild(enlace);
            article.appendChild(contenedorBoton);
            seccionEventosFuturos.appendChild(article);
        });
    } else {
        const article = document.createElement("article");

        article.classList.add("card-evento", "card-evento-horizontal");

        const contenedorInfo = document.createElement("div");
        contenedorInfo.classList.add("info-evento");
        contenedorInfo.innerHTML = `
            No hay eventos futuros a los que te hayas inscrito.
        `
        article.appendChild(contenedorInfo);

        seccionEventosFuturos.appendChild(article);
    }
}

//Mis Inscritos -> Eventos futuros -> Detalle/Desinscribirse (Cass)
const contenedorDetalle = document.getElementById("contenedor-info-evento");
if (contenedorDetalle) {
    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    

    contenedorDetalle.innerHTML = `
        
        <p><strong>Título:</strong> ${eventoGuardado.Titulo}</p>
        <p><strong>Categoria:</strong> ${eventoGuardado.Categoria}</p>
        <p><strong>Fecha:</strong> ${eventoGuardado.Fecha}</p>
        <p><strong>Hora:</strong> ${eventoGuardado.Hora}</p>
        <p><strong>Lugar:</strong> ${eventoGuardado.Lugar}</p>
        <p><strong>Modalidad:</strong> ${eventoGuardado.Modalidad}</p>
        <p><strong>Cupos disponibles:</strong> ${eventoGuardado.Cupos}</p>
        <p><strong>Organizador:</strong> ${eventoGuardado.Nombre}</p>

    `;

    const contenedorDetalleEvento = document.getElementById("contenedor-descripcion-evento");
    contenedorDetalleEvento.innerHTML = `
        
        <p>${eventoGuardado.Descripcion}</p>
    `;

    const formDesinscripcion = document.getElementById("form-desinscripcion");
    if (formDesinscripcion) {
        formDesinscripcion.addEventListener("submit", async (e) => {
            e.preventDefault();
            const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

            let resultado = await desinscribirDeEvento(eventoGuardado.idEvento, usuarioGuardado.idUsuario);
            alert(resultado.Mensaje); 
        });
    }
}

//-----Estudiante----
//**Página principal**


//**Página principal**->*Evento más próximo*
const contenedorEventosProximosEstudiante = document.getElementById("contenedor-eventos-proximos");
if (contenedorEventosProximosEstudiante) {

    let eventos = await obtenerEventosProximos();
    let eventoProximo = eventos[0]; 

    let fechaOriginal = eventoProximo.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");
    let hora = tiempo.substring(0,5);

    let fechaHora = `${day}/${month}/${year} ${hora}`;
    contenedorEventosProximosEstudiante.innerHTML = `
        <article class="card-evento card-evento-estudiante">
            <p><strong>Título:</strong> ${eventoProximo.NombreEvento}</p>
            <p><strong>Categoría:</strong> ${eventoProximo.Categoria}</p>
            <p><strong>Fecha:</strong> ${fechaHora}</p>
            <p><strong>Modalidad:</strong> ${eventoProximo.Modalidad}</p>

            
            <div class="contenedor-boton-card">
                <a href="detalle-evento.html?id=${eventoProximo.idEvento}" class="btn btn-primary">Ver mas</a>
            </div>
        </article>
    `;

}

//**Página principal**->*Evento más próximo inscrito*
const contenedorEventosProximosInscritosEstudiante = document.getElementById("contenedor-evento-inscrito");
if (contenedorEventosProximosInscritosEstudiante) {

    /*
    
    !---IMPORTANTE: aquí debe ir la función para encontrar el evento más próximo al que el estudiante se ha inscrito---!

    let eventos = await obtenerEventosProximos();
    let eventoProximo = eventos[0]; 

    let fechaOriginal = eventoProximo.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");
    let hora = tiempo.substring(0,5);

    let fechaHora = `${day}/${month}/${year} ${hora}`;
    */
    contenedorEventosProximosInscritosEstudiante.innerHTML = `
        <article class="card-evento card-evento-estudiante">
            <p><strong>Título:</strong> Referencia</p>
            <p><strong>Categoría:</strong> Referencia</p>
            <p><strong>Fecha:</strong> Referencia</p>
            <p><strong>Modalidad:</strong> Referencia</p>

            
            <div class="contenedor-boton-card">
                <a href="detalle-evento.html" class="btn btn-primary">Ver mas</a>
            </div>
        </article>
    `;

}

//**Ver anuncios**
const seccionAnunciosEstudiante = document.getElementById("contenedor-lista-anuncios");
if (seccionAnunciosEstudiante) {
    
    //IMPORTANTE: aquí va la función para traer los anuncios
    
    
    //eventos.forEach(evento => {
        

        const article = document.createElement("article");

        article.classList.add("card", "card-anuncio");

        
        article.innerHTML = `
            <h3 class="titulo-anuncio">Anuncios</h3>
            <p class="texto-anuncio-secundario">
                Anuncio ref
            </p>
        `;

        
        seccionAnunciosEstudiante.appendChild(article);
    //});
}

//-----Organizador----
//**Página principal**

//**Página principal**->*Evento más reciente 1* 
const contenedorEventosProximosOrganizador1 = document.getElementById("contenedor-eventos-recientes1");
if (contenedorEventosProximosOrganizador1) {

    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

    let eventos = await verMisEventos(usuarioGuardado.idUsuario);
    let eventoProximo = eventos[0];

    let fechaOriginal = eventoProximo.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");
    let hora = tiempo.substring(0,5);

    let fechaHora = `${day}/${month}/${year} ${hora}`;

    const article = document.createElement("article");

    article.classList.add("card-evento", "card-evento-estudiante");

    const contenedorInfo = document.createElement("div");
    contenedorInfo.classList.add("info-evento");
        
    contenedorInfo.innerHTML = `
        <p><strong>Título:</strong> ${eventoProximo.NombreEvento}</p>
        <p><strong>Categoría:</strong> ${eventoProximo.Categoria}</p>
        <p><strong>Fecha:</strong> ${fechaHora}</p>
        <p><strong>Modalidad:</strong> ${eventoProximo.Modalidad}</p>
    `;

    article.appendChild(contenedorInfo);

    const contenedorBoton = document.createElement("div");
    contenedorBoton.classList.add("accion-evento");

    let enlace = document.createElement("a");
    enlace.classList.add("btn", "btn-primary");
    enlace.textContent = "Ver más";
    enlace.href = `detalle-evento-org.html`;// `detalle-evento.html?id=${evento.idEvento}`



    contenedorBoton.appendChild(enlace);
    article.appendChild(contenedorBoton);
    contenedorEventosProximosOrganizador1.appendChild(article);
}

//**Página principal**->*Evento más reciente 2* 
const contenedorEventosProximosOrganizador2 = document.getElementById("contenedor-eventos-recientes2");
if (contenedorEventosProximosOrganizador2) {

    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

    let eventos = await verMisEventos(usuarioGuardado.idUsuario);
    let eventoProximo = eventos[1]; 

    let fechaOriginal = eventoProximo.FechaEvento;

    let [fecha, tiempo] = fechaOriginal.split("T");
    let [year, month, day] = fecha.split("-");
    let hora = tiempo.substring(0,5);

    let fechaHora = `${day}/${month}/${year} ${hora}`;

    const article = document.createElement("article");

    article.classList.add("card-evento", "card-evento-estudiante");

    const contenedorInfo = document.createElement("div");
    contenedorInfo.classList.add("info-evento");
        
    contenedorInfo.innerHTML = `
        <p><strong>Título:</strong> ${eventoProximo.NombreEvento}</p>
        <p><strong>Categoría:</strong> ${eventoProximo.Categoria}</p>
        <p><strong>Fecha:</strong> ${fechaHora}</p>
        <p><strong>Modalidad:</strong> ${eventoProximo.Modalidad}</p>
    `;

    article.appendChild(contenedorInfo);

    const contenedorBoton = document.createElement("div");
    contenedorBoton.classList.add("accion-evento");

    let enlace = document.createElement("a");
    enlace.classList.add("btn", "btn-primary");
    enlace.textContent = "Ver más";
    enlace.href = `detalle-evento-org.html`;// `detalle-evento.html?id=${evento.idEvento}`



    contenedorBoton.appendChild(enlace);
    article.appendChild(contenedorBoton);
    contenedorEventosProximosOrganizador2.appendChild(article);
}

//**Mis Eventos**
const sectionMisEventos = document.getElementById("contenedor-eventos-org");
if (sectionMisEventos) {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    
    let eventos = await verMisEventos(usuarioGuardado.idUsuario);

    console.log("Eventos del organizador:", eventos); // DEBUG
    
    
    eventos.forEach(evento => {
        let fechaOriginal = evento.FechaEvento;

        let [fecha, tiempo] = fechaOriginal.split("T");
        let [year, month, day] = fecha.split("-");

        let fechaOficial = `${day}/${month}/${year}`;

        const article = document.createElement("article");

        article.classList.add("card-evento", "card-evento-horizontal");
        article.innerHTML = `
            
            <div class="info-evento">
                <p><strong>Título:</strong> ${evento.NombreEvento}</p>
                <p><strong>Fecha:</strong> ${fechaOficial}</p>
                <p><strong>Estado:</strong> ${evento.Estado}</p>
            </div>
        `;

        
        let divAccion = document.createElement("div");
        divAccion.classList.add("accion-evento");

        let enlace = document.createElement("a");
        enlace.classList.add("btn", "btn-primary");
        enlace.textContent = "Detalles";
        if (evento.Estado === 'APROBADO') {
            enlace.addEventListener("click", () => {
                guardarEvento(evento);
            });
            enlace.href = `evento-aprobado.html?id=${evento.idEvento}`;
        } else if (evento.Estado === 'PENDIENTE') {
            enlace.addEventListener("click", () => {
                guardarEvento(evento);
            });
            enlace.href = `evento-pendiente.html?id=${evento.idEvento}`;
        }

        divAccion.appendChild(enlace);
        article.appendChild(divAccion);

        sectionMisEventos.appendChild(article);
    });
} 

//**Mis Eventos**->*Detalles*
//**Mis Eventos**->*Detalles*->Evento pendiente
const contenedorEventoPendiente = document.getElementById("contenedor-info-evento-org-pend");
if (contenedorEventoPendiente) {

    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    contenedorEventoPendiente.innerHTML = `
        <p><strong>Titulo del Evento:</strong> ${eventoGuardado.Titulo}</p>
        <p><strong>Categoria:</strong> ${eventoGuardado.Categoria}</p>
        <p><strong>Fecha:</strong> ${eventoGuardado.Fecha}</p>
        <p><strong>Hora:</strong> ${eventoGuardado.Hora}</p>
        <p><strong>Organizador:</strong> ${eventoGuardado.Nombre}</p>
        <p><strong>Modalidad:</strong> ${eventoGuardado.Modalidad}</p>
        <p><strong>Cupo Maximo:</strong> ${eventoGuardado.Cupos}</p>
        <p><strong>Lugar:</strong> ${eventoGuardado.Lugar}</p>
        <p><strong>Estado:</strong> ${eventoGuardado.Estado}</p>
    `;

    const contenedorDescripcion = document.getElementById("contenedor-descripcion-evento");
    contenedorDescripcion.innerHTML = `
        <p>${eventoGuardado.Descripcion}</p>
    `;

    const botonEditar = document.getElementById("btn-editar-evento");
        botonEditar.onclick = function() {
        window.location.href = "editar-evento-org.html?id=" + eventoGuardado.idEvento;
    };
}

//**Mis Eventos**->*Detalles*->Evento pendiente->Editar evento
const formEditarEvento = document.getElementById("editar-evento");
if (formEditarEvento) {
    document.getElementById("titulo").value = JSON.parse(localStorage.getItem("evento")).Titulo;
    document.getElementById("descripcion").value = JSON.parse(localStorage.getItem("evento")).Descripcion;
    document.getElementById("categoria").value = JSON.parse(localStorage.getItem("evento")).Categoria;
    document.getElementById("fecha").value = JSON.parse(localStorage.getItem("evento")).Fecha;
    document.getElementById("modalidad").value = JSON.parse(localStorage.getItem("evento")).Modalidad;
    document.getElementById("cupo-maximo").value = JSON.parse(localStorage.getItem("evento")).Cupos;
    document.getElementById("lugar").value = JSON.parse(localStorage.getItem("evento")).Lugar;
    
    
    formEditarEvento.addEventListener("submit", async (e) => {
        e.preventDefault();
        let informacion = {
            titulo: document.getElementById("titulo").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim(),
            categoria: document.getElementById("categoria").value.trim(),
            fecha: document.getElementById("fecha").value.trim(),
            modalidad: document.getElementById("modalidad").value.trim(),
            cupoMaximo: document.getElementById("cupo-maximo").value.trim(),
            lugar: document.getElementById("lugar").value.trim()
        }
        //IMPORTANTE: aquí va la función para editar el evento
    });
}

//**Mis Eventos**->*Detalles*->Evento aprobado
const contenedorEventoAprobado = document.getElementById("contenedor-info-evento-org");

if (contenedorEventoAprobado) {
    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    console.log("Evento aprobado cargado:", eventoGuardado); // DEBUG
    // Rellenar info del evento
    contenedorEventoAprobado.innerHTML = `
        <p><strong>Titulo del Evento:</strong> ${eventoGuardado.Titulo}</p>
        <p><strong>Categoria:</strong> ${eventoGuardado.Categoria}</p>
        <p><strong>Fecha:</strong> ${eventoGuardado.Fecha}</p>
        <p><strong>Hora:</strong> ${eventoGuardado.Hora}</p>
        <p><strong>Organizador:</strong> ${eventoGuardado.Nombre}</p>
        <p><strong>Modalidad:</strong> ${eventoGuardado.Modalidad}</p>
        <p><strong>Cupo Maximo:</strong> ${eventoGuardado.Cupos}</p>
        <p><strong>Lugar:</strong> ${eventoGuardado.Lugar}</p>
        <p><strong>Estado:</strong> ${eventoGuardado.Estado}</p>
    `;

    const contenedorDescripcion = document.getElementById("contenedor-descripcion-evento");
    if (contenedorDescripcion) {
        contenedorDescripcion.innerHTML = `<p>${eventoGuardado.Descripcion}</p>`;
    }
}

//**Mis Eventos**->*Detalles*->Evento aprobado->Ver Participantes
const bodyTabla = document.getElementById("tabla-participantes");
if (bodyTabla) {
    let eventoGuardado = JSON.parse(localStorage.getItem("evento"));
    
    const asistentes = await obtenerAsistentesEvento(eventoGuardado.idEvento);
    
    asistentes.forEach(persona => {
        const fila = document.createElement("tr");
        
        fila.innerHTML = `
            <td>${persona.NombreUsuario}</td>
            <td>${persona.Carnet}</td>
            <td>${persona.CorreoElectronico}</td>
            <td>${persona.FechaInscripcion}</td>
            <td style="text-align: center;">
                <input type="checkbox" 
                    value="${persona.Carnet}" 
                    class="checkbox-asistencia"    }>
            </td>
        `;
        bodyTabla.appendChild(fila);
    });
    

}

//**Mis Eventos**->*Detalles*->Evento aprobado->Ver Participantes->Marcar asistencia
const formAsistencia = document.getElementById("form-asistencia");
if (bodyTabla) {

    const eventoGuardado = JSON.parse(localStorage.getItem("evento"));

    document.querySelectorAll(".checkItem").forEach(cb => {
        cb.addEventListener("change", function() {
            if (this.checked) {
                marcarAsistencia(this.value, eventoGuardado.idEvento, "Presente"); // Función para marcar asistencia en la BD
            } else {
                marcarAsistencia(this.value, eventoGuardado.idEvento, "Ausente");
            }
        });
    });
    
}

//Esto es para que el organizador encuentre a un estudiante por nombre o carnet (revisar):
const inputBusqueda = document.getElementById("busqueda-participante");

if (inputBusqueda) {
    inputBusqueda.addEventListener("keyup", () => {
        const texto = inputBusqueda.value.toLowerCase();
        const filas = tablaParticipantes.getElementsByTagName("tr");

        Array.from(filas).forEach(fila => {
            const contenidoFila = fila.textContent.toLowerCase();
            if (contenidoFila.indexOf(texto) > -1) {
                fila.style.display = ""; // Muestra la fila
            } else {
                fila.style.display = "none"; // Oculta la fila
            }
        });
    });
} 




//**Mis Eventos**->*Detalles*->Evento aprobado->Enviar mensaje a asistentes
const formEnviarCorreo = document.getElementById("form-enviar-mensaje");
if (formEnviarCorreo) {
    formEnviarCorreo.addEventListener("submit", async (e) => {
        e.preventDefault();

        let inscritos = await organizador.verParticipantes();
        const contenedorDestinatarios = document.getElementById("lista-destinatarios");
        inscritos.forEach(inscrito => {

            const tablaDestinatarios = document.getElementById("lista");

            tablaDestinatarios.innerHTML += `
                <tr>
                    <td>${inscrito.Nombre}</td>
                    <td>${inscrito.Correo}</td>
                    <td><input type="checkbox" name="destinatarios" value="${inscrito.Correo}" checked></td>
                </tr>

            `;
        });

        contenedorDestinatarios.appendChild(tablaDestinatarios);

        organizador.enviarCorreo();
    });
}

//**Crear Evento**
const formCrearEvento = document.getElementById("form-crear-evento");
if (formCrearEvento) {
    formCrearEvento.addEventListener("submit", (e) => {
        e.preventDefault();
        organizador.crearEvento();
    });
}



//**Enviar Mensaje**



/**Enviar Mensaje**
>>>>>>> 011e68fc2dfdf0ae36226cc334fa4f6cbaa1f6a9
const formEnviarMensaje = document.getElementById("form-enviar-mensaje");
if (formEnviarMensaje) {
    formEnviarMnesaje.addEventListener("submit", (e) => {
        e.preventDefault();
        //const listaCorreos = await obtenerCorreosAsistentes(idEvento) //Variable
        //await enviarMensajeAsistentes(listaCorreos, asunto, mensaje);
    });
}
<<<<<<< HEAD

//**Editar Cuenta**

//Pendiente






//**Anuncios Organizador**
const contenedorAnuncios = document.getElementById("contenedor-lista-anuncios");

if (contenedorAnuncios) {
   
    const anuncios = await obtenerAnunciosRecientes();
    console.log(anuncios)
    //Limpia los anuncios "temporales" 
    contenedorAnuncios.innerHTML = "";

    //Verifica que existan anuncios
    if (anuncios && anuncios.length > 0) {
        anuncios.forEach(anuncio => {
            //Crea el elemento <article> para cada anuncio
            const article = document.createElement("article");
            article.className = "card card-anuncio";

            //Inyecta los datos reales (Mensaje y Fecha)
            // Usa una fecha formateada si es necesario
            article.innerHTML = `
                <h3 class="titulo-anuncio">Anuncio Administrativo</h3>
                <p class="texto-anuncio-secundario">
                    ${anuncio.Mensaje}
                </p>
                <small style="color: #666; display: block; margin-top: 10px;">
                    Publicado el: ${new Date(anuncio.FechaEnvio).toLocaleDateString()}
                </small>
            `;

            //Lo agrega al contenedor principal
            contenedorAnuncios.appendChild(article);
        });
    } else {
        // En caso de que no haya anuncios en la BD
        contenedorAnuncios.innerHTML = `<p class="texto-anuncio-secundario">No hay anuncios recientes en este momento.</p>`;
    }
}
=======
*/

