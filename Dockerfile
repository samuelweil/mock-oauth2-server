FROM node:12.13 as build

WORKDIR /build

COPY package-lock.json .
COPY package.json .

RUN npm install

COPY src/ .
COPY tsconfig.json .

RUN npm run build

FROM node:12.13

WORKDIR /app

COPY package-lock.json . 
COPY package.json .
RUN npm install --production

COPY --from=build /build/dist .

ENV NODE_ENV Prod

CMD node server.js
