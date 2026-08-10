import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Support DATABASE_URL (single connection string) OR individual env vars
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: isProduction ? false : console.log,
      dialectOptions: isProduction
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, underscored: true },
    })
  : new Sequelize(
      process.env.DB_NAME || 'crm_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: isProduction ? false : console.log,
        dialectOptions: isProduction
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true },
      }
    );

export default sequelize;
