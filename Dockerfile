FROM node:16 
# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production


COPY . .

#RUN git rev-parse HEAD > .GIT_COMMIT
EXPOSE 3000

CMD [ "sh", "-c", "GIT_COMMIT=$(cat .GIT_COMMIT) npm start" ]

LABEL version="1.0"

