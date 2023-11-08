const express = require('express');
const router = express.Router();
const glob=require('glob');
let xsd = require("@ontologies/xsd")
let classProperties = require('./../componentes/sparql/classProperties')
let inferredRelationship = require('./../componentes/sparql/inferredRelationships')
let formOptions=require('./../componentes/dataStructures/formOptions')
let info=require('./../componentes/dataStructures/info')
const {dataProperty} = require("../componentes/dataStructures/info");
const path=require('path')
const listClasses = require('./../componentes/sparql/ppeoListClasses')

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
    res.json({err,message,stack})
  })

})
router.get('/inferred/dataProperty/:class',(req,res)=>{
  let className=req.params.class
  inferredRelationship.dataProperties(className).then(result=>{
    res.json(result)
  }).catch(err=>{
    let message=err.msg
    res.json({err,message,stack})
  })

})

router.get('/inferred/dataPropertyRange/:dataProperty',(req,res)=>{
  let dataProperty=req.params.dataProperty
  inferredRelationship.dataPropertyRange(dataProperty).then(result=>{
    res.json(result)
  }).catch(err=>{
    let message=err.msg
    res.json({err,message,stack})
  })

})

router.get('/ppeo/listClasses',async (req,res)=>{
  try{
    let classList=await listClasses()
    if (classList instanceof Error) res.json()
    res.json(classList)
  }catch (e) {
    res.sendStatus(400)
  }
})

router.get('/db/sparql/search/:fileName',(req,res)=>{
  let files=glob.sync("__dirname/../db/*.nt",{absolute:true})
  
  res.json(files)

})
router.get('/db/sparql/default/ontoBrapi.nt',(req,res)=>{
  let db="__dirname/../db/RAIZ_all_v1.nt"
  //res.set("Content-Disposition", 'attachment; ontoBrAPI.nt"')
  res.sendFile(path.resolve(db),{headers:{"Content-Disposition": 'attachment; filename:"ontoBrAPI.nt"'}})

})
module.exports = router;
