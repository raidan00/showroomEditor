const express = require("express");
const path = require("path");
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
app.use(fileUpload());
app.use(express.json());
app.use((req, res, next) =>{
	if(req.url.endsWith("/index.html")){
		res.sendFile('src/index.html', { root: __dirname });
	}else if (req.url.endsWith("/three.js")){
		res.sendFile('src/three.js', { root: __dirname });
	}else if (req.url.endsWith("/editor.js")){
		res.sendFile('src/editor.js', { root: __dirname });
	}else if (req.url.endsWith("/editor.div")){
		res.sendFile('src/editor.div', { root: __dirname });
	}else if (req.url.endsWith("/editor.css")){
		res.sendFile('src/editor.css', { root: __dirname });
	}else{
		next();
	}
});
app.post('/*/setPanorama', function(req, res) {
	let newJson = JSON.parse(req.body.newJson);
	let oldPath = path.join(__dirname, "static", newJson.name, req.header('oldPanoramaImg'));
	let newPath = path.join(__dirname, "static", newJson.name, req.header('newPanoramaImg'));
	fs.unlink(oldPath, ()=>{});
	fs.writeFile(newPath, req.files.file.data, () => {});
	fs.writeFile(path.join(__dirname, "static", newJson.name, "globalInfo.json" ), req.body.newJson, () => {});
	res.send('File uploaded!');
});
app.post('/*/saveGlobalInfo', function(req, res) {
	fs.writeFile(path.join(__dirname, "static", req.body.name, "globalInfo.json" ), JSON.stringify(req.body, null, "\t"), () => {});
	res.send('File uploaded!');
});
app.use(express.static(path.join(__dirname, "static")));
app.listen(8000);
