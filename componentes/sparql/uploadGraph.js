const Blob = require('fetch-blob'); //v2
const DigestFetch = require('digest-fetch'); //v2
const sparql=require('./../../.config').sparql

//Uploading graph to virtuoso details
//https://vos.openlinksw.com/owiki/wiki/VOS/VirtGraphProtocolCURLExamples#HTTP%20GET%20Example

function uploadGraph(graph,uri) {
    const blob = new Blob([graph], {type: 'application/n-triples'})
    let {user,pass}=sparql
    const client = new DigestFetch(user,pass);
    return client.fetch(`http://localhost:8890/sparql-graph-crud-auth?graph-uri=${uri}`, {
        method: 'POST',
        body: blob
    })
}

module.exports=function(req){
    let {graph,uri} = req
    if(graph && uri)  return uploadGraph(graph,uri)
    else return new promise((res,rej)=>{
        rej(Error("Missing-Parameters").message="Missing the parameters <graph> and <uri>")
    })
}
