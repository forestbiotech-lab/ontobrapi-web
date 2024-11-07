const SparqlClient = require('sparql-http-client')

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port
let protocol=sparql.protocol

const endpointUrl = `${protocol}://${host}:${port}/sparql`

let subject = 's'
let object = 'o'
let predicate = 'p'

function sparqlQuery() {

    let query =`
PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

  SELECT DISTINCT ?s 
  FROM ppeo:
  WHERE
    {
     ?s rdf:type owl:Class .
     BIND(STRBEFORE(str(?s), "#") as ?prefix)
     FILTER (?prefix = "http://purl.org/ppeo/PPEO.owl")
    }`


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
                result.forEach((entry,index,array)=>{
                    try{
                        array[index]=entry.s.split("#")[1]
                    }catch (err){
                        array[index]=""
                    }

                })
                res(result)
            })
        }).catch(err=>{
            rej(err)
        })
    })
}




module.exports = sparqlQuery;





