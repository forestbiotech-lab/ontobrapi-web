var express = require('express');
var router = express.Router();
var sparqlQuery = require('.././componentes/sparql/sparqlQuery')

// / not previous route 

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



module.exports = router;
