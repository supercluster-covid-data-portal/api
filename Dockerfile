#######################################################
# Builder
#######################################################

FROM node:17-alpine as builder

ENV APP_UID=1000
ENV APP_GID=1000
ENV APP_HOME=/usr
ENV APP_USER=node

RUN apk --no-cache add shadow \
  && groupmod -g $APP_GID node \
  && usermod -u $APP_UID -g $APP_GID $APP_USER \
  && mkdir -p $APP_HOME \
  && chown -R $APP_USER $APP_HOME

WORKDIR $APP_HOME

COPY . .

RUN npm ci

USER $APP_USER
RUN npm run build

#######################################################
# App container
#######################################################

FROM node:slim as runtime
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ENV NODE_ENV=production
ENV APP_UID=1000
ENV APP_GID=1000
ENV APP_HOME=/app
ENV APP_USER=node
ENV ES_HOST=http://localhost:9200
ENV PORT=4000

WORKDIR $APP_HOME

USER $APP_USER

COPY --from=builder \
  /usr/package.json \
  $APP_HOME

COPY --from=builder \
  /usr/configs \
  $APP_HOME/configs

COPY --from=builder \
  /usr/dist \
  $APP_HOME/dist

COPY --from=builder \
    /usr/node_modules/ \
    $APP_HOME/node_modules/

# VOLUME [ "/usr/src/public/static/dms_user_assets" ]
EXPOSE 4000

CMD npm start