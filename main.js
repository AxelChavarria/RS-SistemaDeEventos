import { Asistente} from './Asistente.js';
import { Usuario } from './Usuario.js';
import { Organizador } from './Organizador.js';
    
const asistente = new Asistente();
const usuario = new Usuario();
const organizador = new Organizador();


const formRegistro = document.getElementById("form-registro");
if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
        e.preventDefault();
        asistente.registrarUsuario();
    });
}
const formLogin = document.getElementById("form-login");
if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        usuario.iniciarSesion();
    });
}

const formCrearEvento = document.getElementById("form-crear-evento");
if (formCrearEvento) {
    formCrearEvento.addEventListener("submit", (e) => {
        e.preventDefault();
        organizador.crearEvento();
    });
}