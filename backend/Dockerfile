FROM debian:buster

RUN apt-get update && apt-get install -y curl gosu procps

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Create app directory
WORKDIR /backend

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

COPY entrypoint.sh ./

ENV DATABASE_URL=postgresql://prisma:prismapass@postgres:5432/prismadb?schema=public&connect_timeout=300

ENTRYPOINT  [ "bash", "./entrypoint.sh" ]
CMD [ "npm", "run", "start:dev" ]
