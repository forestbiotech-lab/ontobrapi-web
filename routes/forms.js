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

// forms/

router.post('/datafile/upload',(req,res)=>{
  uploadFile.uploadFileGetPreview(req,uploadDir,destination).then(data=>{
    //Action is now for jsheet
    data.jsheet=convertXlsx2json(data.file)
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

router.post('/parse/file/xlsx',async (req,res)=>{
  try{
    //TODO refactor this whole logic elsewhere. 
    // encasulate "req" to send. 
    let payload=await new Promise((resolve,rej)=>{
        const formidable=require("formidable")
        // create an incoming form object
        var form = new formidable.IncomingForm();
        form.multiples = false;
        // log any errors that occur
        form.on('error', function(err) {
          console.log('An error has occured: \n' + err);
          rej(err);
        });
        // once all the files have been uploaded, send a response to the client
        form.on('end', function() {
          //Not necessary for single file
        });
        // parse the incoming request containing the form data
        form.parse(req,(err,field,files)=>{
          if(err) rej(err)
          if(field){
            resolve(JSON.parse(field.payload))
          }else{
            rej(new Error("Something failed while retreiving data from client!"))
          }
          
        });
    })
    let selection=payload.selection
    let jSheet=payload.jSheet
    nt.str(jSheet,selection).then(data=>{
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



module.exports = router;
