Promise.all([
	fetch(`./editor.css`)
	.then(response => response.text())
	.then(response => {
		let css = document.createElement('style');
		css.innerHTML = response;
		document.head.appendChild(css);
	}),
	fetch(`./editor.div`)
	.then(response => response.text())
	.then(response => {
		let div = document.createElement("div");
		div.id = "editorDiv";
		div.innerHTML = response;
		document.body.appendChild(div);
	})
])
.then((values) => {
	updateEditor();
});
let geometry = new THREE.PlaneGeometry( 1000, 1000, 32, 32 );
let material = new THREE.MeshBasicMaterial( { color: 0xFF0000 } );
material.wireframe = true;
let mesh = new THREE.Mesh( geometry, material );
mesh.position.x = 0;
mesh.position.z = 0;
mesh.position.y = -110;
mesh.lookAt( 0, 100, 0 );
mesh.addTeleport = true;
function showSpotPlane(el){
	scene.add( mesh );
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	gl_container.addEventListener("click", clickF);
	function clickF(e){
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		raycaster.setFromCamera( mouse, camera );
		const intersects = raycaster.intersectObjects( scene.children );
		for ( let i = 0; i < intersects.length; i ++ ) {
			if(intersects[i].object.addTeleport){
				let teleport = globalInfo.views[activeView].teleports[el.name];
				teleport.x = intersects[i].point.x;
				teleport.z = intersects[i].point.z;
				teleport.y = -110;
			}
		}
		gl_container.removeEventListener("click", clickF);
		scene.remove( mesh );
		updateTeleports();
		saveGlobalInfo();
	}
}
let activeTeleportName;
function setTeleportView(el){
	activeTeleportName = el.name
}
function renameTeleport(el){
	let newName = document.getElementById("globalInput").value;
	let oldName = el.name;
	if(!newName)return;
	if(globalInfo.views[activeView].teleports[newName])return;
	let teleport = globalInfo.views[activeView].teleports[oldName];
	delete globalInfo.views[activeView].teleports[oldName];
	globalInfo.views[activeView].teleports[newName] = teleport;
	updateTeleports();
	updateEditor();
	saveGlobalInfo();
}
function renameView(el, event){
	event.stopPropagation();
	let newName = document.getElementById("globalInput").value;
	let oldName = el.name;
	if(!newName)return;
	if(globalInfo.views[newName])return;
	if(activeView == oldName) activeView = newName;
	if(globalInfo.firstView == oldName)globalInfo.firstView = newName;
	let view = globalInfo.views[oldName];
	delete globalInfo.views[oldName];
	globalInfo.views[newName] = view;
	for(let loopViewName in globalInfo.views){
		let loopView = globalInfo.views[loopViewName];
		for(let loopTelName in loopView.teleports){
			loopTeleport = loopView.teleports[loopTelName];
			if(loopTeleport.view == oldName){
				loopTeleport.view = newName;
			}
		}
	}
	updateTeleports();
	updateEditor();
	saveGlobalInfo();
}
function updateEditor(){
	document.getElementById("views").innerHTML = ""
	for(let name in globalInfo.views){
		let el = document.createElement("div");
		el.innerHTML = `
			${name}
			<input class="click" type="button" name="${name}" value="rename" onclick="renameView(this, event)">
		`;
		el.classList.add("element");
		if(name == activeView) el.style.backgroundColor = "#f3511c8c";
		el.onclick = () => {
			globalInfo.views[activeView].teleports[activeTeleportName].view = name;
			saveGlobalInfo();
		}
		document.getElementById("views").appendChild(el);
	}
	document.getElementById("teleports").innerHTML = ""
	for(let name in globalInfo.views[activeView].teleports){
		let json = globalInfo.views[activeView].teleports[name];
		let el = document.createElement("div");
		el.innerHTML = `
			${name}
			<input class="click" type="button" name="${name}" value="spot" onclick="showSpotPlane(this)">
			<input class="click" type="button" name="${name}" value="view" onclick="setTeleportView(this)">
			<input class="click" type="button" name="${name}" value="rename" onclick="renameTeleport(this)">
		`;
		el.name = name;
		el.classList.add("element");
		document.getElementById("teleports").appendChild(el);
	}
}
function jsonForSend(){
	let forSend = JSON.parse(JSON.stringify(globalInfo));
	for(let name in forSend.views){
		delete forSend.views[name].panoramaT;
	}
	return forSend;
}
function changePanorama(){
	var input = document.querySelector("#setPanorama")
	const reader = new FileReader();
	reader.addEventListener( "load", function ( event ) {
		if(globalInfo.views[activeView].panoramaT == undefined){
			globalInfo.views[activeView].panoramaT = new THREE.Texture();
			globalInfo.views[activeView].panoramaT.image = document.createElement('img');
			panoramaMehs.material.map = globalInfo.views[activeView].panoramaT;
			panoramaMehs.material.needsUpdate = true;
		}
		globalInfo.views[activeView].panoramaT.image.src = event.target.result;
		globalInfo.views[activeView].panoramaT.needsUpdate = true;
	}, false );
	reader.readAsDataURL(input.files[0]);
	let oldPanoramaImg = globalInfo.views[activeView].panoramaImg;
	globalInfo.views[activeView].panoramaImg = input.files[0].name;
	var data = new FormData()
	data.append('file', input.files[0])
	data.append('newJson', JSON.stringify(jsonForSend(), null, "\t"));
	fetch('./setPanorama', {
		method: 'POST',
		body: data,
		headers: {
			"oldPanoramaImg": oldPanoramaImg,
			"newPanoramaImg": input.files[0].name,
		},
	})
}
function saveGlobalInfo(){
	fetch("./saveGlobalInfo", {
		method: "POST",
		body: JSON.stringify(jsonForSend(), null, "\t"),
		headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
		},
	})
}
function addView(){
	globalInfo.views[Math.round(Math.random()*1000000000)] = {
		teleports: {}
	};
	updateEditor();
	saveGlobalInfo();
}
function addTeleport(){
	globalInfo.views[activeView].teleports[Math.round(Math.random()*1000000000)] = {};
	updateEditor();
	saveGlobalInfo();
}
