# ontoBrAPI-node-docker
Docker file for the webserver running on Node JS

## Build image
``` bash
	docker build -t brunocosta/ontobrapi-node .
	#docker build -t <your username>/ontobrapi-node .
```

## Run image

``` bash
	# See images
	docker images
	
	# Get container ID
	docker ps

	# Print app output
	 docker logs <container id>
	
	# Enter the container
	docker exec -it <container id> /bin/bash

	docker run -p 49160:3000 -d brunocosta/ontobrapi-node
	docker run -p 49160:3000 -d <your username>/ontobrapi-node
``` 

## Connecting to the SPARQL endpoint mas be done through the service name

In this case db should be used instead of localhost to refere to network on another container




**Notes**

``` sql

PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> 

INSERT INTO GRAPH miappe:{
   miappe:N353 a miappe:study . 
   miappe:hasIdentifier rdf:subClassOf miappe:N353 .
   miappe:hasIdentifier xsd:string  "353" .
   miappe:obs_unit_1 a miappe:observation_unit .   
   miappe:obs_unit_1 miappe:partOf miappe:N353 .
   miappe:hasIdentifier rdf:subClassOf miappe:obs_unit_1 .
   miappe:hasInternalIdentifier rdf:subClassOf miappe:hasIdentifier .
   miappe:hasInternalIdentifier xsd:string "1" .
}


miappe:hasIdentifier rdf:subClassOf miappe:N353 
Isto já definido implicitamente? Preciso de definir esta relação?

miappe:N353 a miappe:study . 
Estou a instanciar uma classe study? Que nomenclatura devo usar para definir este elemento.

Estou a ver estes triplos como graphs. 
?c   ?r ?i
?s (Um elemento (vertice)) ?p (que estabelece uma relação (edge)) ?o (com outro elemento (vertice))

```


Vertices podem ser: 
Classes
Individuals

Edges podem ser:
Data properties
Data types
Object properties
