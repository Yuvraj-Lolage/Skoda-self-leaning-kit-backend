const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',       
  user: 'root',            
  password: 'yuvraj@123',
  database: 'skoda_self_learning_kit',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();
module.exports = promisePool;