FROM avco/aro-app-base:ubuntu1804-node12
WORKDIR /target
COPY app .
RUN npm install --only=prod && npm run build



FROM avco/aro-app-base:latest
WORKDIR /srv/www/aro/current
COPY --from=0 /target ./app
COPY bootstrap ./bootstrap
COPY conf ./conf
COPY docker/aro.json .

EXPOSE 8000
CMD /usr/bin/pm2 start /srv/www/aro/current/aro.json --no-daemon
VOLUME /srv/www/aro/current/app/public/images
VOLUME /srv/www/aro/current/app/public/stylesheets
VOLUME /srv/www/aro/current/app/public/fonts

