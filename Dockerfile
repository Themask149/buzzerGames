# Use an official Node runtime as the parent image
FROM node

# Set the working directory in the container to /app
WORKDIR /app

# Install git and openssh-client
RUN apt-get update && apt-get install -y git openssh-client

# Clone the repository
RUN git clone --branch random https://github.com/Themask149/buzzerGames.git /app

# Install any needed packages specified in package.json
RUN npm install

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run the app when the container launches
CMD ["npm", "start"]