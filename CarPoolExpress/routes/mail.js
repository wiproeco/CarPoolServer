var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');

router.post('/send',function(request,response,next){
    var emailJson=request.body
    //console.log(emailJson.from);
    // var transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         user: 'wiprocarpool@gmail.com',
    //         pass: 'wipro@2015'
    //     
    //         }
    // });
    
    var transporter = nodemailer.createTransport();  
    transporter.sendMail({

        //template: 'email', 
        from:emailJson.from,
        to:emailJson.to,
        subject:emailJson.subject,
        html:emailJson.text,
        generateTextFromHTML:true, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }
        }
    });
    
  //console.log('mail has been sent');
  response.end();
  transporter.close();
});

module.exports = router;
