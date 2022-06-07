const SparqlClient = require('sparql-http-client')

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`

let subject = 's'
let object = 'o'
let predicate = 'p'

//Possible solution
Array.prototype.forEachAsync = async function (fn) {
    for (let t of this) { await fn(t) }
}

Array.prototype.forEachAsyncParallel = async function (fn) {
    await Promise.all(this.map(fn));
}

 
function sparqlQuery(className) {

  let query =`
  PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  
  SELECT DISTINCT ?property ?class
  FROM <https://bit.ly/3yJFXvw>
  WHERE
    {
     ?individual1  rdf:type   ppeo:${className} .
     ?individual1  ?property  ?individual2      .
     optional{?individual2  rdf:type   ?class } .
     optional{?individual1  rdf:type   ?class } .
     filter not exists {?individual1 rdf:type ?individual2 }
    }`
  //Remove properties that are rdf:type

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




module.exports = sparqlQuery;





