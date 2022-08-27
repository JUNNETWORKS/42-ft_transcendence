FROM node:18-buster AS build

# Create app directory
WORKDIR /frontend

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

CMD [ "npm", "run", "dev"]
