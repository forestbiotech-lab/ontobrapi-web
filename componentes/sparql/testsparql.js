const SparqlClient = require('sparql-http-client')
const fs = require("fs");

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port
const DEFAULT_LIMIT=1000
const endpointUrl = `http://${host}:${port}/sparql`
//should-sponge=soft
let subject = 's'
let object = 'o'
let predicate = 'p'
const brapi="http://brapi.biodata.pt/"
const ontoBrAPI="http://localhost:8890/vitis"
let devServer="http://localhost:3000/"

let pageSize

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


function processQuery(query){
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


function sparqlQuery(sparqlQueryParams,triples,options,count) {
  let offset;
  if (options.limit===undefined){ options.limit=DEFAULT_LIMIT; options.page=0; }
  if(options.page>0){offset="OFFSET "+options.page}else{offset=""}

  var {subject,predicate,object}=triples[0]
  let {query1,query2,query3}=sparqlQueryParams
  let select;
  if(count){
    select=`SELECT DISTINCT ( COUNT  ( ${query1} ${query2} ${query3})as ?count)`
  }else{
    select=`SELECT DISTINCT ${query1} ${query2} ${query3}`
  }
  //TODO do I need this prefix for anything?
  let query =`PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 
  ${select}
  FROM <${ontoBrAPI}>
  WHERE
    {\n`
    triples.forEach(triple=>{
      query+=`    ${triple.subject} ${triple.predicate} ${triple.object} .\n`
    })
      
    query+=`}\nLIMIT ${options.limit} ${offset}`


  return processQuery(query)
}


function getResults(querySelectors,triples,options){
  return sparqlQuery(querySelectors,triples,options)
}

//Define request options for SparQL Query
//Setup metadata response
async function getAnchors(server,moduleName,callName,requestParam,requestTrip){
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
  let sparqlQuerySelectors={query1,query2,query3}

  let options={}
  let totalPages,queryCount
  let count;
  if (requestParam) {
    if (requestParam.pageSize) {
      options.page = requestParam.page
      options.limit = requestParam.pageSize
      queryCount = await sparqlQuery(sparqlQuerySelectors, [{subject, predicate, object}], {},count = true)
    }
  }
  let anchorIndividuals=await getResults(sparqlQuerySelectors,[{subject,predicate,object}],options)
  let results=[]

  if(options.limit<1000)
    totalPages=Math.ceil(queryCount[0].count/options.limit)
  //TODO only true if count is less then default
  else totalPages=1

  callStructure.metadata.pagination.currentPage=parseInt(options.page) || 0
  callStructure.metadata.pagination.pageSize=parseInt(options.limit)
  pageSize=options.limit //Used bellow as safeguard
  callStructure.metadata.pagination.totalPages=totalPages
  callStructure.metadata.pagination.totalCount= options.limit<DEFAULT_LIMIT ? parseInt(queryCount[0].count) : DEFAULT_LIMIT

  

  anchorIndividuals.forEach(async (individual,index)=>{
    let  triples=[{subject,predicate,object}]
    triples[0].subject=`<${individual[anchor]}>`
    if (index<pageSize){
      results.push(parseCallStructure(callStructure.result.data[0],sparqlQuerySelectors,triples))
    }
  })
  delete callStructure["_anchor"]
  return {callStructure,results}
}

//Get values for each individual bases con the CallStructure
async function parseCallStructure(callStructure,sparqlQuerySelectors,triples,array){
  //from result or data
  let resultStructure=JSON.parse(JSON.stringify(callStructure))
  for await ([key,value] of Object.entries(callStructure)){
    if(isOntologicalTerm(value) === true){
      let loopQueryParams=Object.assign({},sparqlQuerySelectors)
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
          object=`?${double.class.replace(`${prefixes['ppeo']}`,"").replace(`ppeo`,"")}`
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
        queryResult=await sparqlQuery(loopQueryParams,queryTriples,{})
      }catch(err){
        queryResult=null
      }
      try{
        if(array){
          if(resultStructure._result_array_){
            for([index,entry] of Object.entries(resultStructure._result_array_)){
              entry[loopKey]=queryResult[index][loopQueryParams.query1.replace("?","")].replace(brapi,devServer)
            }
          }else{
            resultStructure._result_array_=queryResult.map(item=>{
              return {[loopKey]:item[loopQueryParams.query1.replace("?","")].replace(brapi,devServer)}
            })
          }

        }else
          resultStructure[loopKey]=queryResult[0][loopQueryParams.query1.replace("?","")].replace(brapi,devServer)
      }catch(err){
        resultStructure[loopKey]=null
      }
    }else{
      if(value instanceof Object){
        //TODO
        if(value instanceof Array){
          let array;
          resultStructure[key]=await parseCallStructure(callStructure[key][0],sparqlQuerySelectors,triples,array=true)
        }else
          resultStructure[key]=await parseCallStructure(callStructure[key],sparqlQuerySelectors,triples)
      }else if(typeof value  === "string"){
        resultStructure[key]=""
      }
    }
  }
  if(array)if(resultStructure._result_array_) resultStructure=resultStructure._result_array_
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
  let path="componentes/modules"
  
  let callStructurePath=`${path}/${moduleName}/schemes/${callName}`
  let callStructure
  try{
    callStructure=JSON.parse(fs.readFileSync(callStructurePath))
    //callStructure=require(callStructurePath)
  }catch(err){
    let callStructure={}
  }
  return callStructure
}

//    <http://brapi.biodata.pt/raiz/obs_000122> ppeo:hasObservedSubject ?obs_unit .

module.exports = getAnchors;





