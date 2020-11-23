const express = require('express');
const router = express.Router();
const path=require('path')
const freeQuery = require('.././componentes/sparql/freeQuery')
const restructuring = require('./../componentes/helpers/restructuring') 
const uploadFile=require('./../componentes/helpers/uploadfile')
const uploadDir=path.join(__dirname,"../uploads/")
const destination="uploadedfiles"
const nt=require('./../componentes/generators/nt')

router.post('/datafile/upload',(req,res)=>{
  uploadFile.uploadFileGetPreview(req,uploadDir,destination).then(data=>{
    res.json(data)
  }).catch(err=>{
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  })
})

router.get('/ontologyterms/:ontology/',(req,res)=>{
    query=`
    PREFIX rdf-syntax: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT DISTINCT ?s ?o from <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
    WHERE {
      ?s rdf-syntax:type ?o .
      FILTER (contains(str(?s), "http://purl.org/ppeo/PPEO.owl"))
    }ORDER BY ?o`
  freeQuery(query).then(data=>{
    data=restructuring.organizeSubjectsByObservation(data)
    res.json(data)
  }).catch(err=>{
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  })
})
router.get('/ontologycomments/:ontology/',(req,res)=>{
    query=`
      PREFIX rdf-syntax: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT DISTINCT ?s ?o from <http://purl.org/ppeo/PPEO.owl> 
      WHERE {
        ?s ?p ?o .
        FILTER (?p IN (rdf-syntax:type, rdfs:comment))
        FILTER (contains(str(?s), "http://purl.org/ppeo/PPEO.owl"))
    }`
  freeQuery(query).then(data=>{
    data=restructuring.organizeSubjectsByObservation(data)
    res.json(data)
  }).catch(err=>{
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  })
})
router.get('/parse/file/json',(req,res)=>{
  try{
    let filepath=path.join(uploadDir,destination,"/dados - N353.tsv")
    nt.json(filepath).then(data=>{
      res.json(data)
    }).catch(err=>{
      let message=err.message
      res.writeHead( 400, message, {'content-type' : 'text/plain'});
      res.end(message)
    })
  }catch(err){
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  }
})

router.get('/parse/file/',(req,res)=>{
  try{
    let filepath=path.join(uploadDir,destination,"/dados - N353.tsv")
    nt.str(filepath).then(data=>{
      res.set('Content-Type','text/txt')
      res.send(data)
    }).catch(err=>{
      let message=err.message
      res.writeHead( 400, message, {'content-type' : 'text/plain'});
      res.end(message)
    })
  }catch(err){
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  }
})



module.exports = router;
