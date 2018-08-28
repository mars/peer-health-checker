FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Build the bundle
COPY . .
RUN npm run build

EXPOSE 80/tcp
ENV PORT=80 NODE_ENV=production
CMD [ "npm", "start" ]