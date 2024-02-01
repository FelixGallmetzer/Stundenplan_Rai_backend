const mysql = require("mysql");
const connectionProperties = {
  connectionLimit: 3,
  host: "ulsq0qqx999wqz84.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  user: "g5ec4ljgfr0kwo61",
  password: "mae6mu11wtk59d7k",
  database: "de7rtnl9b2hldxvv",
};
class Database {
  constructor(connectionProperties) {
    this.connection = mysql.createConnection(connectionProperties);
  }
  query(sql, params) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      });
    });
  }
  queryClose(sql, params) {
    const ret = this.query(sql, params);
    this.close();
    return ret;
  }
  close() {
    return new Promise((resolve, reject) =>
      this.connection.end(() => resolve())
    );
  }
}
async function getAll() {
  try {
    const database = new Database(connectionProperties);
    const sql = ` SELECT wid 
    FROM wochenplaene`;
    const result = await database.queryClose(sql);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

getAll().then(result => {console.log(result)}).catch(error => {console.log(error)});