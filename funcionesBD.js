
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
   const resultado = await obtenerEventosProximos()
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


// Recibe: diccionario así: {idEvento :..., idUsuario:...}
// Retorna un diccionario con lo que pasó
export async function inscribirse(inscripcion) {
    try {
        const res = await fetch("http://localhost:3005/api/inscribir-evento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inscripcion)
        });

        if (!res.ok) throw new Error("Error en la red");

        return await res.json();
    } catch (err) {
        console.error("Error en inscribirse:", err);
        return { Codigo: -1, Mensaje: "Error de conexión" };
    }
}


// Recibe: lista de correos seleccionados por el organizador, asunto y mensaje
// No consulta SQL, solo le manda los correos a nodemailer para que los envíe
export async function enviarMensajeAsistentes(correos, asunto, mensaje) {
    try {
        const res = await fetch("http://localhost:3005/api/enviar-mensaje-asistentes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correos, asunto, mensaje })
        });
        return await res.json();
    } catch (err) {
        console.error("Error al enviar mensaje:", err.message);
        return { Codigo: -1, Mensaje: "Error de conexión" };
    }
}


// Recibe: id del evento
// Retorna: lista de { NombreUsuario, CorreoElectronico } de los inscritos al evento
export async function obtenerInscritos(idEvento) {
    try {
        const res = await fetch(`http://localhost:3005/api/inscritos/${idEvento}`);
        return await res.json();
    } catch (err) {
        console.error("Error al obtener inscritos:", err.message);
        return [];
    }
}


// Recibe: id del evento y motivo de la cancelacion
// El servidor consulta el SP para obtener todos los inscritos y les avisa a todos sin excepcion
export async function notificarCancelacion(idEvento, motivo) {
    try {
        const res = await fetch("http://localhost:3005/api/notificar-cancelacion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evento_id: idEvento, motivo })
        });
        return await res.json();
    } catch (err) {
        console.error("Error al notificar cancelacion:", err.message);
        return { Codigo: -1, Mensaje: "Error de conexión" };
    }
}


// Recibe: id del evento y motivo del rechazo
// El admin no elige destinatario-va directo al organizador del evento
export async function notificarRechazo(idEvento, motivo) {
    try {
        const res = await fetch("http://localhost:3005/api/notificar-rechazo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evento_id: idEvento, motivo })
        });
        return await res.json();
    } catch (err) {
        console.error("Error al notificar rechazo:", err.message);
        return { Codigo: -1, Mensaje: "Error de conexión" };
    }
}

// Recibe diccionario de evento (similar a la función de crear eeventos)
// Retorna diccionario con {codigo, mensaje}
export async function modificarEvento(datos) {
    try {
        const res = await fetch("http://localhost:3005/api/eventos/modificar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        return await res.json();
    } catch (err) {
        console.error("Error al conectar para modificar:", err);
        return { Codigo: -1, Mensaje: "Error de conexión con el servidor" };
    }
}


// Recibe id del evento a cancelar
// Retorna diccionario con {codigo, mensaje}
export async function cancelarEvento(id) {
    try {
        const res = await fetch("http://localhost:3005/api/eventos/cancelar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idEvento: id })
        });
        return await res.json();
    } catch (err) {
        console.error("Error al conectar para cancelar:", err);
        return { Codigo: -1, Mensaje: "Error de conexión con el servidor" };
    }
}

/*
modificarEvento({
    idEvento: 9, 
    nombre: "Graduación", 
    descripcion: "Graduación", 
    categoria: "Graduación", 
    fecha: "2026-06-01", 
    modalidad: "VIRTUAL", 
    enlace: "zoom.com", 
    cupo: 50
}).then(res => console.log("Resultado Modificar:", res));
*/

export async function obtenerSolicitudesAdmin() {
    const res = await fetch(`http://localhost:3005/api/admin/solicitudes/11`);
    return await res.json();
}
 /*
const datos = await obtenerSolicitudesAdmin()
console.log(datos.modificaciones)
console.log(datos.eliminaciones)
*/


// Parámetros idSolicitud, acción ('aprobar' o 'rechazar'), tipo('modificacion' o 'cancelacion')
// Retorna diccionario con codigo y mensaje
export async function responderSolicitud(idSolicitud, accion, tipo) {
    const res = await fetch(`http://localhost:3005/api/admin/procesar-solicitud`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idSolicitud, accion, tipo })
    });
    return await res.json();
}
/*
const respuesta = await responderSolicitud(2, 'rechazar', 'modificacion')
console.log(respuesta)
*/










