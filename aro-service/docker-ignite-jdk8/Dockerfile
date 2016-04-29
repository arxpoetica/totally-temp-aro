FROM java:8
MAINTAINER Altvil
ENV IGNITE_VERSION 1.5.0.final
ENV IGNITE_HOME /opt/ignite/apache-ignite-fabric-1.5.0.final-bin
WORKDIR /opt/ignite

ADD http://www.us.apache.org/dist/ignite/1.5.0.final/apache-ignite-fabric-1.5.0.final-bin.zip /opt/ignite/ignite.zip
RUN unzip -q ignite.zip
RUN rm ignite.zip
RUN cp -r $IGNITE_HOME/libs/optional/ignite-slf4j $IGNITE_HOME/libs/.
RUN cp -r $IGNITE_HOME/libs/optional/ignite-rest-http $IGNITE_HOME/libs/.

ADD ./run.sh $IGNITE_HOME/
RUN chmod +x $IGNITE_HOME/run.sh

CMD $IGNITE_HOME/run.sh

