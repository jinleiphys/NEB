/**
 * Particle System for Nuclear Physics Visualization
 * Creates and manages different types of nuclear particles
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.trails = [];
        this.trailsEnabled = true;
        this.trailLength = 50;
    }

    // Create a proton particle
    createProton(position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            emissive: 0xff2222,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const proton = new THREE.Mesh(geometry, material);
        proton.position.set(position.x, position.y, position.z);
        proton.userData = {
            type: 'proton',
            charge: 1,
            mass: 1,
            velocity: new THREE.Vector3(),
            trail: []
        };

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        proton.add(glow);

        return proton;
    }

    // Create a neutron particle
    createNeutron(position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x2244ff,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const neutron = new THREE.Mesh(geometry, material);
        neutron.position.set(position.x, position.y, position.z);
        neutron.userData = {
            type: 'neutron',
            charge: 0,
            mass: 1,
            velocity: new THREE.Vector3(),
            trail: []
        };

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        neutron.add(glow);

        return neutron;
    }

    // Create an alpha particle (He-4 nucleus)
    createAlpha(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // Create 4 nucleons in tetrahedral arrangement
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const protonMat = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            emissive: 0xff2222,
            emissiveIntensity: 0.3
        });
        const neutronMat = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x2244ff,
            emissiveIntensity: 0.3
        });

        const positions = [
            { x: 0.15, y: 0.15, z: 0.15 },
            { x: -0.15, y: -0.15, z: 0.15 },
            { x: 0.15, y: -0.15, z: -0.15 },
            { x: -0.15, y: 0.15, z: -0.15 }
        ];

        positions.forEach((pos, i) => {
            const mat = i < 2 ? protonMat : neutronMat;
            const nucleon = new THREE.Mesh(geometry, mat);
            nucleon.position.set(pos.x, pos.y, pos.z);
            group.add(nucleon);
        });

        // Add outer glow
        const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.25
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'alpha',
            charge: 2,
            mass: 4,
            velocity: new THREE.Vector3(),
            trail: []
        };

        return group;
    }

    // Create a deuteron (proton + neutron)
    createDeuteron(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // Proton
        const protonGeom = new THREE.SphereGeometry(0.25, 32, 32);
        const protonMat = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            emissive: 0xff2222,
            emissiveIntensity: 0.4
        });
        const proton = new THREE.Mesh(protonGeom, protonMat);
        proton.position.set(-0.2, 0, 0);
        proton.userData = { type: 'proton-part' };
        group.add(proton);

        // Neutron
        const neutronGeom = new THREE.SphereGeometry(0.25, 32, 32);
        const neutronMat = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x2244ff,
            emissiveIntensity: 0.4
        });
        const neutron = new THREE.Mesh(neutronGeom, neutronMat);
        neutron.position.set(0.2, 0, 0);
        neutron.userData = { type: 'neutron-part' };
        group.add(neutron);

        // Binding visualization (dashed line or glow)
        const bindingGeom = new THREE.SphereGeometry(0.45, 32, 32);
        const bindingMat = new THREE.MeshBasicMaterial({
            color: 0xaaffaa,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const binding = new THREE.Mesh(bindingGeom, bindingMat);
        group.add(binding);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'deuteron',
            charge: 1,
            mass: 2,
            velocity: new THREE.Vector3(),
            trail: [],
            components: { proton, neutron }
        };

        return group;
    }

    // Create target nucleus (heavy nucleus) - Glowing Energy Style
    createTargetNucleus(position = { x: 0, y: 0, z: 0 }, size = 2) {
        const group = new THREE.Group();

        // Inner bright core - intense glowing center
        const innerCoreGeom = new THREE.SphereGeometry(size * 0.3, 32, 32);
        const innerCoreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const innerCore = new THREE.Mesh(innerCoreGeom, innerCoreMat);
        group.add(innerCore);

        // Main core - gradient from hot center to cooler edge
        const coreGeom = new THREE.SphereGeometry(size * 0.7, 64, 64);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0xff6633,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            shininess: 100,
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Middle layer - orange/yellow energy
        const midGeom = new THREE.SphereGeometry(size * 0.85, 48, 48);
        const midMat = new THREE.MeshPhongMaterial({
            color: 0xff8844,
            emissive: 0xff6600,
            emissiveIntensity: 0.5,
            shininess: 50,
            transparent: true,
            opacity: 0.5
        });
        const mid = new THREE.Mesh(midGeom, midMat);
        group.add(mid);

        // Outer shell - cooler outer layer
        const outerGeom = new THREE.SphereGeometry(size, 48, 48);
        const outerMat = new THREE.MeshPhongMaterial({
            color: 0xffaa66,
            emissive: 0xcc6600,
            emissiveIntensity: 0.3,
            shininess: 30,
            transparent: true,
            opacity: 0.35
        });
        const outer = new THREE.Mesh(outerGeom, outerMat);
        group.add(outer);

        // Glow layer 1 - close glow
        const glow1Geom = new THREE.SphereGeometry(size * 1.2, 32, 32);
        const glow1Mat = new THREE.MeshBasicMaterial({
            color: 0xff6633,
            transparent: true,
            opacity: 0.15
        });
        const glow1 = new THREE.Mesh(glow1Geom, glow1Mat);
        group.add(glow1);

        // Glow layer 2 - medium glow
        const glow2Geom = new THREE.SphereGeometry(size * 1.5, 32, 32);
        const glow2Mat = new THREE.MeshBasicMaterial({
            color: 0xff8855,
            transparent: true,
            opacity: 0.08
        });
        const glow2 = new THREE.Mesh(glow2Geom, glow2Mat);
        group.add(glow2);

        // Glow layer 3 - outer halo
        const glow3Geom = new THREE.SphereGeometry(size * 1.9, 32, 32);
        const glow3Mat = new THREE.MeshBasicMaterial({
            color: 0xffaa77,
            transparent: true,
            opacity: 0.04
        });
        const glow3 = new THREE.Mesh(glow3Geom, glow3Mat);
        group.add(glow3);

        // Energy field rings
        for (let i = 1; i <= 2; i++) {
            const ringGeom = new THREE.TorusGeometry(size * (1.1 + i * 0.25), 0.02, 8, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.2 / i
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = i * 0.3;
            group.add(ring);
        }

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'target',
            charge: 50,
            mass: 100
        };

        return group;
    }

    // Create trail effect
    createTrail(particle, color) {
        const points = [];
        for (let i = 0; i < this.trailLength; i++) {
            points.push(particle.position.clone());
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });

        const trail = new THREE.Line(geometry, material);
        trail.userData = {
            particle: particle,
            points: points
        };

        return trail;
    }

    // Update trail
    updateTrail(trail) {
        if (!this.trailsEnabled) return;

        const points = trail.userData.points;
        const particle = trail.userData.particle;

        // Shift points and add new position
        points.pop();
        points.unshift(particle.position.clone());

        // Update geometry
        trail.geometry.setFromPoints(points);
    }

    // Create explosion effect
    createExplosion(position, color = 0xffaa00) {
        const particles = [];
        const particleCount = 50;

        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.position.copy(position);

            // Random velocity
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 0.5 + Math.random() * 1;

            particle.userData = {
                velocity: new THREE.Vector3(
                    speed * Math.sin(phi) * Math.cos(theta),
                    speed * Math.sin(phi) * Math.sin(theta),
                    speed * Math.cos(phi)
                ),
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            };

            particles.push(particle);
        }

        return particles;
    }

    // Update explosion particles
    updateExplosion(particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.position.add(p.userData.velocity);
            p.userData.velocity.multiplyScalar(0.95); // Drag
            p.userData.life -= p.userData.decay;
            p.material.opacity = p.userData.life;

            if (p.userData.life <= 0) {
                particles.splice(i, 1);
                p.geometry.dispose();
                p.material.dispose();
            }
        }
        return particles;
    }

    // Create absorption flash effect
    createAbsorptionFlash(position, targetSize = 2) {
        const group = new THREE.Group();

        // Expanding ring
        const ringGeom = new THREE.RingGeometry(targetSize, targetSize + 0.1, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        group.add(ring);

        // Flash sphere
        const flashGeom = new THREE.SphereGeometry(targetSize * 0.5, 32, 32);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeom, flashMat);
        group.add(flash);

        group.position.copy(position);
        group.userData = {
            life: 1.0,
            ring: ring,
            flash: flash,
            initialSize: targetSize
        };

        return group;
    }

    // Update absorption flash
    updateAbsorptionFlash(flash) {
        // Check if flash has valid userData
        if (!flash || !flash.userData || flash.userData.life === undefined) {
            return false;
        }

        flash.userData.life -= 0.03;

        const scale = 1 + (1 - flash.userData.life) * 2;

        // Update ring if it exists
        if (flash.userData.ring && flash.userData.ring.scale) {
            flash.userData.ring.scale.set(scale, scale, scale);
            if (flash.userData.ring.material) {
                flash.userData.ring.material.opacity = flash.userData.life;
            }
        }

        // Update flash sphere if it exists
        if (flash.userData.flash && flash.userData.flash.scale) {
            const flashScale = 1 + (1 - flash.userData.life);
            flash.userData.flash.scale.set(flashScale, flashScale, flashScale);
            if (flash.userData.flash.material) {
                flash.userData.flash.material.opacity = flash.userData.life * 0.8;
            }
        }

        return flash.userData.life > 0;
    }

    // Create Li-6 projectile (alpha + deuteron cluster)
    createLi6(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // Alpha cluster
        const alpha = this.createAlpha({ x: -0.3, y: 0, z: 0 });
        alpha.scale.set(0.8, 0.8, 0.8);
        group.add(alpha);

        // Deuteron cluster
        const deut = this.createDeuteron({ x: 0.4, y: 0, z: 0 });
        deut.scale.set(0.8, 0.8, 0.8);
        group.add(deut);

        // Binding envelope
        const envGeom = new THREE.SphereGeometry(0.7, 32, 32);
        const envMat = new THREE.MeshBasicMaterial({
            color: 0x88ffaa,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const envelope = new THREE.Mesh(envGeom, envMat);
        group.add(envelope);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'li6',
            charge: 3,
            mass: 6,
            velocity: new THREE.Vector3(),
            trail: [],
            components: { alpha, deuteron: deut }
        };

        return group;
    }

    // Create Li-7 projectile (alpha + triton cluster)
    createLi7(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // Alpha cluster
        const alpha = this.createAlpha({ x: -0.3, y: 0, z: 0 });
        alpha.scale.set(0.8, 0.8, 0.8);
        group.add(alpha);

        // Triton (p + 2n)
        const tritonGroup = new THREE.Group();
        const geom = new THREE.SphereGeometry(0.18, 32, 32);

        const proton = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3
        }));
        proton.position.set(0, 0.15, 0);
        tritonGroup.add(proton);

        const n1 = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 0.3
        }));
        n1.position.set(-0.13, -0.1, 0);
        tritonGroup.add(n1);

        const n2 = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 0.3
        }));
        n2.position.set(0.13, -0.1, 0);
        tritonGroup.add(n2);

        const tritonGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xaa66ff, transparent: true, opacity: 0.2 })
        );
        tritonGroup.add(tritonGlow);

        tritonGroup.position.set(0.4, 0, 0);
        group.add(tritonGroup);

        // Binding envelope
        const envGeom = new THREE.SphereGeometry(0.75, 32, 32);
        const envMat = new THREE.MeshBasicMaterial({
            color: 0xaa88ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const envelope = new THREE.Mesh(envGeom, envMat);
        group.add(envelope);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'li7',
            charge: 3,
            mass: 7,
            velocity: new THREE.Vector3(),
            trail: [],
            components: { alpha, triton: tritonGroup }
        };

        return group;
    }

    // Create Be-11 projectile (one-neutron halo nucleus: 10Be core + halo neutron)
    createBe11(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // 10Be core
        const coreGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0x44aa88,
            emissive: 0x228855,
            emissiveIntensity: 0.4
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Halo neutron (extended, far from core)
        const haloNeutron = this.createNeutron({ x: 0.9, y: 0.2, z: 0 });
        haloNeutron.scale.set(0.7, 0.7, 0.7);
        group.add(haloNeutron);

        // Halo cloud visualization (diffuse)
        const haloCloudGeom = new THREE.SphereGeometry(1.1, 32, 32);
        const haloCloudMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.08
        });
        const haloCloud = new THREE.Mesh(haloCloudGeom, haloCloudMat);
        group.add(haloCloud);

        // Dashed outer boundary showing halo extent
        const outerGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const outer = new THREE.Mesh(outerGeom, outerMat);
        group.add(outer);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'be11',
            charge: 4,
            mass: 11,
            velocity: new THREE.Vector3(),
            trail: [],
            components: { core, haloNeutron }
        };

        return group;
    }

    // Create 11Li - Two-neutron halo nucleus (9Li core + 2n halo)
    createLi11(position = { x: 0, y: 0, z: 0 }) {
        const group = new THREE.Group();

        // Core (9Li)
        const coreGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0x7b2aff,
            emissive: 0x5500aa,
            emissiveIntensity: 0.4
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Halo neutrons (extended distribution - Borromean system)
        const haloGeom = new THREE.SphereGeometry(0.15, 32, 32);
        const haloMat = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x2244ff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });

        const haloN1 = new THREE.Mesh(haloGeom, haloMat);
        haloN1.position.set(0.8, 0.3, 0);
        group.add(haloN1);

        const haloN2 = new THREE.Mesh(haloGeom, haloMat);
        haloN2.position.set(0.7, -0.4, 0.2);
        group.add(haloN2);

        // Halo visualization (diffuse cloud - larger for 2n halo)
        const haloCloudGeom = new THREE.SphereGeometry(1.2, 32, 32);
        const haloCloudMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.08,
            wireframe: false
        });
        const haloCloud = new THREE.Mesh(haloCloudGeom, haloCloudMat);
        group.add(haloCloud);

        // Dashed outer boundary
        const outerGeom = new THREE.SphereGeometry(1.3, 16, 16);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const outer = new THREE.Mesh(outerGeom, outerMat);
        group.add(outer);

        group.position.set(position.x, position.y, position.z);
        group.userData = {
            type: 'li11',
            charge: 3,
            mass: 11,
            velocity: new THREE.Vector3(),
            trail: [],
            components: { core, haloN1, haloN2 }
        };

        return group;
    }

    // Toggle trails
    toggleTrails() {
        this.trailsEnabled = !this.trailsEnabled;
        return this.trailsEnabled;
    }

    // Create gamma ray effect - high energy photon beam
    createGammaRay(origin, direction = null) {
        const group = new THREE.Group();

        // Random direction if not specified (isotropic emission)
        if (!direction) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            direction = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            );
        }
        direction.normalize();

        // Gamma ray beam - bright yellow/white line
        const beamLength = 3;
        const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamLength, 8);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1.0
        });
        const beam = new THREE.Mesh(beamGeom, beamMat);

        // Outer glow
        const glowGeom = new THREE.CylinderGeometry(0.06, 0.06, beamLength, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        beam.add(glow);

        // Point toward direction
        beam.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction
        );
        // Offset so beam starts at origin
        beam.position.copy(origin).add(direction.clone().multiplyScalar(beamLength / 2));

        group.add(beam);
        group.position.copy(origin);

        group.userData = {
            type: 'gamma',
            velocity: direction.clone().multiplyScalar(0.8), // Very fast
            life: 1.0,
            decay: 0.025,
            beam: beam,
            origin: origin.clone()
        };

        return group;
    }

    // Create multiple gamma rays (de-excitation cascade)
    createGammaRays(origin, count = 3) {
        const gammas = [];
        for (let i = 0; i < count; i++) {
            gammas.push(this.createGammaRay(origin));
        }
        return gammas;
    }

    // Update gamma ray
    updateGammaRay(gamma) {
        if (!gamma || !gamma.userData) return false;

        gamma.position.add(gamma.userData.velocity);
        gamma.userData.life -= gamma.userData.decay;

        // Update beam opacity
        if (gamma.userData.beam && gamma.userData.beam.material) {
            gamma.userData.beam.material.opacity = gamma.userData.life;
            // Also update children (glow)
            gamma.userData.beam.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = gamma.userData.life * 0.4;
                }
            });
        }

        return gamma.userData.life > 0;
    }

    // Create energy release wave - expanding spherical shockwave
    createEnergyWave(origin, color = 0x00ffff, maxRadius = 8) {
        const group = new THREE.Group();

        // Multiple concentric rings for wave effect
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringGeom = new THREE.RingGeometry(0.1, 0.15, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8 - i * 0.2,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.userData.delay = i * 0.1; // Stagger expansion
            group.add(ring);

            // Clone for different orientation
            const ring2 = ring.clone();
            ring2.rotation.x = Math.PI / 2;
            ring2.userData.delay = i * 0.1;
            group.add(ring2);

            const ring3 = ring.clone();
            ring3.rotation.y = Math.PI / 2;
            ring3.userData.delay = i * 0.1;
            group.add(ring3);
        }

        group.position.copy(origin);
        group.userData = {
            type: 'energyWave',
            life: 1.0,
            decay: 0.02,
            maxRadius: maxRadius,
            currentRadius: 0.1
        };

        return group;
    }

    // Update energy wave
    updateEnergyWave(wave) {
        if (!wave || !wave.userData) return false;

        wave.userData.life -= wave.userData.decay;
        wave.userData.currentRadius += 0.15;

        const scale = wave.userData.currentRadius;
        wave.children.forEach((ring, i) => {
            const delay = ring.userData.delay || 0;
            const effectiveScale = Math.max(0.1, scale - delay * 5);
            ring.scale.set(effectiveScale, effectiveScale, effectiveScale);
            if (ring.material) {
                ring.material.opacity = wave.userData.life * (0.8 - (i % 3) * 0.2);
            }
        });

        return wave.userData.life > 0 && wave.userData.currentRadius < wave.userData.maxRadius;
    }

    // Create compound nucleus (temporary excited state)
    createCompoundNucleus(position, targetSize = 2) {
        const group = new THREE.Group();

        // Excited core - pulsating and brighter than normal target
        const coreGeom = new THREE.SphereGeometry(targetSize * 0.9, 64, 64);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 1.2,
            shininess: 150,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Hot inner region
        const hotGeom = new THREE.SphereGeometry(targetSize * 0.5, 32, 32);
        const hotMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
        });
        const hot = new THREE.Mesh(hotGeom, hotMat);
        group.add(hot);

        // Oscillating energy shell
        const shellGeom = new THREE.SphereGeometry(targetSize * 1.1, 32, 32);
        const shellMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.4,
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeom, shellMat);
        group.add(shell);

        // Excitation energy glow layers
        for (let i = 1; i <= 3; i++) {
            const glowGeom = new THREE.SphereGeometry(targetSize * (1.2 + i * 0.2), 24, 24);
            const glowMat = new THREE.MeshBasicMaterial({
                color: i === 1 ? 0xff6600 : (i === 2 ? 0xff8800 : 0xffaa00),
                transparent: true,
                opacity: 0.2 / i
            });
            const glow = new THREE.Mesh(glowGeom, glowMat);
            group.add(glow);
        }

        // Rotating excitation rings
        for (let i = 0; i < 3; i++) {
            const ringGeom = new THREE.TorusGeometry(targetSize * (1.3 + i * 0.15), 0.03, 8, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5 - i * 0.1
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2 + i * Math.PI / 6;
            ring.rotation.z = i * Math.PI / 4;
            ring.userData.rotationSpeed = 0.05 + i * 0.02;
            group.add(ring);
        }

        group.position.copy(position);
        group.userData = {
            type: 'compoundNucleus',
            life: 1.0,
            decay: 0.008, // Longer lifetime for resonance
            pulsePhase: 0,
            core: core,
            hot: hot,
            shell: shell,
            baseSize: targetSize
        };

        return group;
    }

    // Update compound nucleus animation
    updateCompoundNucleus(compound) {
        if (!compound || !compound.userData) return false;

        compound.userData.life -= compound.userData.decay;
        compound.userData.pulsePhase += 0.15;

        const pulse = Math.sin(compound.userData.pulsePhase);
        const baseSize = compound.userData.baseSize;

        // Pulsate core
        if (compound.userData.core) {
            const coreScale = 1 + pulse * 0.08;
            compound.userData.core.scale.set(coreScale, coreScale, coreScale);
            if (compound.userData.core.material) {
                compound.userData.core.material.emissiveIntensity = 1.0 + pulse * 0.4;
            }
        }

        // Pulsate hot center
        if (compound.userData.hot) {
            const hotScale = 1 + pulse * 0.15;
            compound.userData.hot.scale.set(hotScale, hotScale, hotScale);
            if (compound.userData.hot.material) {
                compound.userData.hot.material.opacity = 0.8 + pulse * 0.2;
            }
        }

        // Oscillate shell
        if (compound.userData.shell) {
            const shellScale = 1 + Math.sin(compound.userData.pulsePhase * 1.5) * 0.1;
            compound.userData.shell.scale.set(shellScale, shellScale, shellScale);
        }

        // Rotate excitation rings
        compound.children.forEach(child => {
            if (child.userData && child.userData.rotationSpeed) {
                child.rotation.z += child.userData.rotationSpeed;
            }
        });

        // Fade out near end
        if (compound.userData.life < 0.3) {
            const fade = compound.userData.life / 0.3;
            compound.children.forEach(child => {
                if (child.material) {
                    child.material.opacity *= fade;
                }
            });
        }

        return compound.userData.life > 0;
    }

    // Create excited target nucleus (inelastic breakup - target excitation)
    createExcitedTarget(position, targetSize = 2, excitationLevel = 1) {
        const group = new THREE.Group();

        // Base target structure (similar to normal but excited)
        const coreGeom = new THREE.SphereGeometry(targetSize * 0.8, 64, 64);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0xff7744,
            emissive: 0xff5500,
            emissiveIntensity: 0.9 + excitationLevel * 0.3,
            shininess: 100,
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Bright center
        const centerGeom = new THREE.SphereGeometry(targetSize * 0.4, 32, 32);
        const centerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const center = new THREE.Mesh(centerGeom, centerMat);
        group.add(center);

        // Excitation indicator - oscillating outer shells
        for (let i = 0; i < 2; i++) {
            const shellGeom = new THREE.SphereGeometry(targetSize * (1.1 + i * 0.15), 32, 32);
            const shellMat = new THREE.MeshBasicMaterial({
                color: 0xff8844,
                transparent: true,
                opacity: 0.25 - i * 0.08,
                wireframe: i === 1
            });
            const shell = new THREE.Mesh(shellGeom, shellMat);
            shell.userData.oscillateSpeed = 0.1 + i * 0.05;
            shell.userData.oscillatePhase = i * Math.PI / 2;
            group.add(shell);
        }

        // Glow indicating excitation energy
        const glowGeom = new THREE.SphereGeometry(targetSize * 1.5, 24, 24);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa66,
            transparent: true,
            opacity: 0.12 * excitationLevel
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        group.add(glow);

        group.position.copy(position);
        group.userData = {
            type: 'excitedTarget',
            excitationLevel: excitationLevel,
            life: 1.0,
            decay: 0.015,
            phase: 0,
            core: core,
            center: center,
            baseSize: targetSize
        };

        return group;
    }

    // Update excited target
    updateExcitedTarget(excited) {
        if (!excited || !excited.userData) return false;

        excited.userData.life -= excited.userData.decay;
        excited.userData.phase += 0.12;

        const vibration = Math.sin(excited.userData.phase);

        // Vibrate/pulsate core
        if (excited.userData.core) {
            const scale = 1 + vibration * 0.03 * excited.userData.excitationLevel;
            excited.userData.core.scale.set(scale, scale, scale);
        }

        // Oscillate shells
        excited.children.forEach(child => {
            if (child.userData && child.userData.oscillateSpeed) {
                child.userData.oscillatePhase += child.userData.oscillateSpeed;
                const osc = Math.sin(child.userData.oscillatePhase);
                const oscScale = 1 + osc * 0.05;
                child.scale.set(oscScale, oscScale, oscScale);
            }
        });

        return excited.userData.life > 0;
    }

    // Create particle emission burst (for decay/de-excitation)
    createEmissionBurst(origin, particleType = 'neutron', count = 1) {
        const particles = [];

        for (let i = 0; i < count; i++) {
            let particle;
            if (particleType === 'neutron') {
                particle = this.createNeutron(origin);
            } else if (particleType === 'proton') {
                particle = this.createProton(origin);
            } else if (particleType === 'alpha') {
                particle = this.createAlpha(origin);
            }

            if (particle) {
                // Random emission direction
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const speed = 0.1 + Math.random() * 0.15;

                particle.userData.velocity = new THREE.Vector3(
                    speed * Math.sin(phi) * Math.cos(theta),
                    speed * Math.sin(phi) * Math.sin(theta),
                    speed * Math.cos(phi)
                );

                particles.push(particle);
            }
        }

        return particles;
    }
}

// Export for use in other modules
window.ParticleSystem = ParticleSystem;
