const SparqlClient = require('sparql-http-client')

server="localhost" //db 
const endpointUrl = `http://${server}:8890/sparql`
let subject = 's'
let object = 'o'
let predicate = 'p'
const brapi="http://brapi.biodata.pt/"
const devServer="http://localhost:3000/"

const pageSize=10


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

  let query =`PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>


  SELECT DISTINCT ${query1} ${query2} ${query3}
  FROM <https://bit.ly/3yJFXvw>
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


function getObservations(queryParms,triples){
  return sparqlQuery(queryParms,triples)
}

async function getAnchors(requestTrip){
  //Define class and property
  let callStructure=Object.assign({},getCallStructure("Observation"))
  let subject,predicate,object
  if(callStructure['_anchor']){
    subject=callStructure['_anchor'].s
    predicate=callStructure['_anchor'].p  
    object=callStructure['_anchor'].o
  }else{
    return {callStructure,results:[]}
  }
  let query1,query2,query3
  query1=query2=query3=""
  query1=subject
  let queryParms={query1,query2,query3}


  let observations=await getObservations(queryParms,[{subject,predicate,object}])
  let results=[]
  
  

  observations.forEach(async (observation,index)=>{
    let  triples=[{subject,predicate,object}]
    triples[0].subject=`<${observation.observation}>`
    if (index<pageSize){
      results.push(parseCallStructure(callStructure.result.data[0],queryParms,triples))      
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
        let temp=`?${double.class.replace("ppeo:","")}`
        if(temp==loopQueryParams.query1){
          loopQueryParams.query1=`?${double.property.replace("ppeo:","")}`
          object=loopQueryParams.query1  
        }else{
          loopQueryParams.query1=temp
          object=`?${double.class.replace("ppeo:","")}`  
        }
        let subject=idx>0 ? queryTriples[(queryTriples.length-1)].object : triples[0].subject
        queryTriples.push({
          subject ,
          predicate:double.property,
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
function getCallStructure(name){
  //Get from componetes/modules/genotyping/schemes/${name}
  name="observations.json"
  let path="./../modules"
  let module="genotyping"
  let callStructurePath=`${path}/${module}/schemes/${name}`
  let callStructure=require(callStructurePath)
  
  return callStructure
}

//    <http://brapi.biodata.pt/raiz/obs_000122> ppeo:hasObservedSubject ?obs_unit .

module.exports = getAnchors;





