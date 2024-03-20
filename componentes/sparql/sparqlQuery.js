
const SparqlClient = require('sparql-http-client')
const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`
let subject = 's'
let object = 'o'
let predicate = 'p'
const query = ` 
SELECT DISTINCT * 
FROM <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
WHERE { ?${subject} ?${predicate} ?${object}}`
 
function main () {
  return new Promise((res,rej)=>{
	const client = new SparqlClient({ endpointUrl })
	client.query.select(query).then(stream=>{
		result=""	 
		stream.on('data', row => {
		  Object.entries(row).forEach(([key, value]) => {
		    result+=`${key}: ${value.value} (${value.termType})\n`
		  })
		}) 
		stream.on('error', err => {
		  rej(err)
		})
		stream.on('end', err=>{
		  res(result)
		})
	})
  })	
}

module.exports = main;