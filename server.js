
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
  dns.lookup(req.body.url, function(err) {
    if(err) {
      res.send({error: 'invalid URL'});
    } else {
      var url = new URL({original_url: req.body.url});
      url.save(function(err, data) {
        if(err) return handleError(err);
        console.log(data);
      });
    }
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});