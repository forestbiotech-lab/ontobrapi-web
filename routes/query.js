var express = require('express');
var router = express.Router();
var classProperties = require('./../componentes/sparql/classProperties')

// query/

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/ppeo/class/:class/properties/', async function(req, res, next) {
  let className=req.params.class
  let queryResult=await classProperties(className)
  res.json(queryResult)  
});



module.exports = router;
