import Usuario from "./Usuario.js";

class Administrador extends Usuario{

    constructor(nombre, apellido, contraseña, correo, idUsuario){
        super(nombre, apellido, contraseña, correo, idUsuario);
    }

    modificarOrganizadores(idOrganizador){}

    modificarEvento(){}

    eliminarEvento(){}

    verOrganizadores(){}

    AprodarEvento(idSolicitud){}

    verSolicitudesModificacion(){}

    eliminarEventoOrganizadores(idSolicitud){}

    modificarEventoOrganizadores(idSolicitud){}

    generarReportes(fechaInicio, fechaFin){}

    publicarAnuncios(){}

}