FROM node:10.16.0

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y make gcc build-essential

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@7.3.9

COPY ./ ./

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0"]
