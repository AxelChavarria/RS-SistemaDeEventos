
//Recibe : Diccionario con datos {correo: "", contrasena: "",...}
//Retorna : Diccionario con {Codigo de error: INT, Mensaje del error: String}
async function registraUsuario(datos) {
    console.log("Enviando fetch");
    try {
        const respuestaRaw = await fetch("http://127.0.0.1:3005/api/registrar-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuestaRaw.json(); 
        return resultado
        
    } catch (err) {
        return { Codigo: -1, Mensaje: err.message }
    }
}

/*
const usuarioNuevo = {
    nombre: "Axel",
    apellido: "Chavarria",
    correo: "axel@estudiantec.cr",
    contrasena: "tec2026",
    carnet: "2026112233"
};
registraUsuario(usuarioNuevo)
*/