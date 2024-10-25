import mysql from 'promise-mysql';
import config from '../config.js';

let connection;

const getConnection = async () => {
  try {
    // Si no hay una conexión abierta, creamos una nueva.
    if (!connection) {
      connection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port || 3306, // Aseguramos que siempre intente usar el puerto correcto.
      });
      console.log('Conexión a MySQL establecida.');
    }
    return connection;
  } catch (error) {
    console.error('Error al conectar con MySQL:', error);
    throw error; // Lanzamos el error para que pueda ser capturado donde sea necesario.
  }
};

export { getConnection };
