FROM node:12

WORKDIR /usr/src/lifescope-api

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 3001
CMD ["node", "--experimental-modules", "server.js"]