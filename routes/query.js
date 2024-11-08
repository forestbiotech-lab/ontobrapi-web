const express = require('express');
const router = express.Router();
const glob=require('glob');
let xsd = require("@ontologies/xsd")
let classProperties = require('../componentes/sparql/baseOntologyClassProperties')
let inferredRelationship = require('./../componentes/sparql/inferredRelationships')
let formOptions=require('./../componentes/dataStructures/formOptions')
let info=require('./../componentes/dataStructures/info')
const {dataProperty} = require("../componentes/dataStructures/info");
const path=require('path')
const listClasses = require('./../componentes/sparql/ppeoListClasses')

//TODO set this in config file
const baseOntologyURI="http://purl.org/ppeo/PPEO.owl#"

// query/

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/ppeo/class/:class/properties/', async function(req, res, next) {
  let className=req.params.class
  let queryResult=await classProperties(className,baseOntologyURI)
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
  inferredRelationship.objectProperties(className,baseOntologyURI).then(result=>{
      res.json(result)
  }).catch(err=>{
    let message=err.msg
    res.json({err,message,stack})
  })

})
router.get('/inferred/dataProperty/:class',(req,res)=>{
  let className=req.params.class
  inferredRelationship.dataProperties(className,baseOntologyURI).then(result=>{
    res.json(result)
  }).catch(err=>{
    let message=err.msg
    res.json({err,message,stack})
  })

})

router.get('/inferred/dataPropertyRange/:dataProperty',(req,res)=>{
  let dataProperty=req.params.dataProperty
  inferredRelationship.dataPropertyRange(dataProperty,baseOntologyURI).then(result=>{
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


router.get('/mapping/json',(req,res)=>{
  let mappings=glob.sync("__dirname/../reference_files/*.json")
  mappings=mappings.map(file=>path.basename(file,".json"))
  res.json(mappings)

})

router.get('/reference_files/xlsx',(req,res)=>{
  let ref_files=glob.sync("__dirname/../reference_files/MIAPPE*.xlsx")
  ref_files=ref_files.map(file=>path.basename(file,".xlsx"))
  res.json(ref_files)
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
