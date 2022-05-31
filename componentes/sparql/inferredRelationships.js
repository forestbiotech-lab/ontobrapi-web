const SparqlClient = require('sparql-http-client')

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port

const endpointUrl = `http://${host}:${port}/sparql`

let subject = 's'
let object = 'o'
let predicate = 'p'

//Possible solution
// TODO REMOVE?
Array.prototype.forEachAsync = async function (fn) {
    for (let t of this) { await fn(t) }
}
//TODO REMOVE?
Array.prototype.forEachAsyncParallel = async function (fn) {
    await Promise.all(this.map(fn));
}


function objectProperties(className) {

    let query=`
        PREFIX miappe:  <http://purl.org/ppeo/PPEO.owl#>
        PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX owl:     <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?ObjectProperty ?destination
        FROM <http://purl.org/ppeo/PPEO.owl#> 
        WHERE {
            VALUES ?class { miappe:${className} } .
        {
            ?ObjectProperty            rdf:type            owl:ObjectProperty         .
            ?ObjectProperty    rdfs:domain                 ?class                     .
            ?ObjectProperty    rdfs:range                  ?destination               .
            ?class             rdf:type                    owl:Class                  .
        } UNION {
            ?destination               ?ObjectProperty            ?class                     .
            ?destination               rdfs:subClassOf            ?class                     .
        } UNION {
            ?class             rdfs:subClassOf            ?node                       .
            ?node               rdf:type                   owl:Restriction            .
            ?node               owl:onProperty             ?ObjectProperty            .
            ?node               owl:someValuesFrom         ?destination               .
        }}`
    //TODO Check if this has the right origin ou destination
    return sparqlQuery(query).then(result=>{
        result.map(value=> {
            value.name = value.ObjectProperty.split("#")[1]
            value.label = value.ObjectProperty.split("#")[1]
        })
        return result
    }).catch(err=>{
        return ["Error",err]
    })


}


function dataPropertyRange(dataProperty){
    let query=`
         PREFIX miappe:  <http://purl.org/ppeo/PPEO.owl#>
         PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
         PREFIX owl:     <http://www.w3.org/2002/07/owl#>
         PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
         PREFIX schema:  <http://www.w3.org/2001/XMLSchema#>

         SELECT DISTINCT  ?range
         FROM <http://purl.org/ppeo/PPEO.owl#> 
         WHERE {
            VALUES ?dataProperty { miappe:${dataProperty} } .
            {
               ?dataProperty     rdf:type          owl:DatatypeProperty   . 
               ?dataProperty     rdfs:range        ?range                 .
            } UNION {
               ?node             owl:onProperty    ?dataProperty          .
               ?node             owl:onDataRange   ?range                 .

            } UNION {
               ?node             owl:onProperty     ?dataProperty          .
               ?node             owl:onDataRange    ?node2                 .
               ?node2            owl:unionOf        ?node3                 .
               ?node3            ?rangeType        ?range                  .
            }UNION {
               ?node             owl:onProperty     ?dataProperty          .
               ?node             owl:onDataRange    ?node2                 .
               ?node2            owl:unionOf        ?node3                 .
               ?node3            ?rangeType1        ?range4                .
               ?range4           ?rangeType2        ?range                 .
            }
            FILTER ( !isBlank(?range) && ?range != rdf:nil ) 
         }
    `
    return sparqlQuery(query).then(result=>{
        return result.map(dataProperty=>{
            return {
                term:dataProperty.range,
                name:dataProperty.range.split("#")[1],
                label:dataProperty.range.split("#")[1],
                ontology:dataProperty.range.split("#")[0]
            }
        })
    })
}
function dataProperties(className,dataProperty) {

    let query=`
         PREFIX miappe:  <http://purl.org/ppeo/PPEO.owl#>
         PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
         PREFIX owl:     <http://www.w3.org/2002/07/owl#>
         PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
         PREFIX schema:  <http://www.w3.org/2001/XMLSchema#>

         SELECT DISTINCT ?class ?dataProperty  ?range
         FROM <http://purl.org/ppeo/PPEO.owl#> 
         WHERE {
            VALUES ?class { miappe:${className} } .
            {
               ?dataProperty     rdf:type          owl:DatatypeProperty   . 
               ?dataProperty     rdfs:domain       ?class                 .
               ?dataProperty     rdfs:range        ?range                 .
            } UNION {
               ?class            rdfs:subClassOf   ?node                  .
               ?node             owl:onProperty    ?dataProperty          .
               ?node             owl:onDataRange   ?range                 .

            } UNION {
               ?class            rdfs:subClassOf    ?node                  .
               ?node             owl:onProperty     ?dataProperty          .
               ?node             owl:onDataRange    ?node2                 .
               ?node2            owl:unionOf        ?node3                 .
               ?node3            ?rangeType        ?range                  .
            }UNION {
               ?class            rdfs:subClassOf    ?node                  .
               ?node             owl:onProperty     ?dataProperty          .
               ?node             owl:onDataRange    ?node2                 .
               ?node2            owl:unionOf        ?node3                 .
               ?node3            ?rangeType1        ?range4                .
               ?range4           ?rangeType2        ?range                 .
            }
            FILTER ( !isBlank(?range) && ?range != rdf:nil ) 
         }`
    //TODO Check if this has the right origin ou destination

    return sparqlQuery(query)

}

function sparqlQuery(query){
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
            let message=err.msg
            let stack=err.stack
            rej({err,message,stack})
        })
    })
}



module.exports = {
    objectProperties,
    dataProperties,
    dataPropertyRange
};
