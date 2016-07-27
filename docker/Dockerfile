FROM ait-docker-registry.cloud.altvil.com/aro/app-base

MAINTAINER nvitucci@altvil.com

# build.sh is run to copy the web app into the `target` directory where this image is built
ADD . /srv/www/aro/current
WORKDIR /srv/www/aro/current

EXPOSE 8000
# ADD ./cmo.ini /etc/uwsgi/apps-enabled/cmo.ini
CMD /usr/bin/pm2 start /srv/www/aro/current/aro.json
VOLUME /srv/www/aro/source_data

