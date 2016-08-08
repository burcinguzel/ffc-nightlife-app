var express = require("express");
var YelpApi = require('./yelpUrlGenerator');
var bodyParser = require('body-parser');
var http = require("http");
var mongo = require('mongodb');
var myLangObj =require("./language");


var myDBClient = mongo.MongoClient;
var myDBUrl = process.env.mongodb_url;

var OAuth = require('oauth').OAuth;
var oauth = new OAuth(
            "https://api.twitter.com/oauth/request_token",
            "https://api.twitter.com/oauth/access_token",
            process.env.twitter_consumer_key,
            process.env.twitter_consumer_secret,
            "1.0",
            process.env.twitter_callback_url,
             "HMAC-SHA1");

var app = express();
var urlim ="", userName = "";
var locObj ={
     mekanlar:[],
     adresler:[],
     resimler:[],
     yorumlar:[],
     puanlar:[],
     id:[],
     clearAll: function(){
         locObj.mekanlar=[];
         locObj.adresler=[];
         locObj.resimler=[];
         locObj.yorumlar=[];
         locObj.puanlar=[];
         locObj.id=[];
     }
};
var myLang ="turkce";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser(process.env.cookie_secret));
app.use(express.session());    


     
app.get("/",function(req, res) {
    res.redirect("/aksamanereyegitsem");
});

app.get("/aksamanereyegitsem",function(req,res){
    if(!req.session.user){
        userName ="";
        locObj.clearAll();
        req.session.lang="turkce";
        res.send(show("turkce"));
        }
    else{
        userName = req.session.user;
        res.send(show(req.session.lang));
    }
});

app.post("/aksamanereyegitsem",function(req,res){
    if(!req.body.lang){
        if(!req.session.user)
            userName ="";
        else
            userName = req.session.user;
        
        locObj.clearAll();
        if(!req.session.lang)
            req.session.lang = "turkce";
            
        req.session.deger  =req.body.deger;
        urlim = getYelpUrl(req.body.deger,req.session.lang); 
        parseInfo(req,res,urlim);
    }else{
        req.session.lang  = req.body.lang;
        locObj.clearAll();
        res.send(show(req.session.lang));
    }
});

app.post("/aksamanereyegitsem/register",function(req,res){
    myDBClient.connect(myDBUrl, function(err, db) {
 	      if (err)
 	        console.log('Unable to connect to the mongoDB server. Error:', err);
 	      else {        
 	        var collection = db.collection('sessionTable');
 	        if(req.body.flag === "1"){
 	            collection.insert({
 	                twitterUser: req.session.user,
 	                twitterId: req.session.twitterId,
 	                mekanId:req.body.mekanId
 	            }, function(error, data) {
 	                    if (error)
 	                        console.log(error);
 	                    db.close();
 	            });
 	        }else{
 	            collection.remove({
		            mekanId:req.body.mekanId,
		            twitterUser: req.session.user
			        }, function(err,data){
		            if (err)
 	                   console.log(err);   
	            	db.close();
	            });
 	        } 	                    
 	      }
    });
});

app.post('/aksamanereyegitsem/auth', function(req, res) {
    if(!req.session.user){
        oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("Authentication Failed!");
            } else {
                req.session.oauth = {
                    token: oauth_token,
                    token_secret: oauth_token_secret
                };
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
            }
        });
    } else {
         res.redirect('/aksamanereyegitsem'); 
    }
});

app.get('/aksamanereyegitsem/auth/callback', function(req, res, next) {
 
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth_data = req.session.oauth;
 
    oauth.getOAuthAccessToken(
      oauth_data.token,
      oauth_data.token_secret,
      oauth_data.verifier,
      function(error, oauth_access_token, oauth_access_token_secret, results) {
        if (error) {
          console.log(error);
          res.send("Authentication Failure!");
        }
        else {
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          userName = req.session.user =  results.screen_name ;
          req.session.twitterId = results.user_id;
          urlim = getYelpUrl(req.body.deger,req.session.lang); 
          parseInfo(req,res,urlim);
          //res.send("Authentication Successful");
          //res.redirect('/aksamanereyegitsem');
        }
      }
    );
  }
  else {
    res.redirect('/aksamanereyegitsem'); 
  }
 
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0");

function show( langua){
        var myTemp = "";

          
        for(var i=0;i<locObj.mekanlar.length;i++){
            if(i%2===0){
                  myTemp    += '<div class="row">'
                  +'<div class="col-md-6 mekan">'
                  +'<div class="col-md-3 col-xs-4"><img src="'+locObj.resimler[i]+'"></div>'
                  +'<div class="col-md-9 col-xs-8">'
                    +'<div class="row">'
                        +'<div class="col-md-3 col-xs-4 mekanHead"><a href="' +locObj.adresler[i]+'">'+  locObj.mekanlar[i]   +  '</a></div>'
                        +'<div class="col-md-9 col-xs-8">'
                        +'<button class="myBtn gitBtn" id="'+locObj.id[i]["name"]+'" style="background-color:'+locObj.id[i].renk+'"><span id="mySpan'+locObj.id[i]["name"]+'">'+locObj.id[i]["count"]+'</span>&nbsp;'+myLangObj[myLang].subBtn+'</button>'
                        +'</div>'
                    +'</div>'
                    +'<div class="row">'
                        +'<div class="col-md-12"> '+locObj.yorumlar[i] +'</div>'
                     +'</div>'
                  +'</div>'
                  +'</div>';
                  if(i==(locObj.mekanlar.length -1)){
                      myTemp +='</div>';
                  }
            }else{
                    myTemp +='<div class="col-md-6 mekan">'
                    +'<div class="col-md-3 col-xs-4"><img src="'+locObj.resimler[i]+'"></div>'
                  +'<div class="col-md-9 col-xs-8">'
                    +'<div class="row">'
                        +'<div class="col-md-3 col-xs-4 mekanHead"><a href="' +locObj.adresler[i]+'">'+  locObj.mekanlar[i]   +  '</a></div>'
                        +'<div class="col-md-9 col-xs-8">'
                        +'<button class="myBtn gitBtn" id="'+locObj.id[i]["name"]+'" style="background-color:'+locObj.id[i].renk+'"><span id="mySpan'+locObj.id[i]["name"]+'">'+locObj.id[i]["count"]+'</span>&nbsp;'+myLangObj[myLang].subBtn+'</button>'
                        +'</div>'
                    +'</div>'
                    +'<div class="row">'
                        +'<div class="col-md-12"> '+locObj.yorumlar[i] +'</div>'
                     +'</div>'
                  +'</div>'
                  +'</div>'
                  +'</div>'; 
            }
                 }
                 

            var html = '<!DOCTYPE html><html lang="tr-TR"><head>'
                    +'<meta charset="UTF-8"><title>'+myLangObj[langua].title+'</title>'
                    +'<meta name="viewport" content="width=device-width, initial-scale=1">'
                    +'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">'
                    +'<link rel="stylesheet" href="/stylesheets/style.css"></link>'
                    +'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">'
                    +'<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>'
                    +'<script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>'
                    +'<script src="/javascripts/javascripts.js"></script>'
                    +'</head>'
                    +'<body>'
                    +'<nav class="navbar">'
                    +'<div class="container-fluid">'
                    +'<ul class="nav navbar-nav navbar-left">'
                    +'<li><span class="fa fa-twitter btnColor" id="myTwitter">&nbsp;<span id="myUser">'+userName+'</span>&nbsp;<span class="fa fa-twitter btnColor" id="myTwitter"></li>'
                    +'</ul>'
                    +'<ul class="nav navbar-nav navbar-right">'
                    +'<li><form method="post" action="/aksamanereyegitsem">'
                    +'<input type="submit" name="lang" value="turkce" id="inTur" />'
                    +'<input type="submit" name="lang" value="english" id ="inEng" />'
                    +'</form></li>'
                    +'</ul>'
                    +'</div>'
                    +'</nav>'
                    + '<div class="container">'
                    + '<h1>'+myLangObj[langua].title+'</h1>'
                    + '<form method="post" action="/aksamanereyegitsem" id="myForm">'
                    + '<p><input type="text" name="deger"  value="'+myLangObj[langua].formValue+'" id="inBox"/></p>'
                    + '<p><input type="submit" value="'+myLangObj[langua].mainBtn+'" class="myBtn" /></p>'
                    + '</form>'
                    + myTemp             
                    + '</div>'
                    + '</body></html>';   
                    
            return html;
}

function getYelpUrl(deger,langua){
    var myUrl  = YelpApi.generateYelpUrl(deger,myLangObj[langua].yelpLang,function(error, response, mybody) {
             if(error) return console.log('Error:', error);
             if(response.statusCode !== 200){
                return console.log('Invalid Status Code:', response.statusCode);
            }
            });
        return myUrl;
}

function parseInfo(myreq,myres,myUrl){

     http.get(myUrl, (res) => {
            console.log(`Got response: ${res.statusCode}`);
            var body =[];
           res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
    
            var parsed = JSON.parse(body);
                    if(!isEmpty(parsed)){
                        if(parsed.hasOwnProperty('businesses')){
                            for(var i = 0;i<parsed.businesses.length;i++){
                                locObj.mekanlar.push(parsed.businesses[i].name); 
                                locObj.adresler.push(parsed.businesses[i].url); 
                                locObj.resimler.push(parsed.businesses[i].image_url);
                                locObj.puanlar.push(parsed.businesses[i].rating);
                                locObj.id.push({"name":parsed.businesses[i].id,"count":0 , "renk":"rgba(220, 0, 60, 0.4)"});
                                     if(parsed.businesses[i].snippet_text == undefined){
                                        locObj.yorumlar.push('""');
                                    }else{
                                        locObj.yorumlar.push(parsed.businesses[i].snippet_text);
                                    }
                            }
                        }else if(parsed.hasOwnProperty('error')){
                            console.log("location not found");
                            myres.redirect('/aksamanereyegitsem');
                            return;
                        }
                    }
                    myDBClient.connect(myDBUrl, function(err, db) {
                    if(err) 
                        console.log(err);
                    var tmpcntr = 0;
                    var myCol = db.collection('sessionTable');
                    var myCol2 = db.collection('sessionTable');
                    for(var i = 0;i<parsed.businesses.length;i++){
	                      myCol.aggregate([
	                              {$match: { mekanId: locObj.id[i].name} },
	                              { $group: {  "_id":locObj.id[i].name , "count": { $sum: 1 }}}
	                      ]).toArray(function (err, result) {
                           if (err)
                             console.log(err);
                           else if (result.length) {
                              locObj.id.find(function(a) {
                                  if( a.name === result[0]._id) a.count = result[0].count; 
                              });
                              tmpcntr++;
                            }else
                                tmpcntr++;
                            if(tmpcntr == parsed.businesses.length && userName == "")
                                myres.send(show(myreq.session.lang));  
                         });
                  if( userName !==""){
        	            myCol2.find(
	                        { twitterUser: userName}
	                      ).toArray(function (err, result) {
                           if (err)
                             console.log(err);
                           else if (result.length) {
                              result.forEach(function(val,ind,arr){
                                locObj.id.find(function(a) {if( a.name === val.mekanId) a.renk = "rgba(0, 220, 60, 0.4)" });
                              });
                              if(tmpcntr == parsed.businesses.length )
                                  myres.send(show(myreq.session.lang));  
                            }
                          });
                    } 
                  }
                    db.close(); 
              });
          });
        res.resume();
        }).on('error', (e) => {
                console.log(`Got error: ${e.message}`);
          });
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true && JSON.stringify(obj) === JSON.stringify({});
}

    