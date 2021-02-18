FROM node:14.14.0-alpine
WORKDIR "/app"
COPY ./package.json ./
RUN npm install
COPY . .
ENV PGHOST=172.30.20.104
ENV PGPORT=5432
ENV PGDATABASE=testdb
ENV PGUSER=testuser
ENV PGPASSWORD=wJ3zC5eL0nN9yB4z


CMD ["npm", "run", "start"]