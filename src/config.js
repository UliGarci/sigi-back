import { config } from 'dotenv';
config();  // Cargar variables del archivo .env

export default {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mi_base_datos',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
};
