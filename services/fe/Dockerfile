FROM node:18 as build

ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app

# Copy the package manifests AND the npm config together so `legacy-peer-deps=true`
# (defined in .npmrc) is honoured during the layer that runs `npm install`. Without
# .npmrc here the install fails with ERESOLVE on the @types/react peer conflict between
# primereact 10 and the optional react-native peer of @tanstack/react-query 4.x.
COPY package.json package-lock.json .npmrc ./

RUN npm install

COPY . ./

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
