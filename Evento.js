class Evento {

    #titulo;
    idEvento;
    #descripcion;
    #categoria;
    #unidadOrganizadora;
    #fecha;
    #hora;
    #modalidad;
    cupoMaximo;
    #estado;
    justificacionRechazo;

    constructor(titulo, descripcion, categoria, unidadOrganizadora, fecha, hora, modalidad, cupoMaximo){
        this.#titulo = titulo;
        this.#descripcion = descripcion;
        this.#categoria = categoria;
        this.#unidadOrganizadora = unidadOrganizadora;
        this.#fecha = fecha;
        this.#hora = hora;
        this.#modalidad = modalidad;
        this.cupoMaximo = cupoMaximo;
        this.#estado = "Pendiente";
    }


}