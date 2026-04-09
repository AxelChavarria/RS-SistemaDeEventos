import Usuario from "./Usuario.js";


class Asistente extends Usuario{

    carnet;

    constructor(nombre, apellido, contraseña, correo, idUsuario, carnet){
        super(nombre, apellido, contraseña, correo, idUsuario);
        this.carnet = carnet;
    }

    registrarUsuario(nombre, apellido, carnet, contraseña, correo){}

    verMisInscripciones(){}

    inscribirseAEvento(Evento){}

    cancelarInscripcion(idInscripcion){}

}