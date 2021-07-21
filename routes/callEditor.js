var express = require('express');
var router = express.Router();
var glob = require('glob')
var sparqlQuery = require('.././componentes/sparql/sparqlQuery')
var testsparql = require('.././componentes/sparql/testsparql')
var classProperties = require('./../componentes/sparql/classProperties')
const fs = require('fs')

// calleditor/ 

router.get('/',async function(req,res,next){
  try{
    let queryResults=await testsparql()
    Promise.all(queryResults.results).then(result=>{
      queryResults.callStructure.result.data=result
      res.json(queryResults.callStructure)
    }).catch(err=>{
      throw err
    })  
  }catch(err){
    res.json(err)
  }
  
})


/* GET home page. */
router.get('/listmodules', function(req, res, next) {
  let modules=glob.sync('componentes/modules/*')
  modules=modules.map(m=>m.split("/").pop())
  let listCalls="d-none"
  let listModules="block"
  let mapCall="d-none"
  res.render('callEditor/listModules', { title: 'Onto BrAPI - Module List',modules,listCalls,listModules,mapCall})
});

router.get('/listcalls/:moduleName/list', function(req, res, next) {
  let moduleName=req.params.moduleName
  let calls=glob.sync(`componentes/modules/${moduleName}/schemes/*`)
  calls=calls.map(c=>c.split("/").pop())
  let listCalls="block"
  let listModules="d-none"
  let mapCall="d-none"
  res.render('callEditor/listCalls', { title: 'Onto BrAPI - Call List',calls,listModules,listCalls,mapCall})
});

router.get('/listcalls/:moduleName/:callName/map', async function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName 
  let json=require(`.././componentes/modules/${moduleName}/schemes/${callName}`)
  let className=json["_anchor"].class
   
  prettyHtml=require('json-pretty-html').default
  let html=prettyHtml(json)
  let anchorProperties
  try{
    anchorProperties=await classProperties(className)
  }catch(err){
    console.log(err)
    anchorProperties=[]
  }
  let listCalls="d-none"
  let listModules="d-none"
  let mapCall="block"
  res.render('callEditor/mapCall', { title: 'Onto BrAPI - Call List',json,callName,anchorProperties,html,mapCall,listCalls,listModules,moduleName})
});

router.get('/listcalls/:moduleName/:callName/json', function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName 
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  res.json(json)
});

router.post('/listcalls/:moduleName/:callName/update', function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName 
  let file=`componentes/modules/${moduleName}/schemes/${callName}`
  let data=req.body.data
  let json=JSON.parse(data)
  let writeData=JSON.stringify(json,null,4)
  let result="ok"
  fs.writeFile(file,writeData,function(err){
   if(err){ 
     res.json(err)
   }else{
     res.json("ok")
   }
  })
});

function writeFile(file,data){
  return new Promise((res,rej)=>{
    fs.open(file,'w',(err,fd)=>{
     if(err) res(err)

    })
    
  })  
}


module.exports = router;
