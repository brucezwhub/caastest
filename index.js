const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
var ip = require("ip");

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on('connect', () => {
  pgClient
    //.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .query('CREATE TABLE IF NOT EXISTS allaccess (accesstime varchar(50), serverip varchar(50), id serial)')
    .catch((err) => console.log(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  let date_ob = new Date();
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);
// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
// current year
let year = date_ob.getFullYear();
// current hours
let hours = date_ob.getHours();
// current minutes
let minutes = date_ob.getMinutes();
// current seconds
let seconds = date_ob.getSeconds();
// prints date in YYYY-MM-DD format
//console.log(year + "-" + month + "-" + date);
// prints date & time in YYYY-MM-DD HH:MM:SS format
//console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
let returnstring = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
returnstring = returnstring + " Served by IP address;" + ip.address()+"\n";
// returnstring =returnstring + " --host:"+keys.pgHost
// returnstring =returnstring + " --port:"+keys.pgPort
// returnstring =returnstring + " --database:"+keys.pgDatabase
// returnstring =returnstring + " --pgUser:"+keys.pgUser
// returnstring =returnstring + " --pgPassword:"+keys.pgPassword
let querystring = 'INSERT INTO allaccess(accesstime, serverip) VALUES(';
querystring = querystring +"'" +date_ob.toTimeString()+"'";
querystring = querystring +",'" +ip.address().toString()+"')";
pgClient.query(querystring);
//pgClient.query('INSERT INTO allaccess(accesstime, number) VALUES($1,$2)',[date_ob,ip.address()]);
//res.send(returnstring+"---"+querystring);
res.send(returnstring);
}

);

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }
  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(8080, (err) => {
  console.log('Listening on port 8080...');
});
