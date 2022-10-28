#!/usr/bin/env bash

ssh-agent zsh
ssh-add ~/.ssh/ontobrapi
docker-compose stop
git stash
git pull origin master
git stash apply
cd ..
docker-compose up -d --build

