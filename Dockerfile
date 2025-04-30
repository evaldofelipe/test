# Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
# This step leverages Docker layer caching
COPY package.json ./
COPY package-lock.json* ./

# Install app dependencies
# Using --only=production if you don't need devDependencies
# Since client.js only uses built-in 'http', this might not install anything new,
# but it's good practice if you add dependencies later.
RUN npm install --only=production

# Bundle app source
COPY client.js .

# Make port 8080 available to the world outside this container
# This is for the health check server inside the client container
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "client.js" ] 
