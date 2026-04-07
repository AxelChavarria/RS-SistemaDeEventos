import sql from 'mssql';
import express from 'express';
import cors from 'cors';

const app = express();


//datos de la base de datos
const config = {
    user: 'bdd_sql_2026', 
    password: 'Tec20IC26', 
    server: 'py-01-bdd-1s2026.database.windows.net', 
    database: 'PY02BDDIS2026',
    options: {
        encrypt: true, 
        trustServerCertificate: true 
    }
};
app.use(express.json());
app.use(cors());
// sp_IniciarSesion
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            // inputs
            .input('inCorreo', sql.VarChar, correo)
            .input('inContrasena', sql.VarChar, contrasena)
            // outputs
            .output('outCodigoRespuesta', sql.Int)
            .execute('sp_IniciarSesion');

        const codigo = result.output.pCodigoRespuesta;

        if (codigo === 1) {
            res.status(200).json({ 
                success: true, 
                user: result.recordset[0] 
            });
        } else {
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})



async function verifyDatabaseConnection() {
    try {
        await sql.connect(config);
        console.log("Conexión a la base de datos exitosa.");
    } catch (err) {
        console.error("Error al conectar a la base de datos:", err.message);
        process.exit(1); // Terminar el proceso si la conexión falla
    }
}

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
verifyDatabaseConnection()

//async function pruebaRegistro(nombre, correo, contrasena, carnet, apellido) 

pruebaRegistro("Axel Fabián", "ax@gmail.com", "123456","2024","Chavarría" )


