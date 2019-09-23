const express = require('express')
const bodyParser = require('body-parser')
const https = require("https");
let port = process.env.PORT || 8080;

const app = express()
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


app.use(function (err, req, res, next) {
  res.status(500).send('Something broke!')
})

app.use(bodyParser.json());

app.post('/upload',(req,res)=>{
	const imgUrl = req.body;
	let data = '';
	req.on('data', function(chunk) { 
    	data += chunk;
  	});
	const token = req.query.token;
	const imgName = req.query.name;
	const albumId = req.query.albumId;
	if(!token){
		console.log('unauthorized');
		return res.status(401).send('Not authorized');
	}

	const uploadFirst = (buffer)=>{
		// const imgName = imgUrl.split("/").pop();
		const options = {
		    host: 'photoslibrary.googleapis.com',
		    path: '/v1/uploads',
		    method: 'POST',
		    headers: {
		        "Content-Type": "application/octet-stream",
		        "Authorization": "Bearer "+token,
		        "X-Goog-Upload-File-Name": imgName,
		        "X-Goog-Upload-Protocol": "raw"
		    }
		};
		return new Promise((resolve,reject)=>{
			const post_req = https.request(options, (res1, err) => {
			    let data = '';
			    if (res1.statusCode !== 200 || err) {
			    	console.log('On google server upload: '+res1.statusCode);
			    	res1.setEncoding('utf-8');
			    res1.on('data', function(chunk) {
			    	data += chunk;
			    })
			    .on('end',function(){
			    	console.log(data);
			    });
			    	return res.sendStatus(res1.statusCode);
			        reject(res1.statusCode);
			    }
			    res1.setEncoding('utf-8');
			    res1.on('data', function(chunk) {
			    	data += chunk;
			    })
			    .on('end',function(){
			    	resolve(data);
			    });
			})
			post_req.write(buffer);
			post_req.end()			
		})

	}

	const uploadSecond = (buffer)=>{
		const options = {
		    host: 'photoslibrary.googleapis.com',
		    path: '/v1/mediaItems:batchCreate',
		    method: 'POST',
		    headers: {
		        "Content-Type": "application/json",
		        "Authorization": "Bearer "+token,
		    }
		};
		const body = JSON.stringify({
		  "albumId":albumId,
		  "newMediaItems": [
		    {
		      "description": "caret image",
		      "simpleMediaItem": {
		        "uploadToken": buffer
		      }
		    }
		  ]
		})
		return  new Promise((resolve,reject)=>{
			const post_req = https.request(options, (res1, err) => {
			    if (err) {
			    	console.log('On photos upload: '+res1.statusCode);
			        reject(err);
			    }
			    res1.setEncoding('utf-8');
			    let data = '';
			    res1.on('data', function(chunk) {
			    	data+=(chunk);
			    })
			    .on('end',function(){
			    	resolve(JSON.parse(data));
			    });
			})
			post_req.write(body);
			post_req.end()
		})

	}

	req.on('end', function() {
		req.rawBody = data;
		const buffer = Buffer.from(data, 'base64');
		uploadFirst(buffer)
		.then(buffer2=>{
			return uploadSecond(buffer2)
		})
		.then(response=>{
			const date = new Date();
			console.log('uploaded '+date.toLocaleString('en-IN'));
			res.send(response);
		})
		.catch(err=>{
			const date = new Date();
			console.log('Something went wrong '+date.toLocaleString('en-IN'));
			res.status(500).send('Something went wrong');
		})
	});

})


app.post('/upload2',function(req,res){
	console.log(req.body);
	res.sendStatus(200);
})

app.get('/upload2',function(req,res){
	console.log(req.body);
	res.sendStatus(200);
})