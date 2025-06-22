FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_BASE_URL
ENV REACT_APP_BASE_URL=${REACT_APP_BASE_URL}

# Build the React app
RUN npm run build

# Serve with a simple static server
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]