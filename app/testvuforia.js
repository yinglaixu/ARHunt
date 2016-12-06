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

// // model
// var onProgress = function ( xhr ) {
//     if ( xhr.lengthComputable ) {
//         var percentComplete = xhr.loaded / xhr.total * 100;
//         console.log( Math.round(percentComplete, 2) + '% downloaded' );
//     }
// };
// var onError = function ( xhr ) { };

// var mtlLoader = new THREE.MTLLoader();
// mtlLoader.load( "dataset/treasure_chest.mtl", function( materials ) {
//     materials.preload();
//     var objLoader = new THREE.OBJLoader();
//     objLoader.setMaterials( materials );
//     objLoader.load("dataset/treasure_chest.obj", function ( object ) {
//         object.rotation.y = 180* Math.PI / 180;
//         object.scale.x = 5;
//         object.scale.y = 5;
//         object.scale.z = 5;
//         box.add(object);
//     }, onProgress, onError );
// });

var loader = new THREE.FontLoader();
loader.load('/app/fonts/helvetiker_bold.typeface.js', function (font) {
    var textGeometry = new THREE.TextGeometry("argon.js", {
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
    box.add(textMesh);
    box.scale.set(0.001, 0.001, 0.001);
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(function () {
        uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
    });
});


app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData:"-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeAQ//bJBja64QhMKAw2spry8LrHnqDgBy9kViW/9uqkvD\nzQq2mk9E21KfKHPGjcxlWcMGHrLIYFC1k5SRUm+WaydWkUCeG1OVKvCPjuvg\no+v/ilP8M0RTZYohpSY7Noaz4ciwoF24ihntIAm+5N4U1K2o1r9BFDv0FaD9\n7OODx5+zZfcwWbhXY59md4qwzLg96FYT17yPaTIXAKc1WzXNizORxvVrWWF9\nClVJwC8nEPwXs4rVInBtdfYERI1oEkX3NpxIDPDXkSfoErIkd5cIcnDUYUJi\nBVDJOl7pRFE5l38JJz5ayWWcEwRhDHDfBve8D9qDGk73jYaaWeFsWSsmITLQ\npJpzQcDX9ZSaKFgIbmZ39tdqiiTZO2T+BMK7kcPoin7jvSAtmMrWEhyvi56u\nE3Ob2Qr/m+eu8ZBusTPY3EUYaMKPkSP4wSmgPp2RhnmngdYfnHHajnigOBfX\nziYnKERUCN7nQhYtekzbsoMPMYNbNyAoFYJdO6GC9CkApsiegleLb3SkdVs+\ngmpP5VFPxqjQ+5dpU0r7X7x8uDnvAghJ/xjuCGOupI7dL0O/bfnRUBkGUqAV\nQeI2ig/tk4vWaqTC9dOmTyDJOnHeGjWwzgIkH4NpPZ3J4tg0XuHE3Q1XnuiW\ntGTO4FzK3ejKMZ4HQRMQnlp43bVCR80PwrefaB32imnBwU4DAGn1enGTza0Q\nB/9GkceGf2mTO3OIMrnpjyWybNayoVWG+lp3YiyPTvDzf+wAeqAYA86X//P+\nE9wodnPwPaP90L76fSyiV34LgN+4sKf9yJl7+ra34MWz0hpvNxfOSD8Jb+9A\nV2S7Rf2aBLRdfAZbojx2MnvV88SbOG/95pjh6WX98jay7MWENTCdEpoREAmo\nslRBgOjfreUyzAKmKepp1IoV+TBtv4VNptWsPaRZHOXQ67mcdOYkSNlJmACS\nQyVbgbwGlPvIYCXf/0nMOP4lJmluylPq/UfVh0rsMcTTTo/iy69Eu/vzll7R\n5iRZz+atNxq4XaIMzwyTGLmbPwYt7crQbcydZLi8BKJ0B/4gwRtJhLjeD7m0\n8DA+QfU71zQWeyL7CyyCGPkJnpR06scjNRseeE3lE4sHy7YCvIx9rNVuWJza\nb5pNh6QX4j/JhOP3QJ9RWlJq6UaUTvkEDrRU6Qv/eUidnLeRftfOzJPOpanZ\ne6NE0zKbiycB7GS7yx6S9QwyTDzfDQEWv9u+VkehPcwCfC/+OSPnTPg2jWSs\ndjkaqs0GaHYg3RvESZNuCwokYxta/+dNIQFvkI5VUc90qG6qLA5FIE1stOlI\nj4pH27QAvP7EeBAnhNFq31YRzTZbJ74uVtIwkNef1GgMg9kGfD6Axqxgadsl\nnGJd3hQbcNehLtPck2OSrpY5jFy6wcFMA47tt+RhMWHyAQ//Vt9kC159YVnB\nsVwScSIAF7Mw41L5P4ndeYflJX++YUk/IAomWVDDJIweomTT+/uZyHebzwgb\nPBtuiT81+qBwX4y9pV2nD31sPyhCKc+vQhZvOvanEAptupbYhtuEd8+K6/ZD\nLt/4Gl+DmQvw4/xrmxiJx4fpJxdmUFmgnClz8WWUqIJZlvQykGIF8ClVfCSg\n0qQuHNQPXNHqXxVeYLqDQ6bfZ2uK+qYOk6WemE7Anu70znLLoxDiJERmbjDb\nnPO/sRLlNCij/UIYyVHfuILo9IvQo0XCJ4uXB6/c7bAaWLxoaP83os2KfSp0\n1fb4Tna8ENibZPRQb2CkMnwpeDaw4t0wl2h4J3PyTNeekgNsgCncobzuKh66\n5thgO+8IHbiw7cLuZgpE/BE00BdPbl+P0RzUPYSv4lh20y0JLqt+fLbxY+O1\nRdqeGLg0RB8+40o7B2Mpo9zg3OZd4xBX0YNw+3k8iEDJI9lx4cHbYrEie5pQ\nKPnJXldASKVgFTtv4JqeICqjdxf+LiFzZvacKT1c9TPnjmX60T0sWs1t5T6Y\nsQfvVKOpVML5u5GJY1wCYm3LneH8qiYVDqlYLYG0eozHSVOKGRiiWo/POa0D\nTApIg7odxdHec9xLPHbOcqY0ztZBPZKxSixP49F1N0WGyPP6esgJ+cxATo6Z\n5blHR0oVmVXSwWMBjikHB6M/GRLt8Mge5ReGSatidIDavM0zgXc6CBI9vNPj\nWuypVApVSrCRncma4UuncTIKRgDF+SvOCet0nR+1OSEMP4aOQyLe2dYyBRof\nJlUZusUp0yur1d6DpP++89fvr71moIqaWfcul8IFCYTE9nplmyAeHrzOY/a7\nSDsq34xwhWehTju0mT3CYjyrFLZE05/U+JYW1xef07PPV+aefxDBYQvzEvor\nHEInkSa5V6RM1RHOxtcc8xHycLLTIf7WjiutuUAKlxeIr1KHYvQ4v2fnGo+h\nPjAxT0hvfCGTNJkZkO/OS7XPCjN0DnUWtGTK+3nzOR7KM4X4pHbowWlJe1jE\nZQIRS5VHqh36WFvQpWydGN46CbMt0+z9nF+sqfaJk5l9buB4SYBqj1oy7dlg\ndSccsDtY25g1rvt3zzx9g9CwYW0Q9cTMMP2am8XeEfHjNj1f3ZYtjkNU17ss\nZtsMXLegvD/6OHKNUycQKHJj9m+1oP5mJylnv3GXMNVyTbwmudVG1t2q2krv\nTz/YsZluA+4iV1x72/KYU3N731Xt9NLeQGTVX9niXtjaYzMtv5wXoTFpX4h2\nzIPmAt/3yfb1Xmw1YlH3fTa18qRMuRhrAcjWf+bwarSQ82J5PCQQ/c/M+IYJ\ng4/bhwI+fc1yRlStTGsiVf67Ozd2YHM3e767AQOT0z8yOpKulK0DHBVwmJqD\nrNlFbXFmUrw+1ya3ENf23mbq\n=XzkQ\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here 
        api.objectTracker.createDataSet("/dataset/ARHunt.xml").then(function (dataSet) {
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

