FROM node:10.15.0

WORKDIR /app

ADD package.json /app/package.json
RUN npm install

ADD . /app
