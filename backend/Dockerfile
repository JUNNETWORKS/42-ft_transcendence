FROM debian:buster

RUN apt update && apt install curl -y

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Create app directory
WORKDIR /backend

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Start the server using the production build
CMD [ "npm", "run", "start:dev" ]
