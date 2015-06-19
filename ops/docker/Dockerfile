FROM mdillon/postgis:9.4

ENV POSTGIS_MAJOR 2.1
ENV POSTGIS_VERSION 2.1.7+dfsg-0~exp1.pgdg70+1

RUN echo deb http://http.debian.net/debian wheezy-backports main >> /etc/apt/sources.list
RUN apt-get update \
      && apt-get install -y --no-install-recommends \
           postgresql-$PG_MAJOR-pgrouting \
      && rm -rf /var/lib/apt/lists/*
