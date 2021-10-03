require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// parse application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// /api/shorturl middleware
app.post('/api/shorturl', function(req, res, next) {
  let urlToLookup = req.body.url;
  const auxRegExp = /^https?:\/\//i;
  if (auxRegExp.test(urlToLookup)) {
    urlToLookup = urlToLookup.replace(auxRegExp, '');
    if (!/\s/.test(urlToLookup) && /\//.test(urlToLookup)) {
      urlToLookup = urlToLookup.split('/')[0];
    }
    dns.lookup(urlToLookup, (error) => {
      if (error && error.code === 'ENOTFOUND') {
        res.json({error: 'invalid url'});
      } else {
        next();
      };
    });
  } else {
    res.json({error: 'invalid url'});
  };
});

//In order to save permanently the shortened urls a DB is needed, it's just not worth it for this project.
const shortenedUrls = [];

// Post to /api/shorturl
app.post('/api/shorturl', function(req, res) {
  let reqUrl = req.body.url; //consider that invalid urls were already filtered by the middleware.
  if (!shortenedUrls.includes(reqUrl)) {
    shortenedUrls.push(reqUrl);
  };
  res.json({original_url: reqUrl, short_url: shortenedUrls.indexOf(reqUrl) + 1 });  
});

app.get('/api/shorturl/:num', function(req, res) {
  const reqNum = Number(req.params.num);
  if (isNaN(reqNum)) {
    res.json({error:"Wrong format"});
  } else if (reqNum > shortenedUrls.length || reqNum == 0) {
    res.json({error:"No short URL found for the given input"});
  } else {
    const redirectTo = shortenedUrls[reqNum - 1];
    res.redirect(redirectTo);
  };
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
