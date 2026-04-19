
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

const res2 = await obtenerEventosProximos()
console.log(res2)



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

/*
const res = await inscribirse({idEvento:9, idUsuario:4})
console.log(res)
*/


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


// Recibe : id delusuario
// Retorna: lista de diccionario de los eventos
export async function obtenerInscripcionesPasadas(idUsuario) {
    try {
        const res = await fetch(`http://localhost:3005/api/usuario/eventos/pasados/${idUsuario}`);
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.Mensaje || "Error al obtener el historial");
        }
        
        return await res.json();
    } catch (err) {
        console.error("Error en obtenerHistorialEventos:", err);
        return [];
    }
}

/*
const res = await obtenerInscripcionesPasadas(9)
console.log(res)
*/


// Recibe : id delusuario
// Retorna: lista de diccionario de los eventos
export async function obtenerInscripcionesFuturas(idUsuario) {
    try {
        const res = await fetch(`http://localhost:3005/api/usuario/eventos/futuros/${idUsuario}`);
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.Mensaje || "Error al obtener la agenda");
        }
        
        return await res.json();
    } catch (err) {
        console.error("Error en obtenerAgendaFutura:", err);
        return [];
    }
}
/*
const res = await obtenerInscripcionesFuturas(7)
console.log(res)*/




// recibe: mensaje
// retorna: codigo y mensaje de éxito (diccionario)
export async function crearAnuncio(mensaje) {
    try {
        const res = await fetch("http://localhost:3005/api/anuncios/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje })
        });
        return await res.json();
    } catch (err) {
        console.error("Error al crear anuncio:", err);
        return { Codigo: -1, Mensaje: "Error de conexión" };
    }
}

/*
const res2 = await crearAnuncio("Este es un anuncio sobre el funcionamiento del sistema de anuncios")
console.log(res2)
*/




// Recibe nada
// Retorna diccionario con los 3 eventos mas recientes con {Mensaje: ...., FechaEnvio:... , idUsuario: El id del admin (11 constante)}
export async function obtenerAnunciosRecientes() {
    try {
        const res = await fetch("http://localhost:3005/api/anuncios/recientes");
        if (!res.ok) throw new Error("Error al obtener anuncios");
        return await res.json();
    } catch (err) {
        console.error("Error en obtenerAnunciosRecientes:", err);
        return [];
    }
}

/*
const res3 = await obtenerAnunciosRecientes()
console.log(res3)*/


// Recibe estado ('PENDIENTE', 'APROBADO', 'CANCELADO')
// Retorna una lista de diccionarios con esos eventos
export async function obtenerEventosPorEstado(estado) {
    try {
        const res = await fetch(`http://localhost:3005/api/eventos/lista?estado=${estado}`);
        
        if (!res.ok) throw new Error("Error al obtener la lista de eventos");

        return await res.json();
    } catch (err) {
        console.error("Error en obtenerEventosPorEstado:", err);
        return [];
    }
}
/*
const res = await obtenerEventosPorEstado('APROBADO')
console.log(res)
*/

// recibe id de usuario y evento
// retorna codigo y error (diccionario)
export async function desinscribirDeEvento(idEvento, idUsuario) {
    try {
        const res = await fetch("http://localhost:3005/api/eventos/desinscribir", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idEvento, idUsuario })
        });

        if (!res.ok) throw new Error("Error en la comunicación con el servidor");

        return await res.json();
    } catch (err) {
        console.error("Error en desinscribirDeEvento:", err);
        return { Codigo: -1, Mensaje: err.message };
    }
}

/*
const res = await desinscribirDeEvento(9, 7)
console.log(res)
*/



// recibe : id de un evento
// retorna diccionario de los inscritos con nombre, carnet, correo, si asistió y fecha de inscripción
export async function obtenerAsistentesEvento(idEvento) {
    try {
        const res = await fetch(`http://localhost:3005/api/eventos/asistentes/${idEvento}`);
        
        if (!res.ok) throw new Error("Error al obtener la lista de asistentes");

        return await res.json();
    } catch (err) {
        console.error("Error en obtenerAsistentesEvento:", err);
        return [];
    }
}


const res1 = await obtenerAsistentesEvento(9)
console.log(res1)







// recibe nada
// retorna todos los usuarios del sistema (lista de diccionarios), con nombre, correo, rol y cantidad de eventos realizados
export async function obtenerDetalleUsuarios() {
    try {
        const res = await fetch("http://localhost:3005/api/admin/usuarios-detallados");
        
        if (!res.ok) throw new Error("Error al obtener el listado de usuarios");

        return await res.json();
    } catch (err) {
        console.error("Error en obtenerDetalleUsuarios:", err);
        return [];
    }
}

/*
const res = await obtenerDetalleUsuarios()
console.log(res)
*/





// recive id del evento y la acción ('Aprobar' o 'Rechazar')
// retorna diccionario con código y mensaje
export async function gestionarEvento(accion, idEvento) {
    const res = await fetch("http://localhost:3005/api/admin/gestionar-evento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, idEvento })
    });
    return await res.json();
}

/*
const res = await gestionarEvento('Aprobar', 1)
console.log(res)

const res1 = await gestionarEvento('Rechazar', 4)
console.log(res1)
*/


// recibe  correo del usuario y rol ('Activar' o 'Desactivar')
// retorna codigo y mensaje
export async function gestionarRolOrganizador(correo, accion) {
    try {
        const res = await fetch("http://localhost:3005/api/admin/gestionar-rol", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, accion })
        });

        if (!res.ok) throw new Error("No se pudo actualizar el rol");

        return await res.json();
    } catch (err) {
        console.error("Error en gestionarRolOrganizador:", err);
        return { Codigo: -1, Mensaje: err.message };
    }
}
/*
const res = await gestionarRolOrganizador("test1775575788878@mail.com", "Activar")
console.log(res)
*/


// recibe carnet, id del evento y la acción ('Presente' o 'Ausente'
// retorna codigo y mensaje
export async function marcarAsistencia(carnet, idEvento, accion) {
    try {
        const res = await fetch("http://localhost:3005/api/eventos/marcar-asistencia", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ carnet, idEvento, accion })
        });

        return await res.json();
    } catch (err) {
        console.error("Error al marcar asistencia:", err);
        return { Codigo: -1, Mensaje: err.message };
    }
}

/*
const res = await marcarAsistencia("2024066829", 9, "Presente")
console.log(res)
*/




// recibe id de evento
// retorna lista de los correos de los asistentes
export async function obtenerCorreosAsistentes(idEvento) {
    try {
        const res = await fetch(`http://localhost:3005/api/eventos/correos/${idEvento}`);
        
        if (!res.ok) throw new Error("No se pudieron obtener los correos");

        return await res.json(); // Retorna: ["correo1@ejemplo.com", "correo2@ejemplo.com", ...]
    } catch (err) {
        console.error("Error en obtenerCorreosAsistentes:", err);
        return [];
    }
}










