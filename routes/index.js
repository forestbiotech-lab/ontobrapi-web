var express = require('express');
var router = express.Router();
var sparqlQuery = require('.././componentes/sparql/sparqlQuery')



/* GET home page. */
router.get('/', function(req, res, next) {
  sparqlQuery().then(queryRes=>{
  	result=queryRes.split('\n')
  	res.render('index', { title: 'Express', result});
  })
});

module.exports = router;
