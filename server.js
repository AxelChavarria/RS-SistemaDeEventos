import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const { idOrganizador, nombre, categoria, fecha, modalidad, enlace, cupo } = req.body;
    

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            
            .input('inNombreEvento', sql.VarChar(60), nombre)
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




// Arranque
const PORT = 3005;
app.listen(PORT, () => {
    console.log(`\nSERVIDOR ONLINE EN: http://127.0.0.1:${PORT}`);


    // Esperamos 1 segundo para que Express asiente las rutas
    setTimeout(() => {

    }, 1000);
});

//taskkill /F /IM node.exe