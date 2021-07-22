const SparqlClient = require('sparql-http-client')
const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`

let subject = 's'
let object = 'o'
let predicate = 'p'

const pageSize=10
const brapi="http://brapi.biodata.pt/"
const devServer="http://localhost:3000/"

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
  PREFIX raiz: <http:brapi.biodata.pt/raiz/>

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
          resultTriple[key]=value.value.replace(brapi,devServer)
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


async function getLinkedData(ontoTerm){
  let subject,predicate,object,query1,query2,query3
  query1=query2=query3=subject=predicate=object=""
  query1="?q1"
  query2="?q2"
  let order=[query1,query2,`<http://brapi.biodata.pt/raiz/${ontoTerm}>`]
  let result={termAsSubject:{},termAsPredicate:{},termAsObject:{}}
  let queryParms={query1,query2,query3}
  let resultIter=Object.assign({},result)
  for ( [entry,i] of Object.entries(resultIter)){
    let temp=order.pop()
    order.unshift(temp)
    let triple = [{subject:order[0],predicate:order[1],object:order[2]}]      
    try{
      result[entry]=await sparqlQuery(queryParms,triple)  
    }catch(err){
      result[entry]=""
    }
  }
  return result
}


module.exports = getLinkedData;





