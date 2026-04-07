async function registraUsuario(datos) {
    console.log("Enviando fetch");
    try {
        const respuestaRaw = await fetch("http://127.0.0.1:3005/api/registrar-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const texto = await respuestaRaw.text();
        console.log( texto);
    } catch (err) {
        console.error("Error en el fetch:", err.message);
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