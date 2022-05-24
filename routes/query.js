const express = require('express');
const router = express.Router();
let xsd = require("@ontologies/xsd")
let classProperties = require('./../componentes/sparql/classProperties')
let inferredRelationship = require('./../componentes/sparql/inferredRelationships')
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

router.get('/inferred/objectProperty/:class',(req,res)=>{
  let className=req.params.class
  inferredRelationship.objectProperties(className).then(result=>{
      res.json(result)
  }).catch(err=>{
    let message=err.msg
    let stack=err.stack
    res.json({err,message,stack})
  })

})
router.get('/inferred/dataProperty/:class',(req,res)=>{
  let className=req.params.class
  inferredRelationship.dataProperties(className).then(result=>{
    res.json(result)
  }).catch(err=>{
    let message=err.msg
    let stack=err.stack
    res.json({err,message,stack})
  })

})

module.exports = router;
