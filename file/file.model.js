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

async function save(file, plan) {
  let lastName = "";

  // Find the first uppercase character
  let firstUpperCaseIndex = -1;
  for (var i = 0; i < file.name.length; i++) {
    if (file.name[i] === file.name[i].toUpperCase()) {
      firstUpperCaseIndex = i;
      lastName = file.name[i];
      break;
    }
  }

  // Collect uppercase characters for lastName
  for (var i = firstUpperCaseIndex + 1; i < file.name.length; i++) {
    if (file.name[i] === file.name[i].toUpperCase()) {
      lastName = lastName + file.name[i];
    } else {
      break; // Stop when a lowercase character is encountered
    }
  }

  let firstName = "";
  lastName = lastName.slice(0, lastName.length - 1);

  // Collect lowercase characters for firstName
  for (
    var i = firstUpperCaseIndex + lastName.length;
    i < file.name.length;
    i++
  ) {
    firstName = firstName + file.name[i];
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
      file.montag,
      file.dienstag,
      file.mittwoch,
      file.donnerstag,
      file.freitag,
      file.samstag,
      file.sonntag,
    ];

    let wid = null;
    let mid = null;

    // Execute the first query to get wid
    pool.query(sqlWeek, valuesWeek, (errorWeek) => {
      pool.query(sql, (error1, results1) => {
        if (error1) {
          console.error("Error executing query 1:", error1);
          return;
        }

        wid = results1.length > 0 ? results1[0].wid : null;

        // Execute the second query to get mid
        pool.query(sql1, [firstName,lastName
        ], (error2, results2) => {
          if (error2) {
            console.error("Error executing query 2:", error2);
            return;
          }

          mid = results2.length > 0 ? results2[0].mid : null;

          // Perform the insert query with the obtained values
          pool.query(sql2, [wid, mid, ...values], (error3) => {
            if (error3) {
              if (error3.code == 'ER_DUP_ENTRY') {
                console.error("Duplicate entry error");
                // Handle duplicate entry error here
              } else {
                console.error("Error executing insert query:", error3);
              }
              return;
            }

            // If execution reaches here, the insert was successful
          });
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
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

function getUserList(callback) {
 
  const sql = `
  select m.mid,mfname,mname,awdienst,COUNT(*) as count
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
  const sql=`
  select m.mid,mfname,mname,awdienst,COUNT(*) AS count
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
  const sql=`SELECT tname 
              FROM taetigkeiten`;

  pool.query(sql, (error, result) => {
    if (error) {
      console.log("Error in query", error);
      callback("Database error", null);
    } else {
      callback(null, result);
    }
  })
}

module.exports = { getAll, remove, get, save, getUser, getUserList, getSpecificList, getTaetigkeiten };
