FROM node:current-alpine as deps
WORKDIR /usr/src/app
COPY package*.json ./.build/node-prune.sh  ./
RUN npm ci --only=production && \
    chmod +x node-prune.sh && \
    ./node-prune.sh

FROM node:current-alpine
WORKDIR /usr/src/app
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=0.0.0-development
ARG VCS_REF=not-set
ENV EVOHOME2MQTT_RUNNING_IN_CONTAINER=true
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY ./package.json ./
COPY ./src ./lib
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.description="Connecting your evohome system to mqtt" \
      org.label-schema.name=evohome2mqtt \
      org.label-schema.schema-version=1.0 \
      org.label-schema.url=https://github.com/svrooij/evohome2mqtt/ \
      org.label-schema.version=$BUILD_VERSION \
      org.label-schema.vcs-ref=$VCS_REF
CMD ["node", "./lib/bridge.js"]