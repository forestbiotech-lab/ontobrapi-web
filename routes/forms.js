const express = require('express');
const router = express.Router();
const path=require('path')
const freeQuery = require('.././componentes/sparql/freeQuery')
const restructuring = require('./../componentes/helpers/restructuring') 
const uploadFile=require('./../componentes/helpers/uploadfile')
const uploadDir=path.join(__dirname,"../uploads/")
const destination="uploadedfiles"
const nt=require('./../componentes/generators/nt')
const convertXlsx2json=require('.././componentes/xlsx/convert-xlsx2json')
const fs=require("fs")
const validator=require('.././componentes/validator/run_miappe_validator')
const formData= require('./../componentes/helpers/formData').singleFile
const submitGraph=require('.././componentes/sparql/submitGraph')
// forms/

router.post('/datafile/upload',(req,res)=>{
  uploadFile.uploadFileGetPreview(req,uploadDir,destination).then(async data=>{
    //Action is now for jsheet
    let validation=await validator.miappe(data.file)
    data.jsheet=convertXlsx2json(data.file)
    data.validation=validation.toString()
    res.json(data)
  }).catch(err=>{
    let message=err.message
    res.writeHead( 400, message, {'content-type' : 'text/plain'});
    res.end(message)
  })
})


//USED by public/javascript/loaders.js
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

//TODO - NOT used Marked for removal
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

router.post('/parse/file/xlsx',async (req,res)=>{
  try{
    let form_data=await formData(req)
    let payload=JSON.parse(form_data.payload)
    let selection=payload.selection
    let jSheet=payload.jSheet
    nt.json(jSheet,selection).then(data=>{
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

router.post('/convert/json/triples/string',async (req,res)=>{
  try{
    let form_data=await formData(req)
    let payload=JSON.parse(form_data.payload)
    nt.json2str(payload).then(data=>{
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

router.get('/parse/file/json',(req,res)=>{
  try{
    let files=[]
    let filepath=path.join(uploadDir,destination,"/dados - N353-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - N356-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - N369-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - caracteriza-ensaios.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - Materiais-pedigree-representati.tsv")
    files.push(filepath)    
    filepath=path.join(uploadDir,destination,"/dados - PIL-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - NIR-short.tsv")
    files.push(filepath)
    nt.json(files).then(data=>{
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
    let files=[]
    let filepath=path.join(uploadDir,destination,"/dados - N353-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - N356-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - N369-short.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - caracteriza-ensaios.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - Materiais-pedigree-representati.tsv")
    files.push(filepath)    
    filepath=path.join(uploadDir,destination,"/dados - PIL.tsv")
    files.push(filepath)
    filepath=path.join(uploadDir,destination,"/dados - NIR.tsv")
    files.push(filepath)
    nt.str(files).then(data=>{
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

router.post("/upload/graph",async (req,res)=>{
  let form_data=await formData(req)
  let payload=JSON.parse(form_data.payload)
  submitGraph.staging(payload).then(result=>
      res.json({result,statusText:result.statusText,status:result.status})
  ).catch(err=>{
    res.json({info:"Error occurred! - ",err,err})
  })
})


router.post("/get/mapping",(req,res)=>{
  try {
    let file = `reference_files/${req.body.file}`
    let mapping = JSON.parse(fs.readFileSync(file))
    res.json(JSON.stringify(mapping,null,2))
  }catch (e) {
    res.json(e)
  }
})

/*
router.post("/submit/staging",async (req,res)=>{
    let payload = await newForm(req){

  }
})
*/
module.exports = router;
