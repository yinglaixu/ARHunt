/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon
var app = Argon.init();
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);
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
// create a bit of animated 3D text that says "argon.js" to display 
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};
var box = new THREE.Object3D();
box.position.z = -0.50;
userLocation.add(box);

// var loader = new THREE.FontLoader();
// loader.load('../resources/fonts/helvetiker_bold.typeface.js', function (font) {
//     var textGeometry = new THREE.TextGeometry("argon.js", {
//         font: font,
//         size: 40,
//         height: 5,
//         curveSegments: 3,
//         bevelThickness: 2,
//         bevelSize: 1,
//         bevelEnabled: true
//     });
//     textGeometry.center();
//     var tessellateModifier = new THREE.TessellateModifier(8);
//     for (var i = 0; i < 6; i++) {
//         tessellateModifier.modify(textGeometry);
//     }
//     var explodeModifier = new THREE.ExplodeModifier();
//     explodeModifier.modify(textGeometry);
//     var numFaces = textGeometry.faces.length;
//     var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
//     var colors = new Float32Array(numFaces * 3 * 3);
//     var displacement = new Float32Array(numFaces * 3 * 3);
//     var color = new THREE.Color();
//     for (var f = 0; f < numFaces; f++) {
//         var index = 9 * f;
//         var h = 0.07 + 0.1 * Math.random();
//         var s = 0.5 + 0.5 * Math.random();
//         var l = 0.6 + 0.4 * Math.random();
//         color.setHSL(h, s, l);
//         var d = 5 + 20 * (0.5 - Math.random());
//         for (var i = 0; i < 3; i++) {
//             colors[index + (3 * i)] = color.r;
//             colors[index + (3 * i) + 1] = color.g;
//             colors[index + (3 * i) + 2] = color.b;
//             displacement[index + (3 * i)] = d;
//             displacement[index + (3 * i) + 1] = d;
//             displacement[index + (3 * i) + 2] = d;
//         }
//     }
//     bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
//     bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
//     var shaderMaterial = new THREE.ShaderMaterial({
//         uniforms: uniforms,
//         vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
//         fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
//     });
//     var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
//     box.add(textMesh);
//     box.scale.set(0.001, 0.001, 0.001);
//     // add an argon updateEvent listener to slowly change the text over time.
//     // we don't have to pack all our logic into one listener.
//     app.context.updateEvent.addEventListener(function () {
//         uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
//     });
// });

//model
var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
};
var onError = function ( xhr ) { };

var mtlLoader = new THREE.MTLLoader();
mtlLoader.load( "../app/dataset/treasure_chest.mtl", function( materials ) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.load("../app/dataset/treasure_chest.obj", function ( object ) {
        //object.rotation.y = 180* Math.PI / 180;
        object.scale.x = 1;
        object.scale.y = 1;
        object.scale.z = 1;
        box.add(object);
        box.scale.set(0.5, 0.5, 0.5);
    }, onProgress, onError );
});


app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        //encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nCDjUbY1FxwlVJ4UZ7lz+8jWHO5jYY99adPoATpUaWYxm9oPxz/QR4kvgvLjl\n9Ti8379Y8qihzqsRmf6YLYyggknlt9Uyl2HjA+1zcwbDnb3I6g/XjTFUPy1D\nxZqqSEuCNDLh7m1+GDA3KXQnLIqOdcxOVzyFCDtKI9c6b0D0ezNkxUjgkoIp\nmxSSLDjzmHuPLsQVwqxP4KNU1gT7mXTnhlhsG2Vll/WZD+tuzGK8h9anf6/p\n4pCk61Dhj1hmb9msTaK4FGhmBMtJ6kQ4SzGOfFKG5IElAHidYgd0iz7AqEzX\nGttDkcHGM9iPIYUBY2r/538M/kxeVx5fBiWEkmWz5FMzqPRs3GZWYiAb2tnp\nWSDXW3B1mwznwcCkyUP6OP/c6FFmb6Rag/ZaItVAvVjmA7tXICLJPhYIs9hE\nI6zJSVZ81YtKg9Nb6Rx49qf18pQ1SWZNGrZrWaTJTLu4cu4c5v/czY5kyT0Y\n8RqNUlI5hwWU8G9LpJ5jv8dssrgcweTG/PEbCkzqz0R6W6VgDUyqo6WSGgoS\nB9or791lGcDazNT6CJ4/2Z1wBd4BSHkhSwfcPovGOleZFE24gLiG6puHyVjk\nWEIir2WXzhypwLkG/dn+ZJW1ezOvTb4gVVILHrWhNh8=\n=LoZg\n-----END PGP MESSAGE-----"
        //encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n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\nkndSsQ/Hw7SQDGk+FXHcSc6h\n=q90+\n-----END PGP MESSAGE-----"
        //encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nKgP+aMJxwk9dXd8=\n=NIAM\n-----END PGP MESSAGE-----"
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=xEDl\n-----END PGP MESSAGE-----\n"
    }).then(function (api) {
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here 
        console.log("then hello");
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
                var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["parrots"].id);
                // create a THREE object to put on the trackable
                var gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        gvuBrochureObject.add(box);
                        box.position.z = 0;
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        box.position.z = -0.50;
                        userLocation.add(box);
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function (err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});
// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    stats.update();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode    
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
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});
