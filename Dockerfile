FROM node:20
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
RUN apt-get update -y
RUN apt-get install -y bash git python3 make g++
RUN npm install -g node-prune nodemon typescript ts-node && npm install