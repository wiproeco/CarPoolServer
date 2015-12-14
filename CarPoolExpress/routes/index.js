 
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
 

 
  router.get('/listusers', function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                getAllUsers(request,collection, function (items) {  
               var result=[];
               for(var i=0;i<items.length;i++)
               {
                   result.push(items[i]);
               }                    
               response.json(result);              
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
    
    
    router.post('/updatelocation',function (request, response) {       
        
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
                            docs[0].username = "testres";        
                           
                            console.log(request.body.users[0].user);
                            docs[0].location[0].startpoint=request.body.locations[0].startpoint;
                            docs[0].location[0].endpoint=request.body.locations[0].endpoint;  
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
   var users = request.body.user[0]; 
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
   var query ='SELECT * FROM root r WHERE r.id="'+request.body.id+'"';
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


var getAllUsers =  function (request,collection,callback) {   
    var query ='SELECT r.id,r.username FROM root r';
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        } 
        
        callback(docs);
    });
}

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
};

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
};




 module.exports = router;
