require('dotenv').config();
const express = require('express');

const cors = require('cors');
const app = express();
const dns = require('node:dns').promises;
const bodyParser = require('body-parser');
const { error } = require('node:console');
const { url } = require('node:inspector');
const { stringify } = require('node:querystring');
const urlencodedParser = bodyParser.urlencoded({ extended : false});

const mongoose = require('mongoose');
const { nextTick } = require('node:process');
const Schema = mongoose.Schema;
const client = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Basic Configuration
const port = process.env.PORT || 3000;

//mongoose model
const URLSchema = new Schema({
  url: {type: String, required: true, unique: true},
});
const URLModel = mongoose.model('URLModel', URLSchema);

const done = (err, data) => {
  if (err) return console.log(err);
  else {
    console.log("Added: " + data);
  }
};
//personal note: trying to use propmises
const addUrlPromise = (requested_url) => {
  return new Promise((resolve, reject) => {
    const url_to_add = new URLModel({
    url: requested_url,
  });
  url_to_add.save((err, data) => {
    if (err) 
      reject(err);

    resolve(data);
  });
  });
};

const getIdPromise = (requested_url) => {
  return new Promise((resolve, reject) => {
    URLModel.findOne({url: requested_url}, (err, data) => {
      if (err)
        reject(err);
      console.log(data);
      resolve(data._id);
    });
  });
};

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let requested_url;
app.post('/api/shorturl', urlencodedParser, async (req, res) => {
  
  try {
  //get url
  requested_url = req.body.url;
  //extract hostname from previous url
  const requested_hostname = requested_url.replace(/^https?:\/\//, "")
  //verify url validity
  const address = await dns.lookup(requested_hostname);
  
  //add url to database
      const new_url = await addUrlPromise(requested_url);
      
      //get short_url
      let id = await getIdPromise(requested_url);

      //respond json object
      res.json({
        original_url: requested_url,
        short_url: id,
      });
      //catch errors occuring in try{} block
    } catch (err) {
        res.json({
        error: 'invalid url'
      });
    }
  });

app.get('/api/shorturl/:url', (req, res) => {

  URLModel.findById(req.params.url, (err, data) => {
    if (err)
      done(err);
    res.redirect(data.url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
