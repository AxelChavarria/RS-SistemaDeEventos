import Asistente from "./Asistente.js";

class Organizador extends Asistente{

    listaEventos;

    constructor(nombre, apellido, contraseña, correo, idUsuario, carnet){
        super(nombre, apellido, contraseña, correo, idUsuario, carnet);
        this.listaEventos = [];
    }

    enviarCorreo(){}

    modificarEventoPendiente(){}

    verParticipantes(evento){}

    confirmarAsistencia(idEvento){}

    crearSolicitud(motivo, idEvento){}

    crearEvento(){}
}