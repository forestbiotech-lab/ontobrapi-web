FROM node:13 
# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production


COPY . .

EXPOSE 3000

CMD [ "node","bin/www" ]


