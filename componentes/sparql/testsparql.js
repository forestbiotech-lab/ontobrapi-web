const SparqlClient = require('sparql-http-client')

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`
//should-sponge=soft
let subject = 's'
let object = 'o'
let predicate = 'p'
const brapi="http://brapi.biodata.pt/"
let devServer="http://localhost:3000/"

const pageSize=10

const prefixes={
  "ppeo":"http://purl.org/ppeo/PPEO.owl#"
}


//Possible solution
Array.prototype.forEachAsync = async function (fn) {
    for (let t of this) { await fn(t) }
}

Array.prototype.forEachAsyncParallel = async function (fn) {
    await Promise.all(this.map(fn));
}

 
function sparqlQuery(queryParms,triples) {
  var {subject,predicate,object}=triples[0]
  let {query1,query2,query3}=queryParms
  //TODO do I need this prefix for anything?
  let query =`PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>


  SELECT DISTINCT ${query1} ${query2} ${query3}
  FROM <http://localhost:8890/vitis>
  WHERE
    {\n`
    triples.forEach(triple=>{
      query+=`    ${triple.subject} ${triple.predicate} ${triple.object} .\n`
    })
      
    query+=`}`


  return new Promise((res,rej)=>{
    const client = new SparqlClient({ endpointUrl })
    client.query.select(query).then(stream=>{
      let result=[]
      stream.on('data', row => {
        let resultTriple={}
        Object.entries(row).forEach(([key, value]) => {
          resultTriple[key]=value.value
        })
        result.push(resultTriple)
      }) 
      stream.on('error', err => {
        rej(err)
      })
      stream.on('end', err=>{
        res(result)
      })
    }).catch(err=>{
      rej(err)
    })
  })  
}


function getResults(queryParms,triples){
  return sparqlQuery(queryParms,triples)
}

async function getAnchors(server,moduleName,callName,requestTrip){
  devServer=server
  //Define class and property
  let callStructure=Object.assign({},getCallStructure(moduleName,callName))
  let subject,predicate,object,anchor
  if(callStructure['_anchor']){
    anchor=callStructure['_anchor'].class
    subject=callStructure['_anchor'].s
    predicate=callStructure['_anchor'].p  
    object=callStructure['_anchor'].o
  }else{
    return {callStructure,results:[]}
  }
  let query1,query2,query3
  query1=query2=query3=""
  query1=subject
  let queryParams={query1,query2,query3}


  let anchorIndividuals=await getResults(queryParams,[{subject,predicate,object}])
  let results=[]
  
  

  anchorIndividuals.forEach(async (individual,index)=>{
    let  triples=[{subject,predicate,object}]
    triples[0].subject=`<${individual[anchor]}>`
    if (index<pageSize){
      results.push(parseCallStructure(callStructure.result.data[0],queryParams,triples))
    }
  })
  delete callStructure["_anchor"]
  return {callStructure,results}
}

async function parseCallStructure(callStructure,queryParams,triples){
  //from result or data
  let resultStructure=JSON.parse(JSON.stringify(callStructure))
  for await ([key,value] of Object.entries(callStructure)){
    if(isOntologicalTerm(value) === true){
      let loopQueryParams=Object.assign({},queryParams)
      let loopKey=key
      let loopValue=value["_sparQL"]
      
      let queryTriples=[]
      loopValue.forEach((double,idx)=>{
        let object
        let temp=`?${double.class.replace(`${prefixes['ppeo']}`,"")}`
        if(temp==loopQueryParams.query1){
          loopQueryParams.query1=`?${double.property.replace(`${prefixes['ppeo']}`,"")}`
          object=loopQueryParams.query1  
        }else{
          loopQueryParams.query1=temp
          object=`?${double.class.replace(`${prefixes['ppeo']}`,"")}`
        }
        let subject=idx>0 ? queryTriples[(queryTriples.length-1)].object : triples[0].subject
        queryTriples.push({
          subject ,
          predicate:"ppeo:"+double.property,
          object
        })        
      })
      let queryResult
      try{
        queryResult=await sparqlQuery(loopQueryParams,queryTriples)  
      }catch(err){
        queryResult=null
      }
      try{
        resultStructure[loopKey]=queryResult[0][loopQueryParams.query1.replace("?","")].replace(brapi,devServer)     
      }catch(err){
        resultStructure[loopKey]=null
      }
    }else{

    }
  }
  return resultStructure
}

function isOntologicalTerm(value){
  //Process data for others
  let result=true
  let possibleAttributes=["class","property"]
  
  if ( typeof value === "object" ){
    if(Object.prototype.toString.call(value) === "[object Object]"){
      if(typeof value["_sparQL"] === "object"){
        value["_sparQL"].forEach(double=>{
          Object.keys(double).forEach(val=>{
            result=result && possibleAttributes.includes(val)
          })          
        }) 
      }else{result=false} 
    }else{result=false} 
  }else{result=false}
  return result
}
function getCallStructure(moduleName,callName){
  //Get from componetes/modules/genotyping/schemes/${name}
  let path="./../modules"
  
  let callStructurePath=`${path}/${moduleName}/schemes/${callName}`
  let callStructure
  try{
    callStructure=require(callStructurePath)
  }catch(err){
    let callStructure={}
  }
  return callStructure
}

//    <http://brapi.biodata.pt/raiz/obs_000122> ppeo:hasObservedSubject ?obs_unit .

module.exports = getAnchors;





