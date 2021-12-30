var express = require('express');
var router = express.Router();
var xsd = require("@ontologies/xsd")
var classProperties = require('./../componentes/sparql/classProperties')
var formOptions=require('./../componentes/dataStructures/formOptions')
var info=require('./../componentes/dataStructures/info')
var formOptions=require('./../componentes/dataStructures/formOptions')
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

router.get('/xsd/datatypes/', function(req, res) {
  res.json(xsd)
});

router.get('/dataStructures/info/', function(req, res) {
  res.json(info)
});
router.get('/dataStructures/formOptions/', function(req, res) {
  res.json(formOptions)
});


module.exports = router;
