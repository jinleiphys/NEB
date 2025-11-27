/**
 * Main Application - Nonelastic Breakup Visualization
 * Three.js based interactive nuclear physics simulation
 */

// Global state
const state = {
    scenes: {},
    animators: {},
    particleSystem: null,
    currentProjectile: 'deuteron',
    settings: {
        energy: 50,
        impactParam: 2.3,
        speed: 5,
        showTrails: true
    }
};

// Wait for everything to load
window.addEventListener('load', () => {
    console.log('Page loaded, initializing...');

    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        try {
            // Initialize particle system first
            state.particleSystem = new ParticleSystem();
            console.log('ParticleSystem created');

            // Initialize scenes
            initHeroScene();
            console.log('Hero scene initialized');

            initComparisonScenes();
            console.log('Comparison scenes initialized');

            initExampleScene();
            console.log('Example scene initialized');

            // Setup event listeners
            setupEventListeners();
            console.log('Event listeners set up');

            setupScrollEffects();

            // Start animation loop
            animate();
            console.log('Animation started');

        } catch (error) {
            console.error('Initialization error:', error);
        }
    }, 1000);
});

// Hero Scene - Main 3D visualization
function initHeroScene() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container not found');
        return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 2, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00aa, 1.5, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Orbit controls
    let controls = null;
    if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 50;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
    }

    // Create target nucleus
    const target = state.particleSystem.createTargetNucleus({ x: 5, y: 0, z: 0 }, 2);
    scene.add(target);

    // Create demo projectile
    const projectile = state.particleSystem.createDeuteron({ x: -10, y: 2, z: 0 });
    scene.add(projectile);

    // Background stars
    createStarField(scene);

    // Animator
    const animator = new BreakupAnimator(scene, state.particleSystem);
    state.animators.hero = animator;

    // Store references
    state.scenes.hero = {
        scene,
        camera,
        renderer,
        controls,
        target,
        projectile
    };

    console.log('Hero scene setup complete');
}

// Create starfield background
function createStarField(scene) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 1500; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0x888899,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

// Comparison Scenes
function initComparisonScenes() {
    ['elastic', 'nonelastic'].forEach(type => {
        const container = document.getElementById(`${type}-canvas`);
        if (!container) {
            console.log(`${type}-canvas not found`);
            return;
        }

        const width = container.clientWidth || 400;
        const height = container.clientHeight || 250;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a25);

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 3, 15);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(type === 'elastic' ? 0x00f0ff : 0xff00aa, 2, 50);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Create target
        const target = state.particleSystem.createTargetNucleus({ x: 3, y: 0, z: 0 }, 1.5);
        scene.add(target);

        // Create projectile
        const projectile = state.particleSystem.createDeuteron({ x: -8, y: 1.5, z: 0 });
        scene.add(projectile);

        // Animator
        const animator = new BreakupAnimator(scene, state.particleSystem);
        state.animators[type] = animator;

        // Store
        state.scenes[type] = {
            scene,
            camera,
            renderer,
            target,
            projectile,
            animator,
            isPlaying: false
        };
    });
}

// Example Scene - Projectile showcase
function initExampleScene() {
    const container = document.getElementById('example-canvas');
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a25);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 2, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00aa, 1, 50);
    pointLight2.position.set(-5, -3, 5);
    scene.add(pointLight2);

    // Controls
    let controls = null;
    if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 4;
        controls.maxDistance = 15;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1;
    }

    // Initial projectile
    const projectile = state.particleSystem.createDeuteron({ x: 0, y: 0, z: 0 });
    projectile.scale.set(2, 2, 2);
    scene.add(projectile);

    // Store
    state.scenes.example = {
        scene,
        camera,
        renderer,
        controls,
        projectile
    };
}

// Event Listeners
function setupEventListeners() {
    // Start animation button
    const startBtn = document.getElementById('start-animation');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Start animation clicked');
            startHeroAnimation();
        });
    } else {
        console.error('start-animation button not found');
    }

    // Learn more button
    const learnBtn = document.getElementById('learn-more');
    if (learnBtn) {
        learnBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Learn more clicked');
            const conceptSection = document.getElementById('concept');
            if (conceptSection) {
                conceptSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    } else {
        console.error('learn-more button not found');
    }

    // Play buttons for comparison
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.dataset.type;
            console.log('Play button clicked:', type);
            playComparisonAnimation(type);
        });
    });

    // Projectile selector
    document.querySelectorAll('.projectile-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectile = btn.dataset.projectile;
            console.log('Projectile selected:', projectile);
            selectProjectile(projectile);

            // Update active state
            document.querySelectorAll('.projectile-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding info panel
            document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
            const infoPanel = document.getElementById(`${projectile}-info`);
            if (infoPanel) {
                infoPanel.classList.add('active');
            }
        });
    });

    // Control panel toggle
    const togglePanel = document.getElementById('toggle-panel');
    const controlPanel = document.getElementById('control-panel');
    if (togglePanel && controlPanel) {
        togglePanel.addEventListener('click', (e) => {
            e.preventDefault();
            controlPanel.classList.toggle('active');
        });
    }

    // Control sliders
    const energySlider = document.getElementById('energy-slider');
    const energyValue = document.getElementById('energy-value');
    if (energySlider && energyValue) {
        energySlider.addEventListener('input', (e) => {
            state.settings.energy = parseInt(e.target.value);
            energyValue.textContent = `${state.settings.energy} MeV`;
        });
    }

    const impactSlider = document.getElementById('impact-slider');
    const impactValue = document.getElementById('impact-value');
    if (impactSlider && impactValue) {
        impactSlider.addEventListener('input', (e) => {
            state.settings.impactParam = parseFloat(e.target.value) / 10;
            impactValue.textContent = `${state.settings.impactParam.toFixed(1)} fm`;
        });
    }

    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            state.settings.speed = parseInt(e.target.value);
            Object.values(state.animators).forEach(a => {
                if (a && a.setSpeed) a.setSpeed(state.settings.speed / 5);
            });
        });
    }

    // Reset view button
    const resetView = document.getElementById('reset-view');
    if (resetView) {
        resetView.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.scenes.hero && state.scenes.hero.controls) {
                state.scenes.hero.camera.position.set(0, 5, 20);
                state.scenes.hero.controls.reset();
            }
        });
    }

    // Toggle trails button
    const toggleTrails = document.getElementById('toggle-trails');
    if (toggleTrails) {
        toggleTrails.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.particleSystem) {
                state.settings.showTrails = state.particleSystem.toggleTrails();
                toggleTrails.textContent = state.settings.showTrails ? 'Trails On' : 'Trails Off';
            }
        });
    }

    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Window resize
    window.addEventListener('resize', handleResize);

    console.log('All event listeners attached');
}

// Start hero animation
function startHeroAnimation() {
    console.log('Starting hero animation...');

    const hero = state.scenes.hero;
    if (!hero) {
        console.error('Hero scene not found');
        return;
    }

    // Reset animator
    if (state.animators.hero) {
        state.animators.hero.reset();
    }

    // Remove old projectile
    if (hero.projectile) {
        hero.scene.remove(hero.projectile);
    }

    // Create new projectile
    const projectile = state.particleSystem.createDeuteron({
        x: -15,
        y: state.settings.impactParam,
        z: 0
    });
    hero.scene.add(projectile);
    hero.projectile = projectile;

    // Create animation
    const animation = state.animators.hero.createNonelasticBreakup(
        projectile,
        hero.target,
        state.settings.impactParam
    );

    // Play animation
    state.animators.hero.play(animation);
    console.log('Animation started');

    // Stop auto-rotate during animation
    if (hero.controls) {
        hero.controls.autoRotate = false;

        // Resume auto-rotate after animation
        setTimeout(() => {
            if (hero.controls) {
                hero.controls.autoRotate = true;
            }
        }, 10000);
    }
}

// Play comparison animation
function playComparisonAnimation(type) {
    console.log('Playing comparison animation:', type);

    const sceneData = state.scenes[type];
    if (!sceneData) {
        console.error('Scene not found:', type);
        return;
    }

    const animator = state.animators[type];
    if (!animator) {
        console.error('Animator not found:', type);
        return;
    }

    // Reset
    animator.reset();

    // Remove old projectile
    if (sceneData.projectile) {
        sceneData.scene.remove(sceneData.projectile);
    }

    // Create new projectile
    const projectile = state.particleSystem.createDeuteron({ x: -8, y: 1.5, z: 0 });
    sceneData.scene.add(projectile);
    sceneData.projectile = projectile;

    // Create animation based on type
    const animation = type === 'elastic'
        ? animator.createElasticBreakup(projectile, sceneData.target, 2.5)
        : animator.createNonelasticBreakup(projectile, sceneData.target, 1.5);

    animator.play(animation);
    sceneData.isPlaying = true;
    console.log('Comparison animation started');
}

// Select projectile for example scene
function selectProjectile(type) {
    console.log('Selecting projectile:', type);

    const example = state.scenes.example;
    if (!example) {
        console.error('Example scene not found');
        return;
    }

    // Remove old projectile
    if (example.projectile) {
        example.scene.remove(example.projectile);
    }

    // Create new projectile
    let projectile;
    switch (type) {
        case 'deuteron':
            projectile = state.particleSystem.createDeuteron({ x: 0, y: 0, z: 0 });
            break;
        case 'li6':
            projectile = state.particleSystem.createLi6({ x: 0, y: 0, z: 0 });
            break;
        case 'li7':
            projectile = state.particleSystem.createLi7({ x: 0, y: 0, z: 0 });
            break;
        case 'be11':
            projectile = state.particleSystem.createBe11({ x: 0, y: 0, z: 0 });
            break;
        case 'li11':
            projectile = state.particleSystem.createLi11({ x: 0, y: 0, z: 0 });
            break;
        default:
            projectile = state.particleSystem.createDeuteron({ x: 0, y: 0, z: 0 });
    }

    projectile.scale.set(2, 2, 2);
    example.scene.add(projectile);
    example.projectile = projectile;

    state.currentProjectile = type;
    console.log('Projectile created:', type);
}

// Scroll effects
function setupScrollEffects() {
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Navbar background
        if (navbar) {
            if (scrollY > 50) {
                navbar.style.background = 'rgba(10, 10, 15, 0.98)';
            } else {
                navbar.style.background = 'rgba(10, 10, 15, 0.9)';
            }
        }

        // Update active nav link
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                const id = section.id;
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Handle window resize
function handleResize() {
    // Hero scene
    if (state.scenes.hero) {
        const container = document.getElementById('canvas-container');
        if (container) {
            const width = container.clientWidth;
            const height = container.clientHeight;

            state.scenes.hero.camera.aspect = width / height;
            state.scenes.hero.camera.updateProjectionMatrix();
            state.scenes.hero.renderer.setSize(width, height);
        }
    }

    // Comparison scenes
    ['elastic', 'nonelastic'].forEach(type => {
        if (state.scenes[type]) {
            const container = document.getElementById(`${type}-canvas`);
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;

                state.scenes[type].camera.aspect = width / height;
                state.scenes[type].camera.updateProjectionMatrix();
                state.scenes[type].renderer.setSize(width, height);
            }
        }
    });

    // Example scene
    if (state.scenes.example) {
        const container = document.getElementById('example-canvas');
        if (container) {
            const width = container.clientWidth;
            const height = container.clientHeight;

            state.scenes.example.camera.aspect = width / height;
            state.scenes.example.camera.updateProjectionMatrix();
            state.scenes.example.renderer.setSize(width, height);
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = 0.016; // ~60fps

    // Hero scene
    if (state.scenes.hero) {
        const hero = state.scenes.hero;

        if (hero.controls) {
            hero.controls.update();
        }

        // Rotate hero projectile gently when not animating
        if (hero.projectile && state.animators.hero && !state.animators.hero.isPlaying) {
            hero.projectile.rotation.y += 0.01;
            hero.projectile.rotation.x += 0.005;
        }

        // Update animator
        if (state.animators.hero) {
            state.animators.hero.update(delta);
        }

        hero.renderer.render(hero.scene, hero.camera);
    }

    // Comparison scenes
    ['elastic', 'nonelastic'].forEach(type => {
        if (state.scenes[type]) {
            const sceneData = state.scenes[type];

            // Update animator
            if (state.animators[type]) {
                const complete = state.animators[type].update(delta);
                if (complete) {
                    sceneData.isPlaying = false;
                }
            }

            sceneData.renderer.render(sceneData.scene, sceneData.camera);
        }
    });

    // Example scene
    if (state.scenes.example) {
        const example = state.scenes.example;

        if (example.controls) {
            example.controls.update();
        }

        // Rotate projectile
        if (example.projectile) {
            example.projectile.rotation.y += 0.008;
        }

        example.renderer.render(example.scene, example.camera);
    }
}

console.log('Main.js loaded');
