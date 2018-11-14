
'use strict';

require('dotenv').config();

var dns = require('dns');
var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
var connection = mongoose.connect(process.env.MONGOLAB_URI);
autoIncrement.initialize(connection);

// create url model and set up autoincrement field
var urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
});

urlSchema.plugin(autoIncrement.plugin, {
  model: 'URL', 
  field: 'short_url',
  startAt: 10,
  incrementBy: 10
});

var URL = connection.model('URL', urlSchema);

// use cors method
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// mount url shortener post handler
app.post('/api/shorturl/new', function(req, res) {
  // check to make sure link is in proper format
  let regexp = /^(http(s)?:\/\/)?(www.)?[A-Za-z0-9-]+.com(\/[A-Za-z0-9-]*)*$/igm;
  let testURL = req.body.url;

  // if format is ok, remove protocol before testing
  if(testURL.search(regexp) > -1) {
    testURL = req.body.url.replace(/http(s)?:\/\//i, '');
  }

  // reassign subdomain if applicable


  // test url and pass error or save to db
  dns.lookup(testURL, function(err) {
    if(err) {
      res.send({error: 'invalid URL'});
    } else {
      // check to make sure url is not a duplicate 
      URL.findOne({original_url: testURL}, function(err, data) {
        if(err) handleError(err);

        if(data) {
          // if it is, return values stored in db
          res.send({original_url: data.original_url, short_url: data.short_url});
        } else {
          // if not, save url to database
          const url = new URL({original_url: testURL});
          url.save(function(err, data) {
            if(err) return handleError(err);
            res.send({original_url: data.original_url, short_url: data.short_url});
          });
        }
      });
    }
  });
});

// redirect short url to original url


app.listen(port, function () {
  console.log('Node.js listening ...');
});