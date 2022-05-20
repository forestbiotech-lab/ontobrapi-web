// This is a test for this module
// Not actively in use


var sparqlServer = require('sparql')
const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`



client = new sparqlServer.Client(endpointUrl)

var query=`SPARQL
DEFINE get:soft "replace" 
SELECT DISTINCT * 
FROM <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
WHERE { ?s ?p ?o}`


client.query(query, (err,res) =>{
	console.log(res)
})
