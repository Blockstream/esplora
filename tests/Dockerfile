FROM cypress/base:10
WORKDIR /tests
COPY package.json npm-shrinkwrap.json ./
RUN npm install
COPY . .
ENV PATH=./node_modules/.bin:$PATH
CMD cypress run