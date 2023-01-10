var express = require('express');
var router = express.Router();
var jsonld = require('.././componentes/sparql/jsonld')

// raiz ontological terms


router.get('/', (req,res)=>{
  res.json("RAIZ")
})

router.get('/:ontoTerm',async function(req,res,next){
  let ontoTerm = encodeURI(req.params.ontoTerm)
  let queryResults=await jsonld(ontoTerm)
  let result={}
  try{
    for ([key,value] of Object.entries(queryResults)){
      result[key]=await Promise.all(value)
    }
    res.json(result)
  }catch(err){
    res.json(err)
  }

  /*Promise.all(queryResults.results).then(result=>{
    queryResults.callStructure.result.data=result
    res.json(queryResults.callStructure)
  }).catch(err=>{
    res.json(err)
  })*/
})

module.exports = router;