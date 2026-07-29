# Preparing a Docker file for the containerization of backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 5000
CMD ["npm", "start"]