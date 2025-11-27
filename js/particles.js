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

    // Create target nucleus (heavy nucleus)
    createTargetNucleus(position = { x: 0, y: 0, z: 0 }, size = 2) {
        const group = new THREE.Group();

        // Core sphere - golden/amber color like a real nucleus visualization
        const coreGeom = new THREE.SphereGeometry(size, 64, 64);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0xd4a574,
            emissive: 0x8b6914,
            emissiveIntensity: 0.2,
            shininess: 80,
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Inner nucleons - densely packed inside the nucleus
        const nucleonGeom = new THREE.SphereGeometry(size * 0.15, 12, 12);
        const protonMat = new THREE.MeshPhongMaterial({
            color: 0xff6b6b,
            emissive: 0xff3333,
            emissiveIntensity: 0.3
        });
        const neutronMat = new THREE.MeshPhongMaterial({
            color: 0x4dabf7,
            emissive: 0x2288ff,
            emissiveIntensity: 0.3
        });

        // Create nucleons inside the nucleus (not on surface)
        for (let i = 0; i < 50; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.random() * size * 0.85; // Inside the nucleus

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            const mat = Math.random() > 0.45 ? protonMat : neutronMat; // Slightly more neutrons
            const nucleon = new THREE.Mesh(nucleonGeom, mat);
            nucleon.position.set(x, y, z);
            group.add(nucleon);
        }

        // Soft outer glow - warm color
        const glowGeom = new THREE.SphereGeometry(size * 1.15, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa55,
            transparent: true,
            opacity: 0.08
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        group.add(glow);

        // Coulomb field - subtle electric field lines
        const fieldGeom = new THREE.SphereGeometry(size * 1.4, 24, 24);
        const fieldMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.05,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeom, fieldMat);
        group.add(field);

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
}

// Export for use in other modules
window.ParticleSystem = ParticleSystem;
