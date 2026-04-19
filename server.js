import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer'; //Para enviar correos

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.use(cors());
app.use(express.json());

const config = {
    user: 'bdd_sql_2026',
    password: 'Tec20IC26',
    server: 'py-01-bdd-1s2026.database.windows.net',
    database: 'PY02BDDIS2026',
    options: { encrypt: true, trustServerCertificate: true }
};

// Configuracion del correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sistemadeeventos17@gmail.com',
        pass: 'lvpcmtualzvvrnxy'
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

// Ruta de prueba API
app.get('/api', (req, res) => {
    res.send('API funcionando correctamente');
});

//Apis

//sp RegistrarUsuario
app.post('/api/registrar-usuario', async (req, res) => {
    
    try {
        const { nombre, apellido, correo, contrasena, carnet } = req.body;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inNombre', sql.VarChar, nombre)
            .input('inApellido', sql.VarChar, apellido)
            .input('inCorreo', sql.VarChar, correo)
            .input('inContrasena', sql.VarChar, contrasena)
            .input('inCarnet', sql.VarChar, carnet)
            .execute('sp_RegistrarUsuario');

        res.json(result.recordset[0]); 
    } catch (err) {
        console.error("Error en SQL:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

//sp InicioDeSesión
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inCorreo', sql.VarChar, correo)
            .input('inContrasena', sql.VarChar, contrasena)
            .execute('sp_IniciarSesion');

        // Tomamos la primera fila del resultado
        const respuesta = result.recordset[0];

        if (respuesta.Codigo === 0) {
            // Si el código es 0, enviamos toda la información del usuario
            res.json(respuesta);
        } else {
            // Si el código es 1 (u otro), enviamos el mensaje de error del SP
            res.status(401).json(respuesta);
        }
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

//sp CrearEvento
app.post('/api/crear-evento', async (req, res) => {
    const { idOrganizador, nombre, descripcion, categoria, fecha, modalidad, enlace, cupo } = req.body;
    

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            
            .input('inNombreEvento', sql.VarChar(60), nombre)
            .input('inDescripcion',sql.VarChar(1000),descripcion)
            .input('inidOrganizador', sql.Int, idOrganizador)
            .input('inCategoria', sql.VarChar(45), categoria)
            .input('inFechaEvento', sql.DateTime, new Date(fecha))
            .input('inModalidad', sql.VarChar(20), modalidad)
            .input('inEnlacePlenaria', sql.VarChar(45), enlace)
            .input('inCupo', sql.Int, cupo) 
            .execute('sp_CrearEvento');

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("ERROR DE SQL:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// sp_ConsultarEventosProximos
app.get('/api/eventos-proximos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
 
            .execute('sp_ConsultarEventosProximos');


        res.json(result.recordset); 
    } catch (err) {
        console.error("Error al consultar eventos:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

app.get('/api/eventos-proximos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
        
 
            .execute('sp_ConsultarEventosProximos');


        res.json(result.recordset); 
    } catch (err) {
        console.error("Error al consultar eventos:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// sp ver mis eventos creados
// El ":id" es el parámetro que recibirá el ID del organizador
app.get('/api/eventos-creados/:id', async (req, res) => {
    try {
        
        const { id } = req.params; //Parámetro de URL

        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdOrganizador', sql.Int, id) 
            .execute('sp_VerMisEventos');

        res.json(result.recordset);
    } catch (err) {
        console.error("sError en sp_VerMisEventos:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

//sp para filtrar eventos
app.post('/api/filtrar-eventos', async (req, res) => {
    const { modalidad, categoria, rango } = req.body;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inModalidad', sql.VarChar(20), modalidad)
            .input('inCategoria', sql.VarChar(20), categoria)
            .input('inRango', sql.VarChar(30), rango)
            .execute('sp_FiltrarEventos');

        // result.recordset ya incluirá Descripcion y NombreOrganizador
        res.json(result.recordset);
    } catch (err) {
        console.error("Error en el filtro:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// sp incribirse
app.post('/api/inscribir-evento', async (req, res) => {
    const { idEvento, idUsuario } = req.body;
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, idEvento)
            .input('inIdUsuario', sql.Int, idUsuario)
            .execute('sp_InscribirEvento');

        // Retornamos el primer registro con el Codigo y Mensaje del SP
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error al inscribir:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: "Error interno del servidor" });
    }
});




// Obtener inscritos de un evento
// Recibe: evento_id en la URL (esto creo que es algo que luego hayq ue modificar en los html para mandar el id del evento seleccionado)
// Retorna: lista de { NombreUsuario, CorreoElectronico }
// Uso: el frontend carga esta lista para que el organizador elija a quienes escribirle
app.get('/api/inscritos/:evento_id', async (req, res) => {
    const { evento_id } = req.params;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, evento_id)
            .execute('sp_ObtenerCorreosInscritos'); // SP pendiente de crear

        res.json(result.recordset);
    } catch (err) {
        console.error("Error al obtener inscritos:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// Enviar mensaje a asistentes (organizador)
// Recibe: { correos: ["correo", "correo2"], asunto: string, mensaje: string }
// El frontend decide a quienes mandar (todos o seleccion)
//Este no toca la base de datos, solo usa nodemailer para mandar los correos a los destinatarios seleccionados
app.post('/api/enviar-mensaje-asistentes', async (req, res) => {
    const { correos, asunto, mensaje } = req.body;

    try {
        // Mandar correo a cada destinatario seleccionado
        for (const correo of correos) {
            await transporter.sendMail({
                from: '"Sistema de Eventos TEC" <sistemadeeventos17@gmail.com>',
                to: correo,
                subject: asunto,
                text: mensaje
            });
        }

        res.json({ Codigo: 0, Mensaje: 'Correos enviados correctamente' });
    } catch (err) {
        console.error("Error al enviar correo:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// Notificar rechazo de evento al organizador (admin)
// Recibe: { evento_id: int, motivo: string }
// Consulta el SP para obtener el correo del organizador y le manda el motivo del rechazo
// Retorna: { Codigo: 0, Mensaje: "Correo enviado" } o error
app.post('/api/notificar-rechazo', async (req, res) => {
    const { evento_id, motivo } = req.body;

    try {
        //Obtenr el correo del organizador
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, evento_id)
            .execute('sp_ObtenerCorreoOrganizador'); // SP PENDIENTE

        const correoOrganizador = result.recordset[0].CorreoElectronico; 

        //el correo con el motivo del rechazo
        await transporter.sendMail({
            from: '"Sistema de Eventos TEC" <sistemadeeventos17@gmail.com>',
            to: correoOrganizador,
            subject: 'Su evento ha sido rechazado',
            text: `Su evento ha sido rechazado por el siguiente motivo:\n\n${motivo}`
        });

        res.json({ Codigo: 0, Mensaje: 'Correo de rechazo enviado correctamente' });
    } catch (err) {
        console.error("Error al notificar rechazo:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// Notificar cancelacion de evento (admin)
// Recibe: id del evento y motivo
// Consulta el SP para obtener todos los correos de inscritos y les avisa la cancelacion
app.post('/api/notificar-cancelacion', async (req, res) => {
    const { evento_id, motivo } = req.body;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, evento_id)
            .execute('sp_ObtenerCorreosInscritos'); // mismo SP que el de inscritos

        //todos en vez de la posibilidad de eleccion que se le da al organizador
        const correos = result.recordset.map(fila => fila.CorreoElectronico);

        //
        for (const correo of correos) {
            await transporter.sendMail({
                from: '"Sistema de Eventos TEC" <sistemadeeventos17@gmail.com>',
                to: correo,
                subject: 'Un evento en el que estás inscrito ha sido cancelado',
                text: `Lamentamos informarle que el evento ha sido cancelado por el siguiente motivo:\n\n${motivo}`
            });
        }

        res.json({ Codigo: 0, Mensaje: 'Correos de cancelacion enviados correctamente' });
    } catch (err) {
        console.error("Error al notificar cancelacion:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


//api de modificar evento
app.put('/api/eventos/modificar', async (req, res) => {
    const { idEvento, nombre, descripcion, categoria, fecha, modalidad, enlace, cupo } = req.body;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, idEvento)
            .input('inNombre', sql.VarChar(60), nombre)
            .input('inDescripcion', sql.VarChar(1000), descripcion)
            .input('inCategoria', sql.VarChar(45), categoria)
            .input('inFecha', sql.DateTime, fecha)
            .input('inModalidad', sql.VarChar(20), modalidad)
            .input('inEnlace', sql.VarChar(45), enlace)
            .input('inCupo', sql.Int, cupo)
            .execute('sp_ModificarEvento');

        // El SP retorna { Codigo, Mensaje }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error en API Modificar:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// api de cancelar evento
app.put('/api/eventos/cancelar', async (req, res) => {
    const { idEvento } = req.body;

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdEvento', sql.Int, idEvento)
            .execute('sp_CancelarEvento');

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error en API Cancelar:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// api consultar solicitudes
app.get('/api/admin/solicitudes/:idAdmin', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('inIdAdmin', sql.Int, req.params.idAdmin)
            .execute('sp_ConsultarSolicitudesPendientes');
        
      
        res.json({
            modificaciones: result.recordsets[0],
            cancelaciones: result.recordsets[1]
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// api de procesar solicitudes
app.put('/api/admin/procesar-solicitud', async (req, res) => {
    const { idSolicitud, accion, tipo } = req.body;
    let spNombre = "";

    // IMPORTANTE: Los strings deben coincidir con lo que mandas desde el frontend
    if (tipo === 'modificacion') {
        spNombre = (accion === 'aprobar') ? 'sp_AprobarModificacion' : 'sp_RechazarModificacion';
    } else if (tipo === 'cancelacion') {
        spNombre = (accion === 'aprobar') ? 'sp_AprobarCancelacion' : 'sp_RechazarCancelacion';
    }

    try {
        let pool = await sql.connect(config);
        
        if (!spNombre) {
            throw new Error(`Acción o tipo inválido: ${accion} - ${tipo}`);
        }

        let result = await pool.request()
            .input('inIdSolicitud', sql.Int, idSolicitud)
            .execute(spNombre);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("ERROR REAL EN TERMINAL:", err.message);
        // Esto evita el error de JSON.parse en el frontend:
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// Obtener eventos pasados del usuario
app.get('/api/usuario/eventos/pasados/:idUsuario', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inIdUsuario', sql.Int, req.params.idUsuario)
            .execute('sp_VerMisInscripcionesPasadas');
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Error al recuperar eventos pasados:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// Obtener inscripciones futuras del usuario
app.get('/api/usuario/eventos/futuros/:idUsuario', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inIdUsuario', sql.Int, req.params.idUsuario)
            .execute('sp_VerMisInscripcionesFuturas');
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Error al recuperar inscripciones futuras:", err.message);
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// sp Crear un anuncio 
app.post('/api/anuncios/crear', async (req, res) => {
    const { mensaje } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inMensaje', sql.VarChar(1500), mensaje)
            .execute('sp_CrearAnuncio');
        
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// Obtener los últimos 3 anuncios
app.get('/api/anuncios/recientes', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .execute('sp_VerAnuncios');
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//sp obtener todos los evento
app.get('/api/eventos/lista', async (req, res) => {
    const { estado } = req.query; // Obtiene el estado de la URL
    
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inEstado', sql.VarChar(20), estado)
            .execute('sp_VerTodosLosEventos');
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

//sp desisncribir a evento
app.put('/api/eventos/desinscribir', async (req, res) => {
    const { idEvento, idUsuario } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inIdEvento', sql.Int, idEvento)
            .input('inIdUsuario', sql.Int, idUsuario)
            .execute('sp_DesinscribirEvento');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// sp obtener lista de los asistentes de un evento
app.get('/api/eventos/asistentes/:idEvento', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inIdEvento', sql.Int, req.params.idEvento)
            .execute('sp_MostrarAsistentesEvento');
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

//sp obtener los usuarios del sistema
app.get('/api/admin/usuarios-detallados', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .execute('sp_MostrarUsuarios');
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});


// sp de rechazar o cancelar eventos
app.put('/api/admin/gestionar-evento', async (req, res) => {
    const { accion, idEvento } = req.body; // 'Aprobar' o 'Rechazar'

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inAccion', sql.VarChar(25), accion)
            .input('inIdEvento', sql.Int, idEvento)
            .execute('sp_AprobarRechazarEvento');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// sp de gestionar rol
app.put('/api/admin/gestionar-rol', async (req, res) => {
    const { correo, accion } = req.body; // Se envía correo y acción ('Activar'/'Desactivar')

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inCorreo', sql.VarChar(100), correo)
            .input('inAccion', sql.VarChar(20), accion)
            .execute('sp_GestionarOrganizadores');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});




//sp marcar asistencia
app.put('/api/eventos/marcar-asistencia', async (req, res) => {
    const { carnet, idEvento, accion } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('inCarnet', sql.VarChar(20), carnet)
            .input('inIdEvento', sql.Int, idEvento)
            .input('inAccion', sql.VarChar(20), accion)
            .execute('sp_MarcarAsistencia');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ Codigo: -1, Mensaje: err.message });
    }
});

// Arranque
const PORT = 3005;
app.listen(PORT, () => {
    console.log(`\nSERVIDOR ONLINE EN: http://127.0.0.1:${PORT}`);


    // Esperamos 1 segundo para que Express asiente las rutas
    setTimeout(() => {

    }, 1000);
});

//taskkill /F /IM node.exe