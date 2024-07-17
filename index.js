const cors = require('cors');
require('dotenv').config();
const express = require('express');

const app = express();
const { error } = require('node:console');
const { url } = require('node:inspector');
const { stringify } = require('node:querystring');
const { nextTick } = require('node:process');

const dns = require('node:dns');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended : false});
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const client = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

//mongoose model
const URLSchema = new Schema({
  url: {type: String, required: true, unique: true},
});
const URLModel = mongoose.model('URLModel', URLSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let requested_url;
app.post('/api/shorturl', urlencodedParser, (req, res) => {
  //get url
  requested_url = req.body.url;
  //extract hostname from previous url
  const requested_hostname = requested_url.replace(/^[a-z]*:\/\/?/, "").split('/')[0];
  console.log("host: " + requested_hostname);

  //verify url validity and add to db
  dns.lookup(requested_hostname, (err, address, family) => {
    if (err) {
      console.log("dns lookup error: " + err);
      return res.json({
        error: 'invalid url'
      });
    }
    else {
      //add url to database
      const url_to_add = new URLModel({
        url: requested_url,
      });
      url_to_add.save((err, data) => {
        if (err) {
          return res.json({
            error: 'invalid url'
          });
        }
        //return json object
        else {
          console.log("7");
          res.json({
          original_url: requested_url,
          short_url: data._id.toString(),
          });
        }
      });
    }
  });
});

app.get('/api/shorturl/:url', (req, res) => {
  console.log(req.params.url)
  URLModel.findById(req.params.url, (err, data) => {
    if (err)
      return res.json({ error: "invalid url"});
    else 
      res.status(301).redirect(data.url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
