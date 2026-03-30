class Usuario{

    nombre;
    apellido;
    contraseña;
    correo;
    idUsuario;

    constructor(nombre, apellido, contraseña, correo, idUsuario){
        this.nombre = nombre;
        this.apellido = apellido;
        this.contraseña = contraseña;
        this.correo = correo;
        this.idUsuario = idUsuario;
    }

    iniciarSesion(correo, contraseña){}

    restablecerContraseña(correo, contraseña){}

}