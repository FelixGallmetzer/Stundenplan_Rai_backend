const mysql = require("mysql");

const connectionProperties = {
  connectionLimit: 3,
  host: "ulsq0qqx999wqz84.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  user: "g5ec4ljgfr0kwo61",
  password: "mae6mu11wtk59d7k",
  database: "de7rtnl9b2hldxvv",
};

const pool = mysql.createPool({
  connectionLimit: 3,
  host: "ulsq0qqx999wqz84.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  user: "g5ec4ljgfr0kwo61",
  password: "mae6mu11wtk59d7k",
  database: "de7rtnl9b2hldxvv",
});

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

let data = [];

async function save(file2, firstSheet) {
  const { format, addDays } = require("date-fns");
  const { utcToZonedTime } = require("date-fns-tz");

  const targetTimeZone = "Europe/Rome";
  let formatedDate;
  let plan;
  let database;

  try {
    database = new Database(connectionProperties);
    await database.query("START TRANSACTION");
    for (const [rowIndex, row] of firstSheet.data.entries()) {
      // console.log(rowIndex);
      if (rowIndex == 1) {
        //getting Startdate
        const XLSdate = row[6];
        const baseDate = new Date("1904-01-01");
        const parsedXLSdate = parseFloat(XLSdate, 10);
        date = addDays(baseDate, parsedXLSdate);

        const zonedDate = utcToZonedTime(date, targetTimeZone);

        formatedDate = format(zonedDate, "yyyy-MM-dd");

        //getting UploadDate
        const uploadDatum = new Date(Date.now());
        const formatedUploadDatum = format(uploadDatum, "yyyy-MM-dd");

        //getting XLS file
        const XLS = file2.data;

        plan = {
          start: formatedDate,
          upload: formatedUploadDatum,
          xlsfile: XLS,
        };

        // fileModel.saveWoche(plan);
      }
      if (rowIndex > 5 && rowIndex < 48) {
        const file1 = {
          uid: rowIndex,
          name: row[0] !== undefined ? row[0] : "",
          montag: row[1] !== undefined ? row[1].toUpperCase() : "",
          dienstag: row[2] !== undefined ? row[2].toUpperCase() : "",
          mittwoch: row[3] !== undefined ? row[3].toUpperCase() : "",
          donnerstag: row[4] !== undefined ? row[4].toUpperCase() : "",
          freitag: row[5] !== undefined ? row[5].toUpperCase() : "",
          samstag: row[6] !== undefined ? row[6].toUpperCase() : "",
          sonntag: row[7] !== undefined ? row[7].toUpperCase() : "",
          size: 0,
          data: null,
        };
        const shortenDay = (day) => {
          const index = file1[day].indexOf(" ");
          if (index !== -1) {
            file1[day] = file1[day].slice(0, index);
          }
        };

        [
          "montag",
          "dienstag",
          "mittwoch",
          "donnerstag",
          "freitag",
          "samstag",
          "sonntag",
        ].forEach(shortenDay);

        let lastName = "";

        // Find the first uppercase character
        let firstUpperCaseIndex = -1;
        for (var i = 0; i < file1.name.length; i++) {
          if (file1.name[i] === file1.name[i].toUpperCase()) {
            firstUpperCaseIndex = i;
            lastName = file1.name[i];
            break;
          }
        }

        // Collect uppercase characters for lastName
        for (var i = firstUpperCaseIndex + 1; i < file1.name.length; i++) {
          if (file1.name[i] === file1.name[i].toUpperCase()) {
            lastName = lastName + file1.name[i];
          } else {
            break; // Stop when a lowercase character is encountered
          }
        }

        let firstName = "";
        lastName = lastName.slice(0, lastName.length - 1);

        // Collect lowercase characters for firstName
        for (
          var i = firstUpperCaseIndex + lastName.length;
          i < file1.name.length;
          i++
        ) {
          firstName = firstName + file1.name[i];
        }

        lastName = lastName.trim();
        firstName = firstName.trim();

        // DO NOT DELETE!!!!!!!!!!!!!!!!!!!!!!!!
        // const sql = `
        // INSERT INTO mitarbeiter(mname,mfname,bid)
        // VALUES(?,?,?)`
        // pool.query(sql, [firstName,lastName,1], error => {
        //   console.log(error);
        // });

        // sql Query to insert Wochenplan into DB
        const sqlWeek = `
         INSERT INTO wochenplaene(wwochenstartdatum,wuploaddatum,wexcel)
         VALUES (?,?,?)`;

        // sql Query to get wid from DB
        const sql = `      
         SELECT wid 
         FROM wochenplaene
         WHERE wwochenstartdatum = '${plan.start}'`;

        // sql Query to get mid from DB
        const sql1 = `
         SELECT mid
         FROM mitarbeiter
         WHERE mname = ? and mfname = ?`;

        // sql Query to insert data into DB
        const sql2 = `
         INSERT INTO arbeiterwochen(wid, mid, awmontag, awdienstag, awmittwoch, awdonnerstag, awfreitag, awsamstag, awsonntag)
         VALUES (?,?,?,?,?,?,?,?,?)`;

        // Values used to insert Wochenplan
        const valuesWeek = [plan.start, plan.upload, plan.xlsfile];

        // Values used to insert data
        const values = [
          file1.montag,
          file1.dienstag,
          file1.mittwoch,
          file1.donnerstag,
          file1.freitag,
          file1.samstag,
          file1.sonntag,
        ];

        let wid = null;
        let mid = null;

        // SQL
        // Inserting Week
        if (rowIndex == 6) {
          await database.query(sqlWeek, valuesWeek);
          console.log("inserting week");
        }

        // Getting wid
        wid = await database.query(sql);
        console.log("getting wid");
        wid = wid[0].wid;


        // Getting mid
        mid = await database.query(sql1, [firstName, lastName]);
        console.log("getting mid");
        mid = mid[0].mid;

        // Inserting Row
        await database.query(sql2, [wid, mid, ...values]);
        console.log("inserting row");
      }
    }
    // commit
    await database.query("COMMIT");
    console.log("Commiting");
    return "201";
  } catch (error) {
    await database.query("ROLLBACK");
    console.log("Rollback");
    if (error instanceof TypeError) {
      return "406"
    } else if (error.code == "ER_DUP_ENTRY") {
      return "409";
    } else {
      return "500";
    }
  }
}

const crypto = require("crypto");
async function getUser(username, password) {
  if (!username || !password) {
    return Promise.reject("User not set");
  } else {
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    const sql = `
        SELECT uid, uusername, ufirstname, ulastname, upasswordhash
        FROM users
        WHERE uusername = ? AND upasswordhash = ?
        `;

    return new Promise((resolve, reject) => {
      pool.query(sql, [username, passwordHash], (error, result) => {
        if (error) {
          console.log("Error in query:", error);
          reject("Database error");
          return;
        }

        if (!result || result.length === 0) {
          reject("User not found");
        } else {
          resolve(result[0]);
        }
      });
    });
  }
}

function getAll() {
  return data;
}
function remove(uid) {
  data = data.filter((file) => file.uid !== uid);
}
function get(uid) {
  return data.find((file) => file.uid === uid);
}

function getUserList(callback) {
  const sql = `
  select m.mid as mid,mfname,mname,awdienst,COUNT(*) as count
	FROM viewarbeitswochen aw, mitarbeiter m
    WHERE aw.mid = m.mid
    GROUP BY mfname,mname,awdienst
    ORDER BY 1,2,4 DESC
`;

  pool.query(sql, (error, result) => {
    if (error) {
      console.log("Error in query", error);
      callback("Database error", null);
    } else {
      callback(null, result);
    }
  });
}

function getSpecificList(ID, callback) {
  const sql = `
  select m.mid as mid,mfname,mname,awdienst,COUNT(*) AS count
	FROM viewarbeitswochen aw, mitarbeiter m
    WHERE aw.mid = m.mid
    GROUP BY mfname,mname,awdienst
    ORDER BY 1,2,4 DESC 
  `;

  pool.query(sql, (error, result) => {
    if (error) {
      console.log("Error in query", error);
      callback("Database error", null);
    } else {
      callback(null, result);
    }
  });
}

function getTaetigkeiten(callback) {
  const sql = `SELECT tname 
              FROM taetigkeiten`;

  pool.query(sql, (error, result) => {
    if (error) {
      console.log("Error in query", error);
      callback("Database error", null);
    } else {
      callback(null, result);
    }
  });
}

async function getMitarbeiter(callback) {
  try {
    const database = new Database(connectionProperties);
    const sql = `SELECT mname,mfname,memail,mpasswort,bid
                  FROM mitarbeiter`;
    const result = await database.queryClose(sql);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

module.exports = {
  getAll,
  remove,
  get,
  save,
  getUser,
  getUserList,
  getSpecificList,
  getTaetigkeiten,
  getMitarbeiter
};
