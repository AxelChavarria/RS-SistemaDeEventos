
//Recibe : Diccionario con datos {correo: "", contrasena: "",...}
//Retorna : Diccionario con {Codigo de error: INT, Mensaje del error: String}
export async function registraUsuario(datos) {
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
    correo: "axel22@estudiantec.cr",
    contrasena: "tec2026",
    carnet: "20261122323"
};
registraUsuario(usuarioNuevo)
*/



//Recibe: Diccionario con datos {correo: string, contrasena: string}
//Retorna: diccionario con {codigo: int, mensaje de codigo: string, y los demás datos}
export async function loginUsuario(credenciales) {
    try {
        const respuestaRaw = await fetch("http://127.0.0.1:3005/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credenciales)
        });

        // Convertimos a JSON sin importar si fue 200 o 401
        const resultado = await respuestaRaw.json();
        return resultado;

    } catch (err) {
        console.error("Error de conexión:", err.message);
        return { Codigo: -1, Mensaje: "Servidor fuera de línea" };
    }
}

/*
const prueba = {
    correo: "axel@estudiantec.cr",
    contrasena: "tec2026"
};

loginUsuario(prueba).then(resultado => {
    console.log(resultado);
});
*/




//Recibe: Diccionario con datos {nombrevento: string, idOrganizador: int}
//Retorna: diccionario con {codigo: int, mensaje de codigo: string, y los demás datos}
export async function crearEvento(datosEvento) {
    try {
        const res = await fetch("http://127.0.0.1:3005/api/crear-evento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosEvento)
        });
        return await res.json();
    } catch (err) {
        console.log("ERROR EN EL SERVER:", err.message)
        return { Codigo: -1, Mensaje: "Error al conectar con el servidor" };
    }
}

/*
const evento1 = {
    idOrganizador: 7, // usuario Axel
    nombre: "Charla de Base de Datos",
    categoria: "Académico",
    fecha: "2026-06-15 14:00:00",
    modalidad: "VIRTUAL",
    enlace: "NO",
    cupo: 10000
};



//ejemplo
(async () => {
   
    const res1 = await crearEvento(evento1);
    console.log("Respuesta 1:", res1.Mensaje);

    const res2 = await crearEvento(evento1);
    console.log("Respuesta 2:", res2.Mensaje);
})();
*/


//Recibe: Nado
//Retorna: Lista de diccionarios con los datos de los eventos aprobados y próximos (que sean después de que se consulta)
export async function obtenerEventosProximos() {
    try {
        const res = await fetch("http://localhost:3005/api/eventos-proximos");
        
        if (!res.ok) {
            throw new Error(`Error en el servidor: ${res.status}`);
        }

        const datos = await res.json();

        // Validamos si la respuesta es un array y si tiene contenido
        if (Array.isArray(datos) && datos.length > 0) {
            console.log("Eventos encontrados:", datos.length);
            return datos;
        } else {
            console.log("No hay eventos próximos disponibles.");
            return [];
        }

    } catch (err) {
        console.error("ERROR CRÍTICO:", err.message);
        return [];
    }
}




// Recibe el id del organizdor
// Retorna una lista de diccionarios con sus eventos
export async function verMisEventos(idOrganizador) {
    try {
        
        const res = await fetch(`http://localhost:3005/api/eventos-creados/${idOrganizador}`); // se concatena id pues es get
        const datos = await res.json();
        return datos;
    } catch (err) {
        console.error("Error:", err.message);
        return [];
    }
}

/*
(async () => {
   const resultado = await verMisEventos(7)
   console.log(resultado)
})();
*/



// Recibe diccionario con:
// modalidad ('Virtual', 'Presencial´ o ´Híbrido')
// rango ('Próximos', 'Mensuales' o 'Semanal')
// categoria (cualquiera del frontend)
// Retorna lista de diccionarios con los filtros
export async function filtrarEventos(filtros) {
    try {
        const res = await fetch("http://localhost:3005/api/filtrar-eventos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(filtros) 
        });

        if (!res.ok) throw new Error("Error en la respuesta del servidor");

        return await res.json();
    } catch (err) {
        console.error("Error al filtrar:", err.message);
        return [];
    }
}

/*
const misFiltros = {
    modalidad: 'Presencial',
    categoria: 'Académico',
    rango: 'Próximos'
};

const eventos = await filtrarEventos(misFiltros);
console.log(eventos);
*/













