FROM buildkite/puppeteer:v1.10.0

# ppp dir
WORKDIR /src/

# dependencies
COPY *.json ./
RUN npm install

# source code
COPY . .

# run server
EXPOSE 3000
CMD ["npm", "start"]
