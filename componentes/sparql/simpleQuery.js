var sparql = require('sparql')
const PORT = 8890

client = new sparql.Client(`http://localhost:${PORT}/sparql/`)

var query=`SPARQL
DEFINE get:soft "replace" 
SELECT DISTINCT * 
FROM <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
WHERE { ?s ?p ?o}`


client.query(query, (err,res) =>{
	console.log(res)
})
