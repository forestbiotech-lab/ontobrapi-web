#!/usr/bin/env bash

ssh brapi 'cd ~/.git/ontoBrAPI/ontoBrAPI-node-docker/; git pull origin-https master |
cd .. |
docker-compose up -d --build'

