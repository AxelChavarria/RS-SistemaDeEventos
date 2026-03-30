class Solicitud {

    motivo;
    idSolicitud;
    fechaSolicitud;
    aprobada;

    constructor(motivo, idSolicitud, fechaSolicitud, aprobada){
        this.motivo = motivo;
        this.idSolicitud = idSolicitud;
        this.fechaSolicitud = fechaSolicitud;
        this.aprobada = aprobada;
    }

    confirmarAprobacion(){}

}