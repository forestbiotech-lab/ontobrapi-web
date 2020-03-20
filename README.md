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


