 
 // import the modules we will use
var DocumentDBClient = require('documentdb').DocumentClient;
var nodemailer = require('nodemailer');
var nconf = require('nconf');

// tell nconf which config file to use
nconf.env();
nconf.file({ file: 'config.json' });


var host = nconf.get("HOST");
var authKey = nconf.get("AUTH_KEY");
var databaseId = nconf.get("DATABASE");
var collectionId = nconf.get("COLLECTION");



// create some global variables which we will use later to hold instances of the DocumentDBClient, Database and Collection

// create an instance of the DocumentDB client
var client = new DocumentDBClient(host, { masterKey: authKey });

 var express = require('express');
 var router = express.Router();
 

 

 
 router.get('/getcarowner/:docid',function(request, response, next){  
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                getCarOwners(request,collection, function (docs) {  
                          
               response.json(docs);              
            });    
        });
     });
 });
 
 
  router.get('/listsharedrides/:source/:destination/:userid', function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                listsharedrides(request,collection, function (docs) {  
                response.json(docs);          
            });    
        });
     });
   
 }); 
 
  router.get('/changestatus/:carownerId/:userId/:source/:destination/:status',function(request, response, next) { 
      readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) { 
            StatusOfRide(request,collection, function (docs) {     
                var carOwnerDocument =  docs;
                console.log(carOwnerDocument);
                if(carOwnerDocument != undefined){
                //carOwnerDocument.rides=[];                    
                    for(var i=0; i< carOwnerDocument[0].rides.length; i++){
                        var currentRide = carOwnerDocument[0].rides[i];
                        if(currentRide.source == request.params.source && currentRide.destination == request.params.destination ){
                            for (var j=0; j<currentRide.ride.length; j++){
                                var statusofride= currentRide.ride[j];
                                                        
                            if (statusofride.userDocId == request.params.userId )
                            {
                               if (request.params.status==1)
                               {
                                   statusofride.status="Accepted";
                               }
                               else
                               {
                                   statusofride.status="Rejected";
                               }
                               
                            }  
                            }
                            
                           
                          var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+ docs[0].id;
                                    client.replaceDocument(docLink, carOwnerDocument[0], function (err, updated) {
                                   if (err) 
                                   {
                                       throw (err);
                                   } 
                                   else
                                   {
                                       console.log("update successful");
                                   }
                            });
                    }    
                    }          
                }
            });    
        });
     });
   
 }); 
      
 
 
 router.get('/joinride/:carownerId/:userId/:source/:destination',function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {   
            joinARide(request,collection, function (docs) {                                 
                var carOwnerDocument =  docs;
                //console.log(carOwnerDocument);
                if(carOwnerDocument != undefined){
              
                if(carOwnerDocument[0].rides != undefined)     {            
                                                                  
                    for(var i=0; i< carOwnerDocument[0].rides.length; i++){
                        var currentRide = carOwnerDocument[0].rides[i];
                        if(currentRide.source == request.params.source && currentRide.destination == request.params.destination){                                                                                   
                              var rideDetails={ "userDocId" : null, "status" : null };
                              rideDetails.userDocId = request.params.userId;
                              rideDetails.status = "Pending"; 
                                if(currentRide.ride == undefined){ 
                                    currentRide.ride = [];
                                }
                                currentRide.ride.push(rideDetails);                                                    
                        }
                    }     
                
                    var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+ docs[0].id;
                    client.replaceDocument(docLink, carOwnerDocument[0], function (err, updated) {
                        if (err) 
                        {
                            throw (err);
                        } 
                        else
                        {
                            console.log("update successful");
                        }
                    });   
                  }
                  else{
                      response.json({ "error" : "No rides are exist against this user."});
                  }
                }
                else{
                    response.json({ "error" : "No user exist with this id." })
                }
            });    
        });
     });   
 });  

  router.get('/authenticate/:email/:password', function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                authenticateUser(request,collection, function (items) {  
                   // console.log(items);
                 response.json(items);             
            });    
        });
     });
   
 }); 
 
 
 router.get('/searchrides/:destination',function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                searchrides(request,collection, function (docs) {  
                response.json(docs);          
            });    
        });
     });
   
 }); 

 router.post('/register',function (request, response) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {              
             if (request.body) {
               
                getItem(request,collection,function(docs)
                {                    
                    if (docs == undefined || docs == null || docs.length == 0 || (docs.length == 1 && docs[0] == ""))
                    {
                        createItem(collection, request.body, function () {
                             response.end('true');  
                        });                       
                    }
                    else
                    {
                        //throw('user already exists');
                        response.end('user already exists'); 
                    }                
               });
             }
    });
    });
    });
  
   router.post('/updateroute',function (request, response) {       
        
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {              
             if (request.body) {               
                checkitemforlocation(request,collection,function(docs)
                {                    
                    if (docs == undefined || docs == null || docs.length == 0 || (docs.length == 1 && docs[0] == ""))
                    {                       
                         response.end('No user exists with that id'); 
                    }
                    else
                    {                                                                                         
                            //console.log(request.body.users[0].user);
                            docs[0].location[0].startpoint=request.body.locations[0].startpoint;
                            docs[0].location[0].startlat=request.body.locations[0].startlat;
                            docs[0].location[0].startlng=request.body.locations[0].startlng;
                            docs[0].location[0].endlat=request.body.locations[0].endlat;
                            docs[0].location[0].endlng=request.body.locations[0].endlng;
                            docs[0].location[0].endpoint=request.body.locations[0].endpoint;
                            docs[0].pickuplocations = request.body.pickuplocations;
                            var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+docs[0].id;
                            client.replaceDocument(docLink, docs[0], function (err, updated) {
                      });
                     // console.log('done');
                    }                
               });
             }
    });
    });
    });
      
   var checkitemforlocation = function(request,collection,callback){  
  // console.log(request.body);
   var users = request.body.users[0]; 
  //console.log(user[0].id);
   var query ='SELECT * FROM user r WHERE r.id="'+users.user+'"';
   //console.log(query);
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }       
       // console.log(docs);        
        callback(docs);
    });
}   
    
   router.post('/update',function (request, response) {   
   readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {              
             if (request.body) {               
                checkitem(request,collection,function(docs)
                {                    
                    if (docs == undefined || docs == null || docs.length == 0 || (docs.length == 1 && docs[0] == ""))
                    {                       
                         response.end('No user exists with that id'); 
                    }
                    else
                    {                            
                            docs[0].username = "Dharmendra";
                            //console.log(docs[0]);
                            var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+docs[0].id;
                            client.replaceDocument(docLink, docs[0], function (err, updated) {
                                
                            });
                      //console.log('done');
                    }                
               });
             }
    });
    });
    });
    
    router.post('/updatetest',function (request, response) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {              
             if (request.body) {               
                checkitem(request,collection,function(docs)
                {                    
                    if (docs == undefined || docs == null || docs.length == 0 || (docs.length == 1 && docs[0] == ""))
                    {                       
                         response.end('No user exists with that id'); 
                    }
                    else
                    {                            
                            docs[0].username = "Dharmendra1";
                            docs[0].rides = [];
                            docs[0].rides.push({"source" : "secunderabad", "destination" : "wipro"});
                            //console.log(docs[0]);
                            var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+docs[0].id;
                            client.replaceDocument(docLink, docs[0], function (err, updated) {
                                
                            });
                      //console.log('done');
                    }                
               });
             }
    });
    });
    });
    
    
    

 var authenticateUser = function (request,collection, callback) {   
    var query ='SELECT r.id FROM root r WHERE r.email="'+request.params.email+'" and r.password="'+request.params.password+'"'
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        } 
        //console.log(docs);
        callback(docs);
    });
}

var checkitem = function(request,collection,callback){  
   var query ='SELECT * FROM root r WHERE r.id="1"';
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }       
       // console.log('0');        
        callback(docs);
    });
}

var getCarOwners = function(request,collection,callback){  
   var query ='SELECT * FROM root r WHERE r.id="'+request.params.docid+'"';
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }       
       // console.log('0');        
        callback(docs);
    });
}

var joinARide= function(request,collection,callback){  
    var query = 'select * from root r where r.id="'+request.params.carownerId+'"';
 client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }       
       // console.log('0');        
        callback(docs);
    });
}

var StatusOfRide= function(request,collection,callback){  
    var query = 'select * from root r where r.id="'+request.params.carownerId+'"';
 client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }       
       // console.log('0');        
        callback(docs);
    });
}

var getItem = function(request,collection,callback){ 
   var query ='SELECT r.email FROM root r WHERE r.email="'+request.body.email+'"';
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }        
        callback(docs);
    });
}

var searchrides= function (request,collection,callback) {
    var destination =request.params.destination;
   var query= 'SELECT s.address,s.lat,s.lng, u.id,l.startpoint,l.endpoint,l.endlat,l.endlng'+' from users u'+' join l in u.location '+' join s in u.pickuplocations '+
    ' where contains  (s.address, "'+destination+'")';
    
    console.log(query);
   client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            console.log(err);
            throw (err);
        } 
        
        callback(docs);
    });
    
}


var listsharedrides =  function (request,collection,callback) {
    var query =""; 
     
     if (request.params.source == "undefined" && request.params.destination == "undefined") 
     {
          query ='select u.id,u.isowner,u.username,{"startpoint":l.startpoint,"endpoint":l.endpoint,"seats":l.seatsavailability} as location,{"locations":p.pickuplocations} as pickuplocations '+
                'from users u '+
                'join l in u.location '+
                'join p in u.setlocation '+
                'where  u.id="'+request.params.userid+'"';
            
     }
     else
     {
         var source =request.params.source;
         var destination =request.params.destination;
         query ='select u.id,u.isowner,u.username,{"startpoint":l.startpoint,"endpoint":l.endpoint,"seats":l.seatsavailability} as location,{"locations":p.pickuplocations} as pickuplocations '+
                'from users u '+
                'join l in u.location '+
                'join p in u.setlocation '+
                'where  contains (l.startpoint,"'+source+'")'+'and contains (l.endpoint,"'+destination+'")'+
                ' and u.isowner="true"';                
     }
                
   // console.log(query);
    
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        } 
        
        callback(docs);
    });
}


// var getAllUsers =  function (request,collection,callback) {   
//     var query ='SELECT r.id,r.username FROM root r';
//     client.queryDocuments(collection._self,query).toArray(function (err, docs) {
//         if (err) {
//             throw (err);
//         } 
//         
//         callback(docs);
//     });
// }

var createItem = function (collection, documentDefinition, callback) {
    documentDefinition.completed = false;
    client.createDocument(collection._self, documentDefinition, function (err, doc) {
        if (err) {
            throw (err);
        }
        
        callback();
    });
}

 
var readOrCreateDatabase = function (callback) {
    client.queryDatabases('SELECT * FROM root r WHERE r.id="' + databaseId + '"').toArray(function (err, results) {
        if (err) {
            // some error occured, rethrow up
            throw (err);
        }
        if (!err && results.length === 0) {
            // no error occured, but there were no results returned 
            // indicating no database exists matching the query            
            client.createDatabase({ id: databaseId }, function (err, createdDatabase) {
                callback(createdDatabase);
            });
        } else {
            // we found a database
            callback(results[0]);
        }
    });
}

// if the collection does not exist for the database provided, create it, else return the collection object
var readOrCreateCollection = function (database, callback) {
    //console.log(collectionId);
    client.queryCollections(database._self, 'SELECT * FROM root r WHERE r.id="' + collectionId + '"').toArray(function (err, results) {
        if (err) {
            // some error occured, rethrow up
            throw (err);
        }           
        if (!err && results.length === 0) {
            // no error occured, but there were no results returned 
            //indicating no collection exists in the provided database matching the query
            client.createCollection(database._self, { id: collectionId }, function (err, createdCollection) {
                callback(createdCollection);
            });
        } else {
            // we found a collection
            callback(results[0]);
        }
    });
}

 module.exports = router;
