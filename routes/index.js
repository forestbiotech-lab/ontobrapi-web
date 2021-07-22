var express = require('express');
var router = express.Router();
var sparqlQuery = require('.././componentes/sparql/sparqlQuery')
var path=require('path')
var fs = require('fs')

// / no previous route 

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Onto BrAPI'})
});
/* GET home page. */
router.get('/query', function(req, res, next) {
  sparqlQuery().then(queryRes=>{
  	result=queryRes.split('\n')
  	res.render('query', { title: 'Express', result});
  }).catch(err=>{
    res.error(err)
  })
});

router.get('/parse', function(req, res, next) {
  let attr=require('./../componentes/attrlist.js')
  res.json(attr)
});

router.get('/sparql/raiz/:file',(req,res)=>{
  let fileName=req.params.file
  let data = fs.readFileSync(`${__dirname}/../uploads/uploadedfiles/${fileName}.nt`)
  console.log(`${__dirname}/../uploads/uploadedfiles/${fileName}.nt`)
  res.set('Content-Type', 'text/plain')
  res.send(`${data}`)
})


module.exports = router;
