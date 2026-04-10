import { Asistente} from './Asistente.js';

const asistente = new Asistente();

document.getElementById("form-registro").addEventListener("submit", async (e) => { 
    e.preventDefault();
    asistente.registrarUsuario();
});