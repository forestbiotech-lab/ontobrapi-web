const express = require('express');
const router = express.Router();
let xsd = require("@ontologies/xsd")
let classProperties = require('./../componentes/sparql/classProperties')
let formOptions=require('./../componentes/dataStructures/formOptions')
let info=require('./../componentes/dataStructures/info')

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
