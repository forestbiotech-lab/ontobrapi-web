const express = require('express');
const router = express.Router();
let sparqlQuery = require('.././componentes/sparql/sparqlQuery')
const path=require('path')
const fs = require('fs')
const { exec } = require("child_process");
const cors = require('cors')
const octicons = require('@primer/octicons')


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



// Shows and example of the sqarl quary output.
router.get('/query', function(req, res, next) {
  sparqlQuery().then(queryRes=>{
  	result=queryRes.split('\n')
  	res.render('query', { title: 'Express', result});
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
