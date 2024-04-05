const express = require('express');
const router = express.Router();

// Um Endpunkt absichern zu können
const { expressjwt } = require('express-jwt');
const PASSWORD = 'secret';
const ALGORITHM = 'HS256';

const {
  listAction,
  listUserAction,
  removeAction,
  importAction,
  loginAction,
  statistikAction,
  getUserByID,
  getTaetigkeitenList,
  mitarbeiterHinzufuegen,
  getMitarbeiter,
  getMitarbeiterbyID,
  updateUser,
  deleteUser,
  deleteTaetigkeit,
  taetigkeitHinzufügen,
  updateTaetigkeit,
  getTaetigkeit
} = require('./file.controller.js');

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
router.get('/', listAction);
router.get('/user?', expressjwt({ secret: PASSWORD, algorithms: [ ALGORITHM ] }),   listUserAction);
router.get('/remove/:id', expressjwt({ secret: PASSWORD, algorithms: [ ALGORITHM ] }), removeAction);
router.post('/import', importAction);
router.post('/login', loginAction);
router.get('/statistik', statistikAction);
router.get('/statistik/:id', getUserByID);
router.get('/taetigkeiten', getTaetigkeitenList);
router.get('/taetigkeit/:name', getTaetigkeit);
router.get('/taetigkeit/loeschen/:tname', deleteTaetigkeit);
router.put('/taetigkeit/bearbeiten', updateTaetigkeit);
// {
//   "tnamealt": "A",
//   "tnameneu": "AB",
//   "tbeschreibung": "kdsfhjsdfbskd"
// }
router.post('/taetigkeiten/hinzufuegen', taetigkeitHinzufügen);
// {
//   "tname": "A",
//   "tbeschreibung": "askdsjdgds"
// }
router.post('/mitarbeiter/hinzufuegen',mitarbeiterHinzufuegen);
// values need to be passed in Body like this:
// {
//  "bid": 1,
//  "memail": null,
//  "mfname": "GALLMETZER",
//  "mname": "Felix",
//  "mpasswort": null
//}
router.get('/mitarbeiter', getMitarbeiter);
router.get('/mitarbeiter/:id', getMitarbeiterbyID);
router.put('/mitarbeiter/bearbeiten', updateUser); 
// Pass the values in the Body like this:
// {
//   "mid": 2743,
//   "bid": 2,
//   "memail": "felix.gallmetzer@gmail.com",
//   "mfname": "GALLMETZER",
//   "mname": "Felix",
//   "mpasswort": "felix"

// }
router.get('/mitarbeiter/loeschen/:id', deleteUser);


module.exports = router;