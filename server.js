import sql from 'mssql';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const config = {
    user: 'bdd_sql_2026', 
    password: 'Tec20IC26', 
    server: 'py-01-bdd-1s2026.database.windows.net', 
    database: 'PY02BDDIS2026',
    options: { encrypt: true, trustServerCertificate: true }
};

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



// Arranque
const PORT = 3005;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`\nSERVIDOR ONLINE EN: http://127.0.0.1:${PORT}`);


    // Esperamos 1 segundo para que Express asiente las rutas
    setTimeout(() => {

    }, 1000);
});