FROM node:10
MAINTAINER nick.vitucci@altmansolon.com

RUN npm install -g pm2

ADD . /srv/www/aro/current
WORKDIR /srv/www/aro/current

EXPOSE 8000
CMD /usr/bin/pm2 start /srv/www/aro/current/aro.json --no-daemon
VOLUME /srv/www/aro/current/app/public/images
VOLUME /srv/www/aro/current/app/public/stylesheets
VOLUME /srv/www/aro/current/app/public/fonts
