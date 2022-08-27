FROM node:18-buster

# Create app directory
WORKDIR /backend

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Start the server using the production build
CMD [ "npm", "run", "start:dev" ]
