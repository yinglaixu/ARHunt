/// <reference types="@argonjs/argon" />
/// <reference types="three"/>
/// <reference types="dat-gui"/>
// set up Argon
var app = Argon.init();
// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.  
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).  
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to 
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// set up THREE.  Create a scene, a perspective camera and an object
// for the gvuBrochure target.  Do not add the gvuBrochure target content to the scene yet
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var gvuBrochureObject = new THREE.Object3D();

var userLocation = new THREE.Object3D();

// the object to put key into
//var keyTargetObject = new THREE.Object3D();

// add text
var argonTextObject = new THREE.Object3D();

var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};

scene.add(userLocation);
scene.add(camera);
// variable for the dat.GUI() instance
var gui;

var keyFound = 0;
var chestOpen = 0;

// add chestModel
var chestModel = new THREE.Object3D();
// add keyModel
var keyModel = new THREE.Object3D();


gvuBrochureObject.add(chestModel);

// put key object into keytargetobject
//keyTargetObject.add(keyModel);

// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true,
    antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// our HUD renderer for 2D screen-fixed content.  This deals with stereo viewing in argon
var hud = new THREE.CSS3DArgonHUD();
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// This application is based on the Decals demo for three.js.  We had to change
// it to deal with the fact that the content is NOT attached to the origin of 
// the scene.  In the original demo, all content was added to the scene, and 
// many of the computations assumed the head was positioned at the origin of 
// the world with the identity orientation. 
// variables for the application 
var mesh, decal;
var line;
var intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3()
};
var mouse = new THREE.Vector2();
var textureLoader = new THREE.TextureLoader();
var decalDiffuse = textureLoader.load('../resources/textures/decal/decal-diffuse.png');
var decalNormal = textureLoader.load('../resources/textures/decal/decal-normal.jpg');
var decalMaterial = new THREE.MeshPhongMaterial({
    specular: 0x444444,
    map: decalDiffuse,
    normalMap: decalNormal,
    normalScale: new THREE.Vector2(1, 1),
    shininess: 30,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    wireframe: false
});
var decals = [];
var p = new THREE.Vector3(0, 0, 0);
var r = new THREE.Vector3(0, 0, 0);
var s = new THREE.Vector3(10, 10, 10);
var up = new THREE.Vector3(0, 1, 0);
var check = new THREE.Vector3(1, 1, 1);
var params = {
    projection: 'normal',
    minScale: 10,
    maxScale: 20,
    rotate: true,
    clear: function () {
        removeDecals();
    }
};
scene.add(new THREE.AmbientLight(0x443333));
var light = new THREE.DirectionalLight(0xffddcc, 1);
light.position.set(1, 0.75, 0.5);
scene.add(light);
var light = new THREE.DirectionalLight(0xccccff, 1);
light.position.set(-1, 0.75, -0.5);
scene.add(light);
var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(), new THREE.Vector3());
// add to the chestModel node, not the scene
line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ linewidth: 4 }));
chestModel.add(line);
// leave mouseHelper in the scene, since it will get positioned/oriented in world coordinates
var raycaster = new THREE.Raycaster();
var mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
mouseHelper.visible = false;
scene.add(mouseHelper);
window.addEventListener('load', init);
function init() {
    loadLeePerrySmith();
    loadText();
    // // Support both mouse and touch.
    // renderer.domElement.addEventListener('mousedown', function (event) {
    //     var x = event.clientX;
    //     var y = event.clientY;
    //     mouse.x = (x / window.innerWidth) * 2 - 1;
    //     mouse.y = -(y / window.innerHeight) * 2 + 1;
    //     checkIntersection();
    //     if (intersection.intersects)
    //         shoot();
    // });
    renderer.domElement.addEventListener('touchstart', function (event) {
        var x = event.changedTouches[0].pageX;
        var y = event.changedTouches[0].pageY;
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        // prevent touches from emiting mouse events 
        //event.preventDefault();
		
		raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( scene.children , true);
        //console.log(scene.children);
		//console.log(intersects);
		if (0 < intersects.length) {

           

			//If key is clicked and not found...
			if(keyModel.parent == scene){
                console.log("click key");
				if(keyFound == 0){

                    console.log("remove key");
					keyFound = 1;
					scene.remove(keyModel);
                    addKeytoInventory();
				}
            }
				
			//If key is clicked and not found...
			if(gvuBrochureObject.parent == scene)
				if(keyFound == 1){
					chestOpen = 1;
					scene.remove(gvuBrochureObject);
                    finishGameNotification();
				}
		}
		
    }, false);
    // renderer.domElement.addEventListener('touchend', function (event) {
    //     var x = event.changedTouches[0].pageX;
    //     var y = event.changedTouches[0].pageY;
    //     mouse.x = (x / window.innerWidth) * 2 - 1;
    //     mouse.y = -(y / window.innerHeight) * 2 + 1;
    //     // only do touches in mono mode
    //     if (monoMode) {
    //         checkIntersection();
    //         if (intersection.intersects)
    //             requestAnimationFrame(shoot);
    //     }
    //     // prevent touches from emiting mouse events
    //     event.preventDefault();
    // });
    // renderer.domElement.addEventListener('touchmove', onTouchMove);


    // renderer.domElement.addEventListener('mousemove', onTouchMove);
    // function onTouchMove(event) {
    //     var x, y;
    //     if (event instanceof TouchEvent) {
    //         x = event.changedTouches[0].pageX;
    //         y = event.changedTouches[0].pageY;
    //     }
    //     else {
    //         x = event.clientX;
    //         y = event.clientY;
    //     }
    //     mouse.x = (x / window.innerWidth) * 2 - 1;
    //     mouse.y = -(y / window.innerHeight) * 2 + 1;
    //     // only do touches in mono mode
    //     if (monoMode) {
    //         checkIntersection();
    //     }
    //     event.preventDefault();
    // }
    // add dat.GUI to the left HUD.  We hid it in stereo viewing, so we don't need to 
    //figure out how to duplicate it.
    // gui = new dat.GUI({ autoPlace: false });
    // hud.hudElements[0].appendChild(gui.domElement);
    // gui.add(params, 'projection', { 'From cam to mesh': 'camera', 'Normal to mesh': 'normal' });
    // gui.add(params, 'minScale', 1, 30);
    // gui.add(params, 'maxScale', 1, 30);
    // gui.add(params, 'rotate');
    // gui.add(params, 'clear');
    // gui.open();
}
// a temporary variable to hold the world inverse matrix.  Used to move values between
// scene (world) coordinates and the chestModel coordinates, to make this demo work 
// when the head is not attached to the world
var invWorld = new THREE.Matrix4();
// function checkIntersection() {
//     if (!mesh){
//         console.log("not mesh");
//         return;
//     }
//     // make sure everything is updated
//     scene.updateMatrixWorld(true);
//     raycaster.setFromCamera(mouse, camera);
//     var intersects = raycaster.intersectObjects([mesh]);
//     if (intersects.length > 0) {
//         // get the transform from the world object back to the root of the scene
//         invWorld.getInverse(chestModel.matrixWorld);
//         // need to move the point into "world" object instead of global scene coordinates
//         var p = intersects[0].point;
//         mouseHelper.position.copy(p);
//         intersection.point.copy(p);
//         var n = intersects[0].face.normal.clone();
//         // the normal is in mesh coords, need it to be in world coords
//         n.transformDirection(mesh.matrixWorld);
//         intersection.normal.copy(intersects[0].face.normal);
//         n.multiplyScalar(.010);
//         n.add(intersects[0].point);
//         mouseHelper.lookAt(n);
//         line.geometry.vertices[0].copy(intersection.point);
//         line.geometry.vertices[1].copy(n);
//         // move line coordinates to the chestModel object coordinates, from the world
//         line.geometry.vertices[0].applyMatrix4(invWorld);
//         line.geometry.vertices[1].applyMatrix4(invWorld);
//         line.geometry.verticesNeedUpdate = true;
//         intersection.intersects = true;
//     }
//     else {
//         intersection.intersects = false;
//     }
// }

function loadLeePerrySmith() {
    //userLocation.add(keytargetobject);
    //model
        var onProgress = function ( xhr ) {
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log( Math.round(percentComplete, 2) + '% downloaded' );
            }
        };
        var onError = function ( xhr ) { };

        THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
        // load chest model
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.load( "../resources/treasure_chest.mtl", function( materials ) {
            materials.preload();    

            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials( materials );
            objLoader.load("../resources/treasure_chest.obj", function ( object ) {
                //object.rotation.y = 180* Math.PI / 180;
                object.scale.x = 1;
                object.scale.y = 1;
                object.scale.z = 1;
                chestModel.add(object);
                chestModel.scale.set(50, 50, 50);
            }, onProgress, onError );

        });

        //load key model
        keyLoader = new THREE.MTLLoader();
        keyLoader.load( "../resources/Key_B_02.mtl", function( materials ) {
            materials.preload();
            var keyobjLoader = new THREE.OBJLoader();
            keyobjLoader.setMaterials( materials );
            keyobjLoader.load("../resources/Key_B_02.obj", function ( object ) {
                //object.rotation.y = 180* Math.PI / 180;
                object.scale.x = 1;
                object.scale.y = 1;
                object.scale.z = 1;
                keyModel.add(object);
                keyModel.scale.set(10, 10, 10);
            }, onProgress, onError );
        });

}

function loadText(){
    argonTextObject.position.z = -0.5;
    
    var loader = new THREE.FontLoader();
    loader.load('../resources/fonts/helvetiker_bold.typeface.js', function (font) {
        var textGeometry = new THREE.TextGeometry("Find the key to open the chest.", {
            font: font,
            size: 40,
            height: 5,
            curveSegments: 3,
            bevelThickness: 2,
            bevelSize: 1,
            bevelEnabled: true
        });
        textGeometry.center();
        var tessellateModifier = new THREE.TessellateModifier(8);
        for (var i = 0; i < 6; i++) {
            tessellateModifier.modify(textGeometry);
        }
        var explodeModifier = new THREE.ExplodeModifier();
        explodeModifier.modify(textGeometry);
        var numFaces = textGeometry.faces.length;
        var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
        var colors = new Float32Array(numFaces * 3 * 3);
        var displacement = new Float32Array(numFaces * 3 * 3);
        var color = new THREE.Color();
        for (var f = 0; f < numFaces; f++) {
            var index = 9 * f;
            var h = 0.07 + 0.1 * Math.random();
            var s = 0.5 + 0.5 * Math.random();
            var l = 0.6 + 0.4 * Math.random();
            color.setHSL(h, s, l);
            var d = 5 + 20 * (0.5 - Math.random());
            for (var i = 0; i < 3; i++) {
                colors[index + (3 * i)] = color.r;
                colors[index + (3 * i) + 1] = color.g;
                colors[index + (3 * i) + 2] = color.b;
                displacement[index + (3 * i)] = d;
                displacement[index + (3 * i) + 1] = d;
                displacement[index + (3 * i) + 2] = d;
            }
        }
        bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
        var shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
            fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
        });
        var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
        argonTextObject.add(textMesh);
        argonTextObject.scale.set(0.001, 0.001, 0.001);
        argonTextObject.position.z = -0.50;
        // add an argon updateEvent listener to slowly change the text over time.
        // we don't have to pack all our logic into one listener.
        app.context.updateEvent.addEventListener(function () {
            //commented the animation when updating
            //uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
        });
    });
}


// add something when clicking the object, like the picture 
function addKeytoInventory(){
    document.getElementById("description").innerHTML = 
    "<div><br><h2>Your inventory</h2><img src = '../resources/key_pic.png'></img><p>You can open the chest with the key.</p></div>";
}

// congratulation when opening the key
function finishGameNotification(){
    document.getElementById("description").innerHTML = 
    "<div><br><h2>congratulations!</h2><p> You have won!! </p></div>";
}
// function shoot() {
//     console.log("shoot");
//     // if (params.projection == 'camera') {
//     //     var dir = headModel.getWorldPosition();
//     //     var camPos = camera.getWorldPosition();
//     //     dir.sub(camPos);
//     //     p = intersection.point;
//     //     var m = new THREE.Matrix4();
//     //     var c = dir.clone();
//     //     c.negate();
//     //     c.multiplyScalar(10);
//     //     c.add(p);
//     //     m.lookAt(p, c, up);
//     //     // put the rotation in headModel object coordinates
//     //     m.multiplyMatrices(invWorld, m);
//     //     m = m.extractRotation(m);
//     //     var dummy = new THREE.Object3D();
//     //     dummy.rotation.setFromRotationMatrix(m);
//     //     r.set(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z);
//     // }
//     // else {
//     //     p = intersection.point;
//     //     var m = new THREE.Matrix4();
//     //     // get the mouseHelper orientation in headModel coordinates
//     //     m.multiplyMatrices(invWorld, mouseHelper.matrixWorld);
//     //     var dummy = new THREE.Object3D();
//     //     dummy.rotation.setFromRotationMatrix(m);
//     //     r.set(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z);
//     // }
//     // // move p to headModel object coordinates from world
//     // p = p.clone();
//     // p.applyMatrix4(invWorld);
//     // var scale = (params.minScale + Math.random() * (params.maxScale - params.minScale)) / 500.0;
//     // s.set(scale, scale, scale);
//     // if (params.rotate)
//     //     r.z = Math.random() * 2 * Math.PI;
//     // var material = decalMaterial.clone();
//     // material.color.setHex(Math.random() * 0xffffff);
//     // // mesh is in headModel coordinates, to p & r have also been moved into headModel coords
//     // var m2 = new THREE.Mesh(new THREE.DecalGeometry(mesh, p, r, s, false), material);
//     // decals.push(m2);
//     // headModel.add(m2);
// }
// function removeDecals() {
//     decals.forEach(function (d) {
//         headModel.remove(d);
//         d = null;
//     });
//     decals = [];
// }
// function mergeDecals() {
//     var merge = {};
//     decals.forEach(function (decal) {
//         var uuid = decal.material.uuid;
//         var d = merge[uuid] = merge[uuid] || {};
//         d.material = d.material || decal.material;
//         d.geometry = d.geometry || new THREE.Geometry();
//         d.geometry.merge(decal.geometry, decal.matrix);
//     });
//     removeDecals();
//     for (var key in merge) {
//         var d = merge[key];
//         var mesh = new THREE.Mesh(d.geometry, d.material);
//         headModel.add(mesh);
//         decals.push(mesh);
//     }
// }
// tell argon to initialize vuforia for our app, using our license information.
app.vuforia.init({
 
    //encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=xEDl\n-----END PGP MESSAGE-----\n"
    encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=V8Kd\n-----END PGP MESSAGE-----\n"
}).then(function (api) {
    // the vuforia API is ready, so we can start using it.
    // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
    // in the web directory, even though we just provide the .xml file url here 

    // for the chest
    api.objectTracker.createDataSet("../resources/datasets/ARHunt_OT.xml").then(function (dataSet) {
        // the data set has been succesfully downloaded
        // tell vuforia to load the dataset.  
        dataSet.load().then(function () {
            // when it is loaded, we retrieve a list of trackables defined in the
            // dataset and set up the content for the target
            console.log("chest dataset load");
            var trackables = dataSet.getTrackables();
            // tell argon we want to track a specific trackable.  Each trackable
            // has a Cesium entity associated with it, and is expressed in a 
            // coordinate frame relative to the camera.  Because they are Cesium
            // entities, we can ask for their pose in any coordinate frame we know
            // about.
            var gvuBrochureEntity = app.context.subscribeToEntityById(trackables['Narutoe'].id);
             console.log("chest dataset get");
            // the updateEvent is called each time the 3D world should be
            // rendered, before the renderEvent.  The state of your application
            // should be updated here.
            app.context.updateEvent.addEventListener(function () {
                // get the pose (in local coordinates) of the gvuBrochure target
                var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                // if the pose is known the target is visible, so set the
                // THREE object to it's location and orientation
                if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                    
                    gvuBrochureObject.position.copy(gvuBrochurePose.position);
                    gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                    //scene.add(gvuBrochureObject);
                    //chestModel.position.set(0, 0, 0);
                    //console.log("chest known");
                }
                // when the target is first seen after not being seen, the 
                // status is FOUND.  Add the gvuBrochureObject content to the target.
                // when the target is first lost after being seen, the status 
                // is LOST.  Here, we remove the gvuBrochureObject, removing all the
                // content attached to the target from the world.
                if ((gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) && chestOpen == 0) {
                    //console.log("chest found");
                    scene.add(gvuBrochureObject);
                    //chestModel.position.set(0, 0, 0);
                }
                else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                    //console.log("chest lost");
                    scene.remove(gvuBrochureObject);
                }
            });
        });
        // activate the dataset.
        api.objectTracker.activateDataSet(dataSet);
    });

    // for the key
    api.objectTracker.createDataSet("../resources/datasets/ARHunt_OT.xml").then(function (dataSet) {
        // the data set has been succesfully downloaded
        // tell vuforia to load the dataset.  
        dataSet.load().then(function () {
            console.log("key dataset load");
            // when it is loaded, we retrieve a list of trackables defined in the
            // dataset and set up the content for the target
            var trackables = dataSet.getTrackables();
            // tell argon we want to track a specific trackable.  Each trackable
            // has a Cesium entity associated with it, and is expressed in a 
            // coordinate frame relative to the camera.  Because they are Cesium
            // entities, we can ask for their pose in any coordinate frame we know
            // about.
            var keyTargetEntity = app.context.subscribeToEntityById(trackables['yogabot'].id);
             console.log("key dataset get");
            // the updateEvent is called each time the 3D world should be
            // rendered, before the renderEvent.  The state of your application
            // should be updated here.
            app.context.updateEvent.addEventListener(function () {
                // get the pose (in local coordinates) of the gvuBrochure target
                var keyTargetPose = app.context.getEntityPose(keyTargetEntity);
                // if the pose is known the target is visible, so set the
                // THREE object to it's location and orientation
                if (keyTargetPose.poseStatus & Argon.PoseStatus.KNOWN) {
                    
                    keyModel.position.copy(keyTargetPose.position);
                    keyModel.quaternion.copy(keyTargetPose.orientation);
                    //scene.add(keyTargetObject);
                    //keyModel.position.set(0, 0, 0);
                    //console.log("key known");
                }
                // when the target is first seen after not being seen, the 
                // status is FOUND.  Add the gvuBrochureObject content to the target.
                // when the target is first lost after being seen, the status 
                // is LOST.  Here, we remove the gvuBrochureObject, removing all the
                // content attached to the target from the world.
                if ((keyTargetPose.poseStatus & Argon.PoseStatus.FOUND) && keyFound == 0) {
                    console.log(keyFound);
                    scene.add(keyModel);
                    //keyModel.position.set(0, 0, 0);
                }
                else if (keyTargetPose.poseStatus & Argon.PoseStatus.LOST) {
                    //console.log("key lost");
                     //userLocation.remove(keyTargetObject);
                    scene.remove(keyModel);
                }
            });
        });
        // activate the dataset.
        api.objectTracker.activateDataSet(dataSet);
    });

    // for the text
    api.objectTracker.createDataSet("../resources/datasets/ARHunt.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.  
            dataSet.load().then(function () {
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                var trackables = dataSet.getTrackables();
                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a 
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                var textTargetEntity = app.context.subscribeToEntityById(trackables["openhouseposter"].id);
                // create a THREE object to put on the trackable
                var textTargetObject = new THREE.Object3D;
                scene.add(textTargetObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var textTargetPose = app.context.getEntityPose(textTargetEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (textTargetPose.poseStatus & Argon.PoseStatus.KNOWN) {
                        textTargetObject.position.copy(textTargetPose.position);
                        textTargetObject.quaternion.copy(textTargetPose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (textTargetPose.poseStatus & Argon.PoseStatus.FOUND) {
                        scene.add(textTargetObject);
                        textTargetObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    }
                    else if (textTargetPose.poseStatus & Argon.PoseStatus.LOST) {
                        scene.remove(textTargetObject);
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });

}).catch(function () {
    // if we're not running in Argon, we'll position the headModel in front of the camera
    // in the world, so we see something and can test
    if (app.session.isRealityManager) {
        app.context.updateEvent.addEventListener(function () {
            var userPose = app.context.getEntityPose(app.context.user);
            if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
                // place chestModel to test
                chestModel.position.copy(userPose.position);
                chestModel.quaternion.copy(userPose.orientation);
                chestModel.translateZ(-1);
                chestModel.rotateX(-Math.PI / 2);
                // place key Model to test
                keyModel.position.copy(userPose.position);
                keyModel.quaternion.copy(userPose.orientation);
                keyModel.translateZ(-0.5);
                keyModel.rotateX(-Math.PI / 2);
            }
            if (userPose.poseStatus & Argon.PoseStatus.FOUND) {
                scene.add(chestModel);
                scene.add(keyModel);
            }
        });
    }
});
// make a note of if we're in mono or stereo mode, for use in the touch callbacks
var monoMode = false;
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera. 
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height);
        // set the webGL rendering parameters and render this view
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        if (monoMode) {
            // adjust the hud, but only in mono mode. 
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});
