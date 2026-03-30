import sql from 'mssql';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

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