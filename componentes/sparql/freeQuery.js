const SparqlClient = require('sparql-http-client')
const endpointUrl = 'http://localhost:8890/sparql'
 

module.exports = function(query) {
  return new Promise((res,rej)=>{
  const client = new SparqlClient({ endpointUrl })
  client.query.select(query).then(stream=>{
    result=[]  
    stream.on('data', row => {
      let line={}
      Object.entries(row).forEach(([key, value]) => {
        line[key]=value.value
      })
      result.push(line)
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


