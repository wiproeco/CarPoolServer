 
 // import the modules we will use
var DocumentDBClient = require('documentdb').DocumentClient;
var nodemailer = require('nodemailer');
var nconf = require('nconf');
var uuid = require('node-uuid');

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
 

 router.get('/getridedetails/:userid/:rideid',function(request, response, next){  
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                getrideDetails(request,collection, function (docs) {  
                          
               response.json(docs);              
            });    
        });
     });
 });
 
 
 router.get('/getallridedetails/:userid',function(request, response, next){  
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                getAllRideDetails(request,collection, function (docs) {  
                          
               response.json(docs);              
            });    
        });
     });
 });
 
 var getrideDetails = function(request,collection,callback){ 
  
  var query ='SELECT u.rides,u.userName,u.carNo,r.startpoint,r.endpoint,r.seatsavailable FROM users u join r in u.rides WHERE u.id="'+request.params.userid+'" and r.rideid="'+request.params.rideid+'"';   
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }     
          
        callback(docs);
    });
}

var getAllRideDetails = function(request,collection,callback){  
  var query ='SELECT u.id,u.userName,u.rides FROM users u WHERE u.id="'+request.params.userid+'"';
//    console.log(query);
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }     
         
        callback(docs);
    });
}
 
 
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
                // console.log(carOwnerDocument);
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
                                    //    console.log("update successful");
                                   }
                            });
                    }    
                    }          
                }
            });    
        });
     });
   
 }); 
      
 
 
 router.post('/joinride',function(request, response, next) {   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {   
            joinARide(request,collection, function (docs) {                                 
                var carOwnerDocument =  docs;              
                if(carOwnerDocument != undefined){
              
                  if(carOwnerDocument[0].rides != undefined)     {            
                                                                  
                    for(var i=0; i< carOwnerDocument[0].rides.length; i++){
                        if( carOwnerDocument[0].rides[i].rideid== request.body.rideid)
                        {
                          var currentRide = carOwnerDocument[0].rides[i];                                                                                                               
                          var passengerDetails={ "userName" : null, "status" : null,"boardingid":null,"userId":null };                          
                         
                          passengerDetails.userName =  request.body.userName ;
                          passengerDetails.boardingid = request.body.boardingid;
                          passengerDetails.userId =  request.body.userId;
                          passengerDetails.status = "Pending"; 
                           if(currentRide.passengers == undefined){ 
                                        currentRide.passengers = [];
                           }
                          currentRide.passengers.push(passengerDetails);                                                    
                            
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
                            // console.log("update successful");
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
                       
                            if(request.body.ride.rideid==null){
                                  request.body.ride.rideid=uuid.v1();                                  
                                  docs[0].rides.push(request.body.ride);                                  
                            }
                            else{
                                  for(var i=0;i < docs[0].rides.length;i++)
                                  {
                                     if(request.body.ride.rideid==docs[0].rides[i].rideid)
                                     {                                        
                                        docs[0].rides[i]=request.body.ride;
                                     }
                                    }
                                }
                                                     
                            var docLink='dbs/' + databaseId + '/colls/' + collectionId + '/docs/'+docs[0].id;
                            client.replaceDocument(docLink, docs[0], function (err, updated) {
                      });                   
                    }                
               });
             }
    });
    });
    });
      
   var checkitemforlocation = function(request,collection,callback){ 
  
   var query ='SELECT * FROM user r WHERE r.id="'+request.body.userid+'"';   
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }      
           
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
    var query ='SELECT r.id,r.isowner FROM root r WHERE r.email="'+request.params.email+'" and r.password="'+request.params.password+'"'
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
    var query = 'select * from root r where r.id="'+request.body.carownerId+'"';
 client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        }      
             
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
  /* var query= 'SELECT s.address,s.lat,s.lng,u.ride u.id,l.startpoint,l.endpoint,l.endlat,l.endlng'+' from users u'+' join l in u.location '+' join s in u.pickuplocations '+
    ' where contains  (s.address, "'+destination+'")';*/
    var query ='SELECT u.id,r.rideid,b.lat,b.lng,b.address,r.startdatetime,r.enddatetime from  users u '+
               'join r in u.rides join b in  r.boardingpoints '+
               'where contains  (b.address, "'+destination+'") or contains  (r.address, "'+destination+'")'; 
 
   client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            // console.log(err);
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

//Notification related api calls
router.post('/cancelride',function (request, response) {   
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
                            /* TODO :   DO R&D on conditional docLink-Conditional replacement*/
                            for(var i=0;i<docs[0].rides.length;i++)
                            {
                               if(docs[0].rides[i].ridestatus=="open" && docs[0].rides[i].startdatetime.indexOf(request.body.startdatetime) > -1)
                               {
                                docs[0].rides[i].ridestatus ="close";
                                // console.log(docs[0].rides[i].rideid);
                               }
                            }     
                            
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
    
    
  router.get('/getnotitifications/:userid/:startdatetime', function(request, response, next) {  
      response.header("Access-Control-Allow-Origin", '*');  
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                getNotifications(request,collection, function (docs) {  
                response.json(docs);          
            });    
        });
     });
   
  });    
    
var getNotifications =  function (request,collection,callback) {
    var query =""; 
     
     if (request.params.userid == "undefined" && request.params.startdatetime == "undefined") 
     {
          callback('');
     }
     else
     {
         var userid =request.params.userid;
         var startdatetime =request.params.startdatetime;
        
       query =  'SELECT u.id as ownerid,r.rideid,p.userid as passengerid,p.userName as passengername,p.Status, b.address, b.lat, b.lng, r.startdatetime' +
                ' FROM users u '+ 
                ' join r in u.rides '+ 
                ' join p in r.passengers '+ 
                ' join b in r.boardingpoints '+
                ' where r.ridestatus = "open" and u.id ="'+userid +'"and b.boardingid = p.boardingid and contains(r.startdatetime,"'+startdatetime+'")';           
     }
                
    //console.log(query);
    
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        } 
        
        callback(docs);
    });
}

router.get('/receivenotitifications/:userid', function(request, response, next) { 
    response.header("Access-Control-Allow-Origin", '*');   
    readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {           
                receivenotitifications(request,collection, function (docs) {  
                response.json(docs);          
            });    
        });
     });
   
  });    
    
var receivenotitifications =  function (request,collection,callback) {
    var query =""; 
     
     if (request.params.userid == "undefined")// && request.params.startdatetime == "undefined") 
     {
          callback('');
     }
     else
     {
         var userid =request.params.userid;
         //var startdatetime =request.params.startdatetime;
        
       query =  'SELECT u.id as ownerid,u.userName as ownername, r.rideid,r.startdatetime,p.Status FROM users u join r in u.rides join p in r.passengers ' + 
        'where r.ridestatus = "open" and p.userid = "' + userid +'"';    
        //and contains(r.startdatetime,"'+ startdatetime + '")       
     }
                
    //console.log(query);
    
    client.queryDocuments(collection._self,query).toArray(function (err, docs) {
        if (err) {
            throw (err);
        } 
        
        callback(docs);
    });
}

router.post('/rideconfirmation',function (request, response) { 
      
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
                            /* TODO :   DO R&D on conditional docLink-Conditional replacement*/
                            for(var i=0;i<docs[0].rides.length;i++)
                            {
                               if(docs[0].rides[i].ridestatus=="open" && docs[0].rides[i].rideid == request.body.rideid)
                               {
                                   for(var j=0; j<docs[0].rides[i].passengers.length; j++)
                                   {
                                       if(docs[0].rides[i].passengers[j].userid == request.body.userid && docs[0].rides[i].passengers[j].Status == "pending")
                                       {
                                           docs[0].rides[i].passengers[j].Status = request.body.status;
                                           //console.log(docs[0].rides[i].passengers[j].Status);
                                       }
                                   }
                               }
                            }     
                            
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



 module.exports = router;
