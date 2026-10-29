import mysql from "mysql2/promise";

const sqldb = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "MySecret123!",
  database: "taskmanager_docker_test",
});

export default sqldb;
