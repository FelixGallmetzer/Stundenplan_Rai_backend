const fileModel = require("./file.model.js");
const fileView = require("./file.view.js");

function listAction(request, response) {
  response.send(fileView.renderList(fileModel.getAll()));
}

// No idea whether this works
function listUserAction(request, response) {
  response.send(
    fileView.renderUser(
      fileModel.getUser(request.body.uusername, request.body.upassword)
    )
  );
}

function removeAction(request, response) {
  fileModel.remove(request.params.id);
  response.redirect(request.baseUrl);
}

async function importAction(request, response) {
  // return response.status(500).json({ error: 'This is an example error message' });
  
  const xlsx = require("node-xlsx");
  const fs = require("fs");

  const filePath = "tempfiles/input.xls";

  const file = {
    uid: request.body.uid || -1,
    name: request.files.file.name,
    size: request.files.file.size,
    data: request.files.file.data,
  };

  fs.writeFile(filePath, file.data, (err) => {
    if (err) console.log(err);
  });

  const excelData = xlsx.parse(fs.readFileSync(filePath));

  const firstSheet = excelData[0];

  // console.log("saving");
  // console.log(file.data);
  result = await fileModel.save(file, firstSheet);
  if (result === "201") {
    return response.status(201).json({ message: 'Erfolgreich Importiert' });
  } else if (result === "500") {
    return response.status(500).json({ message: 'Ein interner Fehler ist aufgetreten, bitte versuche es nochmal' });
  } else if (result === "409") {
    return response.status(409).json({ message: 'Stundenplan wurde bereit hochgeladen'});
  } else if (result === "406") {
    return response.status(406).json({ message: 'Etwas im Stundenplan ist nicht ausgefüllt oder wurde nicht richtig formatiert'});
  }

  response.redirect(request.baseUrl);
}


// Um JWT erstellen zu können
const jwt = require("jsonwebtoken");
// Sekunden der Lebenszeit eines Tokens
const EXPIRES_IN = 10000;
const PASSWORD = "secret";
const ALGORITHM = "HS256";
function loginAction(request, response) {
  const ur = request.body;
  // console.log(`Getting request from ${ur.na}`)
  fileModel
    .getUser(ur.na, ur.pw)
    .then((result) => {
      const jwtToken = jwt.sign(
        { na: result.uusername, id: result.uid },
        PASSWORD,
        { expiresIn: EXPIRES_IN, algorithm: ALGORITHM }
      );
      response.send({ jwt: jwtToken });
    })
    .catch((error) => response.status(401).send("unauthorized"));
}

function statistikAction(req, res) {
  // Call getUserList from the database module
  fileModel.getUserList((error, result) => {
    if (error) {
      // console.log(error);
      res.status(500).json({ error: error });
    } else {
      res.json(result);
    }
  });
}

function getUserByID(req, res) {
  const id = req.params.id;
  console.log(id);
  fileModel.getSpecificList(id, (error, result) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: error });
    } else {
      res.json(result);
    }
  });
}

function getTaetigkeitenList(req, res) {
  fileModel.getTaetigkeiten((error, result) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: error });
    } else {
      res.json(result);
    }
  });
}


async function mitarbeiterHinzufuegen(req,res) {
  try {
    let result = await fileModel.addUser(req.body);
    res.status(200).json({ message: "Mitarbeiter erfolgreich hinzugefügt"});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
function getMitarbeiter(req,res) {
  fileModel.getMitarbeiter((error, result) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: error });
    } else {
      res.json(result);
    }
  });
}

module.exports = {
  listAction,
  listUserAction,
  removeAction,
  importAction,
  loginAction,
  statistikAction,
  getUserByID,
  getTaetigkeitenList,
  mitarbeiterHinzufuegen,
  getMitarbeiter
};
