FROM debian:buster

RUN apt-get update && apt-get install -y curl gosu

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Create app directory
WORKDIR /frontend

COPY ./ ./

# Install app dependencies
RUN npm install

ENTRYPOINT  [ "bash", "./entrypoint.sh" ]
CMD [ "npm", "run", "dev" ]
