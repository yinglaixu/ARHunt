/// <reference types="@argonjs/argon" />
/// <reference types="three"/>
/// <reference types="dat-gui"/>
// set up Argon
var app = Argon.init();

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// set up THREE.  Create a scene, a perspective camera and an object
// for the gvuBrochure target.  Do not add the gvuBrochure target content to the scene yet
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var gvuBrochureObject = new THREE.Object3D();
// the object to put key into
var keyTargetObject = new THREE.Object3D();
scene.add(camera);
// variable for the dat.GUI() instance
var gui;

// add chestModel
var chestModel = new THREE.Object3D();
// add keyModel
var keyModel = new THREE.Object3D();
// level of view access for objects
var sightLevel = 0;


gvuBrochureObject.add(chestModel);

// put key object into keytargetobject
keyTargetObject.add(keyModel);

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
// var mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
// mouseHelper.visible = false;
// scene.add(mouseHelper);
window.addEventListener('load', init);
function init() {
    loadLeePerrySmith();
}
// a temporary variable to hold the world inverse matrix.  Used to move values between
// scene (world) coordinates and the chestModel coordinates, to make this demo work 
// when the head is not attached to the world
var invWorld = new THREE.Matrix4();
function checkIntersection() {
    if (!mesh)
        return;
    // make sure everything is updated
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects([mesh]);
    if (intersects.length > 0) {
        // get the transform from the world object back to the root of the scene
        invWorld.getInverse(chestModel.matrixWorld);
        // need to move the point into "world" object instead of global scene coordinates
        var p = intersects[0].point;
        mouseHelper.position.copy(p);
        intersection.point.copy(p);
        var n = intersects[0].face.normal.clone();
        // the normal is in mesh coords, need it to be in world coords
        n.transformDirection(mesh.matrixWorld);
        intersection.normal.copy(intersects[0].face.normal);
        n.multiplyScalar(.010);
        n.add(intersects[0].point);
        mouseHelper.lookAt(n);
        line.geometry.vertices[0].copy(intersection.point);
        line.geometry.vertices[1].copy(n);
        // move line coordinates to the chestModel object coordinates, from the world
        line.geometry.vertices[0].applyMatrix4(invWorld);
        line.geometry.vertices[1].applyMatrix4(invWorld);
        line.geometry.verticesNeedUpdate = true;
        intersection.intersects = true;
    }
    else {
        intersection.intersects = false;
    }
}

function loadLeePerrySmith() {
    
    //model
        var onProgress = function ( xhr ) {
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log( Math.round(percentComplete, 2) + '% downloaded' );
            }
        };
        var onError = function ( xhr ) { };

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
                chestModel.scale.set(0.05, 0.05, 0.05);
            }, onProgress, onError );
        });

        // load key model
        var keyLoader = new THREE.MTLLoader();
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
                keyModel.scale.set(0.05, 0.05, 0.05);
            }, onProgress, onError );
        });

}

// tell argon to initialize vuforia for our app, using our license information.
app.vuforia.init({

    encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=V8Kd\n-----END PGP MESSAGE-----\n"
}).then(function (api) {
    // the vuforia API is ready, so we can start using it.
    // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
    // in the web directory, even though we just provide the .xml file url here 
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
            var gvuBrochureEntity = app.context.subscribeToEntityById(trackables['parrots'].id);
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
                }
                // when the target is first seen after not being seen, the 
                // status is FOUND.  Add the gvuBrochureObject content to the target.
                // when the target is first lost after being seen, the status 
                // is LOST.  Here, we remove the gvuBrochureObject, removing all the
                // content attached to the target from the world.
                if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND & sightLevel >= 1) {
                    scene.add(gvuBrochureObject);
                    chestModel.position.set(0, 0, .08);
                }
                else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                    scene.remove(gvuBrochureObject);
                }
            });
        });
        // activate the dataset.
        api.objectTracker.activateDataSet(dataSet);
    });

    // for the key
    api.objectTracker.createDataSet("../resources/datasets/Balloon.xml").then(function (dataSet) {
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
            var keyTargetEntity = app.context.subscribeToEntityById(trackables['balloon'].id);
            // the updateEvent is called each time the 3D world should be
            // rendered, before the renderEvent.  The state of your application
            // should be updated here.
            app.context.updateEvent.addEventListener(function () {
                // get the pose (in local coordinates) of the gvuBrochure target
                var keyTargetPose = app.context.getEntityPose(keyTargetEntity);
                // if the pose is known the target is visible, so set the
                // THREE object to it's location and orientation
                if (keyTargetPose.poseStatus & Argon.PoseStatus.KNOWN) {
                    keyTargetObject.position.copy(keyTargetPose.position);
                    keyTargetObject.quaternion.copy(keyTargetPose.orientation);
                }
                // when the target is first seen after not being seen, the 
                // status is FOUND.  Add the gvuBrochureObject content to the target.
                // when the target is first lost after being seen, the status 
                // is LOST.  Here, we remove the gvuBrochureObject, removing all the
                // content attached to the target from the world.
                if (keyTargetPose.poseStatus & Argon.PoseStatus.FOUND) {
                    scene.add(keyTargetObject);
                    keyModel.position.set(0, 0, .08);
                    sightLevel++;
                }
                else if (keyTargetPose.poseStatus & Argon.PoseStatus.LOST) {
                    scene.remove(keyTargetObject);
                }
            });
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
