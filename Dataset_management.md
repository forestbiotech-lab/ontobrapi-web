# SparQL Datasets
The datasets are instances of the [PPEO](http://purl.org/ppeo/PPEO.owl), there namespace os [domain]/[projectname][autoincremental value]. 
As an example the name space should look something like this for the first dataset <https://brapi.biodata.pt/ontobrapi/000001>, an alteranative to the autoincremental value is to generate a UID for each dataset through dataverse or something else. 


## Initialize collection
This starts a collection, in which every dataset will be added to this graph 
`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

INSERT INTO GRAPH ontobrapi: {
    ontobrapi: rdf:type owl:Ontology . 
    ontobrapi: owl:imports miappe: .
}    
`

## Lookup datasets
`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX void: <http://rdfs.org/ns/void#>

SELECT DISTINCT ?datasets
FROM ontobrapi:
WHERE{
    ?datasets void:inDataset ontobrapi: .
}
`

## Lookup datasets with Investigation ID
`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX void: <http://rdfs.org/ns/void#>

SELECT DISTINCT ?datasets ?dsInvestigation  ?id
FROM ontobrapi: 
WHERE{
    ?datasets void:inDataset ontobrapi: .
    ?dsInvestigation rdf:type miappe:investigation .
    ?dsInvestigation miappe:hasIdentifier ?id .
}
`


### By name

### By ID
Specific example for the inserted triple. 

`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX void: <http://rdfs.org/ns/void#>

SELECT DISTINCT ?datasets ?dsInvestigation
FROM ontobrapi:
WHERE{
    ?datasets void:inDataset ontobrapi: .
    ?dsInvestigation rdf:type miappe:investigation .
    ?dsInvestigation miappe:hasIdentifier "0001"^^xsd:string .
}
`


## Add Dataset
`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX dataset01: <http://brapi.biodata.pt/ontobrapi/000001#>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX void: <http://rdfs.org/ns/void#>

INSERT INTO GRAPH ontobrapi: {
    dataset01: <void:inDataset> ontobrapi: .
    dataset01:Investigation_01 rdf:type miappe:investigation .
    dataset01:Investigation_01 miappe:hasIdentifier "0001"^^xsd:string .
}
`

## Remove specific dataset

### By name

### By ID


## Submit to staging

### Initialize collection
`SparQL
PREFIX staging: <http://brapi.biodata.pt/staging/ontobrapi>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

INSERT INTO GRAPH staging: {
    staging: rdf:type owl:Ontology .
    staging: owl:imports miappe: .
}
`

### Add dataset to staging
`SparQL
PREFIX ontobrapi: <http://brapi.biodata.pt/ontobrapi/>
PREFIX dataset01: <http://brapi.biodata.pt/ontobrapi/000001#>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX staging: <http://brapi.biodata.pt/staging/ontobrapi>

INSERT INTO GRAPH staging: {
    dataset01: <void:inDataset> staging: .
    dataset01:Investigation_01 rdf:type miappe:investigation .
    dataset01:Investigation_01 miappe:hasIdentifier "0001"^^xsd:string .
    dataset01:Investigation_01 miappe:hasName "Investigation 0001"^^xsd:string .
}
`

### List datasets in staging
`SparQL
PREFIX staging: <http://brapi.biodata.pt/staging/ontobrapi>
PREFIX void: <http://rdfs.org/ns/void#>

SELECT DISTINCT ?datasets
FROM staging:
WHERE{
    ?datasets void:inDataset staging: .
}
`

## Dataverse test instance 
A dataverse test instance to test dataset creation is done using [dataverse-docker](https://github.com/IQSS/dataverse-docker).