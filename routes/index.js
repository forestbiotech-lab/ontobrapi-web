const express = require('express');
const router = express.Router();
let sparqlQuery = require('.././componentes/sparql/sparqlQuery')
const path=require('path')
const fs = require('fs')
const { exec } = require("child_process");

let runningVersion="0.0";
(function getVersion(){
  exec("git log --pretty=format:'%h' -1", (error, stdout, stderr) => {
    if(error) console.log("Version not found")
    else runningVersion=stdout
  })
}())

// / no previous route 

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Onto BrAPI',version:runningVersion})
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

router.get('/running/version',(req,res)=>{
  //Inefficient since its not dynamic only changes on reload image
  exec("git log --pretty=format:'%h' -1", (error, stdout, stderr) => {
    if(error) res.error(error)
    else res.json(stdout)

  })
})


module.exports = router;
