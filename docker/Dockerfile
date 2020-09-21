FROM 976168524097.dkr.ecr.us-east-1.amazonaws.com/aro/aro-app-base

MAINTAINER nvitucci@altvil.com

# build.sh is run to copy the web app into the `target` directory where this image is built
ADD . /srv/www/aro/current
WORKDIR /srv/www/aro/current

EXPOSE 8000
CMD /usr/bin/pm2 start /srv/www/aro/current/aro.json --no-daemon
VOLUME /srv/www/aro/current/app/public/images
VOLUME /srv/www/aro/current/app/public/stylesheets
VOLUME /srv/www/aro/current/app/public/fonts

