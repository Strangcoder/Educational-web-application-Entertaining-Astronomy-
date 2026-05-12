function createModelViewer({
    containerRef,
    modelPath,
    link,
    fov,
    cameraZ,
    ambientIntensity,
    pointIntensity,
    pointPosition = [0, -3, 7],
    rotationY = 0.01,
    modelScale = [0.5, 0.5, 0.5],
    modelPosition = [0, 0, 0],
    onLoad = null
}) {
    const container = typeof containerRef === 'string'
        ? document.getElementById(containerRef)
        : containerRef;

    if (!container) return;

    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let raycaster = null;
    let mouse = null;
    let model = null;

    let initialized = false;
    let visible = false;
    let loading = false;
    let rafId = null;

    const loader = new THREE.GLTFLoader();

    function getSize() {
        return {
            width: container.clientWidth || container.offsetWidth,
            height: container.clientHeight || container.offsetHeight
        };
    }

    function resize() {
        if (!camera || !renderer) return;

        const { width, height } = getSize();
        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function stopLoop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function animate() {
        if (!visible) {
            rafId = null;
            return;
        }

        rafId = requestAnimationFrame(animate);

        if (model) {
            model.rotation.y += rotationY;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    function startLoop() {
        if (rafId !== null) return;
        animate();
    }

    function init() {
        if (initialized || loading) return;

        const { width, height } = getSize();
        if (!width || !height) return;

        loading = true;
        initialized = true;

        container.innerHTML = '';

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
        camera.position.z = cameraZ;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const aLight = new THREE.AmbientLight(0x404040, ambientIntensity);
        scene.add(aLight);

        const pLight = new THREE.PointLight(0xFFFFFF, pointIntensity);
        pLight.position.set(pointPosition[0], pointPosition[1], pointPosition[2]);
        scene.add(pLight);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;

        renderer.domElement.addEventListener('dblclick', function (event) {
            if (!model) return;

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(model, true);

            if (intersects.length > 0) {
                window.location.href = link;
            }
        });

        loader.load(
            modelPath,
            function (gltf) {
                model = gltf.scene;

                if (typeof onLoad === 'function') {
                    onLoad(model);
                }

                scene.add(model);
                model.scale.set(modelScale[0], modelScale[1], modelScale[2]);
                model.position.set(modelPosition[0], modelPosition[1], modelPosition[2]);

                loading = false;

                if (visible) {
                    startLoop();
                }
            },
            undefined,
            function (error) {
                loading = false;
                console.error('Ошибка загрузки модели:', modelPath, error);
            }
        );
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    visible = true;
                    init();
                    if (initialized && model) {
                        startLoop();
                    }
                } else {
                    visible = false;
                    stopLoop();
                }
            });
        },
        {
            threshold: 0.25
        }
    );

    observer.observe(container);

    window.addEventListener('resize', resize);
    window.addEventListener('load', () => {
        if (visible) {
            resize();
        }
    });
}

createModelViewer({
    containerRef: 'model-sun',
    modelPath: STATIC_URL + 'image/planet_model/sun.glb',
    link: '../palnet_phenomen/sun/sun.html',
    fov: 70,
    cameraZ: 10,
    ambientIntensity: 1.2,
    pointIntensity: 1.2,
    pointPosition: [0, -3, 7],
    rotationY: 0.01
});

createModelViewer({
    containerRef: 'model-mercury',
    modelPath: STATIC_URL + 'image/planet_model/mercury.glb',
    link: '../palnet_phenomen/mercury/mercury.html',
    fov: 50,
    cameraZ: 4,
    ambientIntensity: 1.2,
    pointIntensity: 1.2,
    pointPosition: [0, -3, 7],
    rotationY: 0.08
});

createModelViewer({
    containerRef: 'model-venus',
    modelPath: STATIC_URL + 'image/planet_model/venus.glb',
    link: '../palnet_phenomen/venus/venus.html',
    fov: 85,
    cameraZ: 50,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: -0.03,
    onLoad: (model) => {
        model.traverse((child) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => {
                        mat.side = THREE.DoubleSide;
                        mat.needsUpdate = true;
                    });
                } else if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
            }
        });
    }
});

createModelViewer({
    containerRef: 'model-earth',
    modelPath: STATIC_URL + 'image/planet_model/earth.glb',
    link: '../palnet_phenomen/earth/earth.html',
    fov: 85,
    cameraZ: 90,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: 0.03
});

createModelViewer({
    containerRef: 'model-mars',
    modelPath: STATIC_URL + 'image/planet_model/mars.glb',
    link: '../palnet_phenomen/mars/mars.html',
    fov: 90,
    cameraZ: 90,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: 0.03
});

createModelViewer({
    containerRef: 'model-jupiter',
    modelPath: STATIC_URL + 'image/planet_model/jupiter.glb',
    link: '../palnet_phenomen/jupiter/jupiter.html',
    fov: 100,
    cameraZ: 93,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: 0.02
});

createModelViewer({
    containerRef: 'model-saturn',
    modelPath: STATIC_URL + 'image/planet_model/saturn.glb',
    link: '../palnet_phenomen/saturn/saturn.html',
    fov: 110,
    cameraZ: 280,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: 0.02,
    onLoad: (model) => {
        model.rotation.x = Math.PI / 20;
    }
});

createModelViewer({
    containerRef: 'model-uran',
    modelPath: STATIC_URL + 'image/planet_model/uranus.glb',
    link: '../palnet_phenomen/uran/uran.html',
    fov: 110,
    cameraZ: 95,
    ambientIntensity: 3,
    pointIntensity: 5,
    pointPosition: [5, 5, 10],
    rotationY: 0.02
});

createModelViewer({
    containerRef: 'model-neptune',
    modelPath: STATIC_URL + 'image/planet_model/neptune.glb',
    link: '../palnet_phenomen/neptun/neptun.html',
    fov: 110,
    cameraZ: 90,
    ambientIntensity: 4,
    pointIntensity: 6,
    pointPosition: [5, 5, 10],
    rotationY: 0.02
});