const express = require('express');
const router = express.Router();
const freeQuery = require('.././componentes/sparql/freeQuery')
const path=require('path')
const fs = require('fs')
const { exec } = require("child_process");
const cors = require('cors')
const octicons = require('@primer/octicons')
const config = require('../.config.json')



/*var corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}*/

let runningVersion="DEV";
(function getVersion(){
  if(process.env.GIT_COMMIT){
    runningVersion=process.env.GIT_COMMIT
  }
}())

// / no previous route 

router.get('/', function(req, res, next) {
  res.render('index', { title: 'PHENO',version:runningVersion,octicons});
});



/* GET home page. */
router.get('/submit', function(req, res, next) {
  res.render('submit', { title: 'Onto BrAPI',version:runningVersion})
});


router.get('/dev/configs', function(req, res, next) {
  let admin={}
  if (process.env.GIT_COMMIT === undefined) {
    admin=config.admin
  }
  res.json( admin )
});

// Shows and example of the sqarl query output.
router.get('/query', function(req, res, next) {
  let subject = 's'
  let object = 'o'
  let predicate = 'p'
  const query = ` 
  SELECT DISTINCT * 
  FROM <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
  WHERE { ?${subject} ?${predicate} ?${object}}`
  freeQuery(query).then(queryRes=>{
    let result=queryRes
    res.render('query', { title: 'Example Query', result});
  }).catch(err=>{
    res.error(err)
  })
});

//Just shows and output example of a JSON file.
router.get('/parse', function(req, res, next) {
  let attr=require('./../componentes/attrlist.js')
  res.json(attr)
});

//Sends a file in the upload dir based on the URL parameter file
router.get('/sparql/raiz/:file',(req,res)=>{
  let fileName=req.params.file
  let data = fs.readFileSync(`${__dirname}/../uploads/uploadedfiles/${fileName}.nt`)
  console.log(`${__dirname}/../uploads/uploadedfiles/${fileName}.nt`)
  res.set('Content-Type', 'text/plain')
  res.send(`${data}`)
})



module.exports = router;
