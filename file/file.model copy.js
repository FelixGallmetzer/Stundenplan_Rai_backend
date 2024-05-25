const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 3,
  host: "ulsq0qqx999wqz84.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  user: "g5ec4ljgfr0kwo61",
  password: "mae6mu11wtk59d7k",
  database: "de7rtnl9b2hldxvv",
});

let data = [];

function getAll() {
  return data;
}
function remove(uid) {
  data = data.filter((file) => file.uid !== uid);
}
function get(uid) {
  return data.find((file) => file.uid === uid);
}

async function save(file2, firstSheet) {
  let check = 0;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      check = 1;
      return;
    }
    const { format, addDays } = require("date-fns");
    const { utcToZonedTime } = require("date-fns-tz");

    const targetTimeZone = "Europe/Rome";
    let formatedDate;
    let plan;

    connection.beginTransaction();
    console.log("Beginning Transaction");

    firstSheet.data.forEach((row, rowIndex) => {
      // console.log(rowIndex);
      if (check == 0) {
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
          let index = file1.montag.indexOf(" ");

          if (index !== -1) {
            file1.montag = file1.montag.slice(0, index);
          }

          index = file1.dienstag.indexOf(" ");

          if (index !== -1) {
            file1.dienstag = file1.dienstag.slice(0, index);
          }

          index = file1.mittwoch.indexOf(" ");

          if (index !== -1) {
            file1.mittwoch = file1.mittwoch.slice(0, index);
          }

          index = file1.donnerstag.indexOf(" ");

          if (index !== -1) {
            file1.donnerstag = file1.donnerstag.slice(0, index);
          }

          index = file1.freitag.indexOf(" ");

          if (index !== -1) {
            file1.freitag = file1.freitag.slice(0, index);
          }

          index = file1.samstag.indexOf(" ");

          if (index !== -1) {
            file1.samstag = file1.samstag.slice(0, index);
          }

          index = file1.sonntag.indexOf(" ");

          if (index !== -1) {
            file1.sonntag = file1.sonntag.slice(0, index);
          }

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

          // console.log("LastName:", lastName);
          // console.log("FirstName:", firstName);

          // DO NOT DELETE!!!!!!!!!!!!!!!!!!!!!!!!
          // const sql = `
          // INSERT INTO mitarbeiter(mname,mfname,bid)
          // VALUES(?,?,?)`
          // pool.query(sql, [firstName,lastName,1], error => {
          //   console.log(error);
          // });

          try {
            // console.log("in filemodel");
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

            // Execute the first query to get wid
            try {
              connection.query(sqlWeek, valuesWeek, (errorWeek) => {
                connection.query(sql, (error1, results1) => {
                  if (error1) {
                    console.error("Error executing query 1:", error1);

                    connection.rollback();
                    console.log("Rolling Back");
                    check = 1;
                    return;
                  }

                  wid = results1.length > 0 ? results1[0].wid : null;

                  // Execute the second query to get mid
                  connection.query(
                    sql1,
                    [firstName, lastName],
                    (error2, results2) => {
                      if (error2) {
                        console.error("Error executing query 2:", error2);

                        connection.rollback();
                        console.log("Rolling Back");
                        check = 1;
                        return;
                      }

                      mid = results2.length > 0 ? results2[0].mid : null;

                      // Perform the insert query with the obtained values
                      connection.query(
                        sql2,
                        [wid, mid, ...values],
                        (error3) => {
                          if (error3) {
                            if (error3.code == "ER_DUP_ENTRY") {
                              console.error("Duplicate entry error");

                              connection.rollback();
                              console.log("Rolling Back");
                              check = 1;
                              return;
                              // Handle duplicate entry error here
                            } else {
                              console.error(
                                "Error executing insert query:",
                                error3
                              );
                            }
                            check = 1;
                            return;
                          }
                        }
                      );
                      
                    }
                  );
                });
              });
            } catch (error) {
              console.error("Error:", error);
            }
          } catch (error) {
            connection.rollback();
            console.log("Rolling Back");
            check = 1;
            return;
          }
        }
      }
    });
    if (check == 0) {
      connection.commit();
      console.log("Commiting");
    }
  });
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

module.exports = {
  getAll,
  remove,
  get,
  save,
  getUser,
  getUserList,
  getSpecificList,
  getTaetigkeiten,
};
