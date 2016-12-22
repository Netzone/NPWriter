FROM node:6.9.1-wheezy
MAINTAINER Infomaker Scandinavia AB

COPY . /opt/writer

RUN buildDeps='git' \
    && apt-get -y --force-yes update \
    && apt-get -y --force-yes install apt-utils ${extras} ${buildDeps}\
    && cd /opt/writer \
    && npm install --production \
    && chmod +x /opt/writer/start.sh \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove ${buildDeps}

ENTRYPOINT /opt/writer/start.sh

EXPOSE 5000