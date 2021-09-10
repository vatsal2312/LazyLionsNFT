FROM node:16

RUN apt-get update && apt-get install cron nano -y

COPY . /opt/app
WORKDIR /opt/app

RUN cd ./contracts && npm i
RUN cd ./dapp && npm i && npx prisma generate
RUN cd ./twitter && npm i
RUN cd ./twitter && npx prisma generate --schema ../dapp/prisma/schema.prisma

COPY ./twitter/cron/crontab /etc/crontabs/root

# ENTRYPOINT ["/bin/sh"]
CMD ["cron", "-f"]