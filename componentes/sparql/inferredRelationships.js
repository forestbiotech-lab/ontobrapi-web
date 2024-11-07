const SparqlClient = require('sparql-http-client')

const sparql=require('./../../.config').sparql

let host=sparql.host
let port=sparql.port
let protocol=sparql.protocol

const endpointUrl = `${protocol}://${host}:${port}/sparql`

let subject = 's'
let object = 'o'
let predicate = 'p'



function objectProperties(className, baseOntologyURI) {

    let query=`
        PREFIX baseOntology:  <${baseOntologyURI}>
        PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX owl:     <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?ObjectProperty ?destination
        FROM <${baseOntologyURI}> 
        WHERE {
            VALUES ?class { baseOntology:${className} } .
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
        }UNION {
            ?class            rdfs:subClassOf              ?node                      .
            ?node             owl:onProperty               ?ObjectProperty            . 
            ?node             owl:onClass                  ?destination               .
            ?objectProperty   rdf:type                     owl:ObjectProperty         .  
        }}`
    //TODO Check if this has the right origin ou destination
    return sparqlQuery(query).then(result=>{
        result.map(value=> {
            value.name = value.ObjectProperty.split("#")[1]
            value.label = value.ObjectProperty.split("#")[1]
            value.term=value.ObjectProperty
            value.class=value.destination
            value.className=value.class.split("#")[1] || ""
            value.classOntology=value.class.split("#")[0]
        })
        return result
    }).catch(err=>{
        return ["Error",err]
    })


}


function dataPropertyRange(dataProperty,baseOntologyURI){
    let query=`
         PREFIX baseOntology:  <${baseOntologyURI}>
         PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
         PREFIX owl:     <http://www.w3.org/2002/07/owl#>
         PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
         PREFIX schema:  <http://www.w3.org/2001/XMLSchema#>

         SELECT DISTINCT  ?range
         FROM <${baseOntologyURI}> 
         WHERE {
            VALUES ?dataProperty { baseOntology:${dataProperty} } .
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
function dataProperties(className,baseOntologyURI) {

    let query=`
         PREFIX baseOntology:  <${baseOntologyURI}>
         PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
         PREFIX owl:     <http://www.w3.org/2002/07/owl#>
         PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
         PREFIX schema:  <http://www.w3.org/2001/XMLSchema#>

         SELECT DISTINCT ?class ?dataProperty  ?range
         FROM <${baseOntologyURI}> 
         WHERE {
            VALUES ?class { baseOntology:${className} } .
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

    return sparqlQuery(query).then(result=>{
        return result.map(dataProperty=>{
            return {
                term:dataProperty.dataProperty,
                name:dataProperty.dataProperty.split("#")[1],
                label:dataProperty.dataProperty.split("#")[1],
                ontology:dataProperty.dataProperty.split("#")[0],
                range:dataProperty.range,
                rangeName:dataProperty.range.split("#")[1],
                rangeOntology:dataProperty.range.split("#")[0],
                class:dataProperty.class,
                className:dataProperty.class.split("#")[1] || "",
                classOntology:dataProperty.class.split("#")[0]
            }
        })
    })

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

