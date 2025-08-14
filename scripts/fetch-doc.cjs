#!/usr/bin/env node



// Load credentials from credentials.json with debug output
var fs = require('fs');
var path = require('path');
const CREDENTIALS_PATH = path.resolve(__dirname, '../credentials.json');
console.log('Using credentials file at:', CREDENTIALS_PATH);
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('ERROR: credentials.json not found at', CREDENTIALS_PATH);
  process.exit(1);
}
var credentialsRaw = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
console.log('credentials.json contents:', credentialsRaw);
var credentials = JSON.parse(credentialsRaw);
var CLIENT_ID = credentials.installed.client_id;
var CLIENT_SECRET = credentials.installed.client_secret;

var express = require('express');
var archieml = require('archieml');
var app = express();
var url = require('url');
var htmlparser = require('htmlparser2');
var { decode } = require('html-entities');

// Grab google packages and the drive api
var {google} = require('googleapis');
var drive = google.drive('v2');

// Set up auth
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, "http://localhost");
google.options({ auth: oauth2Client });
var KEY = '1_QWeSZMbq3l-ZEjbMH0vyAHLeKTqNC_S9x5s0MVmGqk';


// Standalone function to fetch, parse, and save doc to static/doc.json
function fetchAndSaveDoc() {
  // Get a token from the user interactively if needed
  var readline = require('readline');
  var TOKEN_PATH = path.resolve(__dirname, '../token.json');
  function getAccessToken(callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive']
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) return console.error('Error retrieving access token', err);
        oauth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        callback();
      });
    });
  }

  // Load token if exists

  function tryWithToken() {
    drive.files.get({fileId: KEY}, function (err, doc) {
      if (err && err.code === 401) {
        // Token invalid/expired, delete and restart auth
        console.warn('Token invalid or expired, removing token.json and restarting auth.');
        try { fs.unlinkSync(TOKEN_PATH); } catch (e) {}
        getAccessToken(proceed);
      } else if (err) {
        return console.error(err);
      } else {
        proceedWithDoc(doc);
      }
    });
  }

  if (fs.existsSync(TOKEN_PATH)) {
    try {
      var token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oauth2Client.setCredentials(token);
      tryWithToken();
    } catch (e) {
      // If token.json is corrupt, delete and restart
      try { fs.unlinkSync(TOKEN_PATH); } catch (e2) {}
      getAccessToken(proceed);
    }
  } else {
    getAccessToken(proceed);
  }

  function proceed() {
    drive.files.get({fileId: KEY}, function (err, doc) {
      if (err) return console.error(err);
      proceedWithDoc(doc);
    });
  }

  function proceedWithDoc(doc) {
    var exportLinks = doc.exportLinks || (doc.data && doc.data.exportLinks);
    if (!exportLinks || !exportLinks['text/html']) {
      console.error('ERROR: exportLinks["text/html"] not found. This file may not be a Google Doc, or you may not have access.');
      return;
    }
    var export_link = exportLinks['text/html'];
    // Use https to fetch the export link with the OAuth2 access token
    const https = require('https');
    const accessToken = oauth2Client.credentials.access_token;
    if (!accessToken) {
      console.error('No access token found in oauth2Client.credentials.');
      return;
    }
    const urlObj = new URL(export_link);
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    https.get(urlObj, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('Failed to fetch exported HTML:', res.statusCode, data);
          return;
        }
        var handler = new htmlparser.DomHandler(function(error, dom) {
          var tagHandlers = {
            _base: function (tag) {
              var str = '';
              tag.children.forEach(function(child) {
                if (func = tagHandlers[child.name || child.type]) str += func(child);
              });
              return str;
            },
            text: function (textTag) { 
              return textTag.data; 
            },
            span: function (spanTag) {
              return tagHandlers._base(spanTag);
            },
            p: function (pTag) { 
              return tagHandlers._base(pTag) + '\n'; 
            },
            a: function (aTag) {
              var href = aTag.attribs.href;
              if (href === undefined) return '';
              if (aTag.attribs.href && url.parse(aTag.attribs.href,true).query && url.parse(aTag.attribs.href,true).query.q) {
                href = url.parse(aTag.attribs.href,true).query.q;
              }
              var str = '<a href="' + href + '" target="_blank" rel="noopener noreferrer">';
              str += tagHandlers._base(aTag);
              str += '</a>';
              return str;
            },
            li: function (tag) {
              return '* ' + tagHandlers._base(tag) + '\n';
            }
          };
          ['ul', 'ol'].forEach(function(tag) {
            tagHandlers[tag] = tagHandlers.span;
          });
          ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(function(tag) {
            tagHandlers[tag] = tagHandlers.p;
          });
          var body = dom[0].children[1];
          var parsedText = tagHandlers._base(body);
          parsedText = decode(parsedText);
          parsedText = parsedText.replace(/<[^<>]*>/g, function(match){
            return match.replace(/”|“/g, '"').replace(/‘|’/g, "'");
          });
          var parsed = archieml.load(parsedText);
          // Recursively wrap paragraphs in <p> tags only if:
          // 1) the value is nested (not at the root), or
          // 2) the value is a multi-paragraph string (contains two or more paragraphs)
          // Only wrap in <p> if nested or multi-paragraph. Top-level single-paragraph values remain plain.
          function wrapParagraphs(obj, isNested = false, key = null) {
            if (typeof obj === 'string') {
              // Split into paragraphs, ignoring empty/whitespace-only ones
              const paragraphs = obj.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
              if (isNested) {
                // Always wrap nested string values in <p>
                return paragraphs.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('');
              } else if (paragraphs.length > 1) {
                // Multi-paragraph top-level value: wrap each paragraph
                return paragraphs.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('');
              } else {
                // Single-paragraph top-level value: leave as plain string, collapse all whitespace
                return paragraphs.length === 1 ? paragraphs[0] : '';
              }
            } else if (Array.isArray(obj)) {
              return obj.map(item => wrapParagraphs(item, true));
            } else if (obj && typeof obj === 'object') {
              const out = {};
              for (const k in obj) out[k] = wrapParagraphs(obj[k], true, k);
              return out;
            } else {
              return obj;
            }
          }
          // For top-level keys, pass the key name for debug
          const parsedWithPTags = (() => {
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              const out = {};
              for (const k in parsed) out[k] = wrapParagraphs(parsed[k], false, k);
              return out;
            } else {
              return wrapParagraphs(parsed, false, null);
            }
          })();
          // Save to src/routes/_data/doc.json with <p> tags for nested or multi-paragraph values only
          fs.writeFileSync('src/routes/_data/doc.json', JSON.stringify(parsedWithPTags, null, 2));
          console.log('Document parsed and saved to src/routes/_data/doc.json (with <p> tags for nested or multi-paragraph values only)');
        });
        var parser = new htmlparser.Parser(handler);
        parser.write(data);
        parser.done();
      });
    }).on('error', (e) => {
      console.error('Error fetching exported HTML:', e);
    });
  }

  function proceed() {
    drive.files.get({fileId: KEY}, function (err, doc) {
      if (err) return console.error(err);
      if (!doc.exportLinks || !doc.exportLinks['text/html']) {
        console.error('ERROR: exportLinks["text/html"] not found. This file may not be a Google Doc, or you may not have access.');
        console.error('Full doc object returned:', JSON.stringify(doc, null, 2));
        return;
      }
      var export_link = doc.exportLinks['text/html'];
      oauth2Client._makeRequest({method: "GET", uri: export_link}, function(err, body) {
        if (err) return console.error(err);
        var handler = new htmlparser.DomHandler(function(error, dom) {
          var tagHandlers = {
            _base: function (tag) {
              var str = '';
              tag.children.forEach(function(child) {
                if (func = tagHandlers[child.name || child.type]) str += func(child);
              });
              return str;
            },
            text: function (textTag) { 
              return textTag.data; 
            },
            span: function (spanTag) {
              return tagHandlers._base(spanTag);
            },
            p: function (pTag) { 
              return tagHandlers._base(pTag) + '\n'; 
            },
            a: function (aTag) {
              var href = aTag.attribs.href;
              if (href === undefined) return '';
              if (aTag.attribs.href && url.parse(aTag.attribs.href,true).query && url.parse(aTag.attribs.href,true).query.q) {
                href = url.parse(aTag.attribs.href,true).query.q;
              }
              var str = '<a href="' + href + '" target="_blank" rel="noopener noreferrer">';
              str += tagHandlers._base(aTag);
              str += '</a>';
              return str;
            },
            li: function (tag) {
              return '* ' + tagHandlers._base(tag) + '\n';
            }
          };
          ['ul', 'ol'].forEach(function(tag) {
            tagHandlers[tag] = tagHandlers.span;
          });
          ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(function(tag) {
            tagHandlers[tag] = tagHandlers.p;
          });
          var body = dom[0].children[1];
          var parsedText = tagHandlers._base(body);
          var entities = new Entities();
          parsedText = entities.decode(parsedText);
          parsedText = parsedText.replace(/<[^<>]*>/g, function(match){
            return match.replace(/”|“/g, '"').replace(/‘|’/g, "'");
          });
          var parsed = archieml.load(parsedText);
          // Recursively replace \n with <br> in all string values
          function replaceNewlines(obj) {
            if (typeof obj === 'string') {
              return obj.replace(/\n/g, '<br>');
            } else if (Array.isArray(obj)) {
              return obj.map(replaceNewlines);
            } else if (obj && typeof obj === 'object') {
              const out = {};
              for (const k in obj) out[k] = replaceNewlines(obj[k]);
              return out;
            } else {
              return obj;
            }
          }
          const parsedWithBr = replaceNewlines(parsed);
          // Save to src/routes/_data/doc.json with <br> for newlines
          fs.writeFileSync('src/routes/_data/doc.json', JSON.stringify(parsedWithBr, null, 2));
          console.log('Document parsed and saved to src/routes/_data/doc.json (with <br> for newlines)');
        });
        var parser = new htmlparser.Parser(handler);
        parser.write(body);
        parser.done();

      });
    });
  }
}

// If run directly, fetch and save doc
if (require.main === module) {
  fetchAndSaveDoc();
}

app.get('/:key', function (req, res) {
  var redirect_url = oauth2Client.generateAuthUrl({
    scope: 'https://www.googleapis.com/auth/drive'
  });
  res.redirect(redirect_url);
})

app.param('key', function (req, res, next, key) {
  KEY = key || KEY;
  next();
})

