/**
 * Animation System for Nuclear Breakup Visualization
 * Handles different breakup scenarios and animations
 */

class BreakupAnimator {
    constructor(scene, particleSystem) {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.animations = [];
        this.isPlaying = false;
        this.speed = 1;
        this.currentAnimation = null;
    }

    // Set animation speed
    setSpeed(speed) {
        this.speed = speed;
    }

    // Elastic breakup animation
    createElasticBreakup(projectile, target, impactParam = 3) {
        const animation = {
            type: 'elastic',
            projectile: projectile,
            target: target,
            phase: 'approach',
            time: 0,
            impactParam: impactParam,
            fragments: [],
            trails: [],
            effects: []
        };

        // Starting position - start to the left of target
        const startX = target.position.x - 12;
        projectile.position.set(startX, impactParam, 0);
        projectile.userData.velocity = new THREE.Vector3(0.2, 0, 0);

        console.log('Elastic breakup created, projectile at:', projectile.position);

        return animation;
    }

    // Nonelastic breakup animation (with absorption)
    createNonelasticBreakup(projectile, target, impactParam = 2) {
        const animation = {
            type: 'nonelastic',
            projectile: projectile,
            target: target,
            phase: 'approach',
            time: 0,
            impactParam: impactParam,
            fragments: [],
            trails: [],
            effects: [],
            absorbedFragment: null,
            escapingFragment: null
        };

        // Starting position - start to the left of target
        const startX = target.position.x - 12;
        projectile.position.set(startX, impactParam, 0);
        projectile.userData.velocity = new THREE.Vector3(0.2, 0, 0);

        console.log('Nonelastic breakup created, projectile at:', projectile.position);

        return animation;
    }

    // Update elastic breakup
    updateElasticBreakup(animation, delta) {
        const { projectile, target, phase, impactParam } = animation;
        animation.time += delta * this.speed;

        switch (phase) {
            case 'approach':
                // Move projectile toward target
                const vel = projectile.userData.velocity.clone().multiplyScalar(this.speed);
                projectile.position.add(vel);

                // Coulomb deflection
                const distToTarget = projectile.position.distanceTo(target.position);

                if (distToTarget < 6) {
                    // Apply Coulomb force (repulsion)
                    const force = new THREE.Vector3()
                        .subVectors(projectile.position, target.position)
                        .normalize()
                        .multiplyScalar(0.003 / (distToTarget * distToTarget) * this.speed);
                    projectile.userData.velocity.add(force);
                }

                // Check for breakup distance
                if (distToTarget < 3.5) {
                    console.log('Elastic breakup triggered at distance:', distToTarget);
                    animation.phase = 'breakup';
                    this.initiateElasticBreakup(animation);
                }
                break;

            case 'breakup':
                // Update fragments
                animation.fragments.forEach((fragment, index) => {
                    // Apply Coulomb forces from target
                    const dist = fragment.position.distanceTo(target.position);
                    if (dist > 0.5) {
                        const coulombForce = new THREE.Vector3()
                            .subVectors(fragment.position, target.position)
                            .normalize()
                            .multiplyScalar(0.001 * fragment.userData.charge / (dist * dist) * this.speed);
                        fragment.userData.velocity.add(coulombForce);
                    }

                    // Move fragment
                    fragment.position.add(fragment.userData.velocity.clone().multiplyScalar(this.speed));

                    // Update trail
                    if (animation.trails[index]) {
                        this.particleSystem.updateTrail(animation.trails[index]);
                    }
                });

                // Check if fragments have escaped
                const allEscaped = animation.fragments.every(f =>
                    f.position.distanceTo(target.position) > 15
                );
                if (allEscaped) {
                    animation.phase = 'complete';
                }
                break;

            case 'complete':
                return true;
        }

        return false;
    }

    // Initiate elastic breakup - fragments scatter without absorption
    initiateElasticBreakup(animation) {
        const { projectile, target } = animation;

        // Remove projectile from scene
        this.scene.remove(projectile);

        // Create fragments based on projectile type
        const type = projectile.userData.type;
        let fragment1, fragment2;

        switch (type) {
            case 'deuteron':
                fragment1 = this.particleSystem.createProton(projectile.position);
                fragment2 = this.particleSystem.createNeutron(projectile.position);
                fragment1.userData.velocity = new THREE.Vector3(0.08, 0.06, 0.02);
                fragment2.userData.velocity = new THREE.Vector3(0.08, -0.04, -0.02);
                break;

            case 'li6':
                fragment1 = this.particleSystem.createAlpha(projectile.position);
                fragment2 = this.particleSystem.createDeuteron(projectile.position);
                fragment1.userData.velocity = new THREE.Vector3(0.06, 0.05, 0.01);
                fragment2.userData.velocity = new THREE.Vector3(0.1, -0.03, -0.01);
                break;

            case 'li7':
                fragment1 = this.particleSystem.createAlpha(projectile.position);
                fragment2 = this.particleSystem.createProton(projectile.position); // Simplified triton
                fragment1.userData.velocity = new THREE.Vector3(0.06, 0.04, 0);
                fragment2.userData.velocity = new THREE.Vector3(0.1, -0.05, 0);
                break;

            default:
                fragment1 = this.particleSystem.createProton(projectile.position);
                fragment2 = this.particleSystem.createNeutron(projectile.position);
                fragment1.userData.velocity = new THREE.Vector3(0.08, 0.05, 0);
                fragment2.userData.velocity = new THREE.Vector3(0.08, -0.05, 0);
        }

        // Offset fragments slightly
        fragment1.position.add(new THREE.Vector3(0, 0.3, 0));
        fragment2.position.add(new THREE.Vector3(0, -0.3, 0));

        // Add to scene and animation
        this.scene.add(fragment1);
        this.scene.add(fragment2);
        animation.fragments.push(fragment1, fragment2);

        // Create trails
        const trail1 = this.particleSystem.createTrail(fragment1, 0xff4444);
        const trail2 = this.particleSystem.createTrail(fragment2, 0x4488ff);
        this.scene.add(trail1);
        this.scene.add(trail2);
        animation.trails.push(trail1, trail2);

        // Create breakup flash
        const flash = this.particleSystem.createExplosion(projectile.position, 0xaaffaa);
        flash.forEach(p => this.scene.add(p));
        animation.effects.push(...flash);
    }

    // Update nonelastic breakup
    updateNonelasticBreakup(animation, delta) {
        const { projectile, target, phase } = animation;
        animation.time += delta * this.speed;

        switch (phase) {
            case 'approach':
                // Move projectile toward target
                const velNE = projectile.userData.velocity.clone().multiplyScalar(this.speed);
                projectile.position.add(velNE);

                // Coulomb deflection (weaker - closer approach)
                const distToTargetNE = projectile.position.distanceTo(target.position);
                if (distToTargetNE < 6) {
                    const force = new THREE.Vector3()
                        .subVectors(projectile.position, target.position)
                        .normalize()
                        .multiplyScalar(0.002 / (distToTargetNE * distToTargetNE) * this.speed);
                    projectile.userData.velocity.add(force);
                }

                // Check for breakup distance (closer than elastic)
                if (distToTargetNE < 3) {
                    console.log('Nonelastic breakup triggered at distance:', distToTargetNE);
                    animation.phase = 'breakup';
                    this.initiateNonelasticBreakup(animation);
                }
                break;

            case 'breakup':
                // Update escaping fragment
                if (animation.escapingFragment) {
                    const frag = animation.escapingFragment;
                    const dist = frag.position.distanceTo(target.position);

                    // Coulomb force
                    if (dist > 0.5) {
                        const coulombForce = new THREE.Vector3()
                            .subVectors(frag.position, target.position)
                            .normalize()
                            .multiplyScalar(0.001 * frag.userData.charge / (dist * dist) * this.speed);
                        frag.userData.velocity.add(coulombForce);
                    }

                    frag.position.add(frag.userData.velocity.clone().multiplyScalar(this.speed));

                    // Update trail
                    if (animation.trails[0]) {
                        this.particleSystem.updateTrail(animation.trails[0]);
                    }
                }

                // Update absorbed fragment (moving toward target)
                if (animation.absorbedFragment) {
                    const absorbed = animation.absorbedFragment;
                    const distToCore = absorbed.position.distanceTo(target.position);

                    if (distToCore > 2.2) {
                        // Move toward target
                        const toTarget = new THREE.Vector3()
                            .subVectors(target.position, absorbed.position)
                            .normalize()
                            .multiplyScalar(0.08 * this.speed);
                        absorbed.position.add(toTarget);
                    } else {
                        // Absorption complete
                        animation.phase = 'absorption';
                        this.createAbsorptionEffect(animation, absorbed);
                    }
                }
                break;

            case 'absorption':
                // Update effects
                animation.effects = animation.effects.filter(effect => {
                    if (!effect || !effect.userData) {
                        return false;
                    }

                    // Absorption flash (has ring and flash children)
                    if (effect.userData.ring !== undefined) {
                        const alive = this.particleSystem.updateAbsorptionFlash(effect);
                        if (!alive) {
                            this.scene.remove(effect);
                        }
                        return alive;
                    }
                    // Explosion particles (have velocity and decay)
                    else if (effect.userData.velocity && effect.userData.decay !== undefined) {
                        effect.position.add(effect.userData.velocity);
                        effect.userData.velocity.multiplyScalar(0.95);
                        effect.userData.life -= effect.userData.decay;

                        if (effect.material) {
                            effect.material.opacity = Math.max(0, effect.userData.life);
                        }

                        if (effect.userData.life <= 0) {
                            this.scene.remove(effect);
                            return false;
                        }
                        return true;
                    }

                    return false;
                });

                // Continue moving escaping fragment
                if (animation.escapingFragment) {
                    const frag = animation.escapingFragment;
                    frag.position.add(frag.userData.velocity.clone().multiplyScalar(this.speed));

                    if (animation.trails[0]) {
                        this.particleSystem.updateTrail(animation.trails[0]);
                    }

                    if (frag.position.distanceTo(target.position) > 15) {
                        animation.phase = 'complete';
                    }
                }
                break;

            case 'complete':
                return true;
        }

        // Update explosion particles
        this.particleSystem.updateExplosion(animation.effects.filter(e => e.userData && e.userData.velocity));

        return false;
    }

    // Initiate nonelastic breakup - one fragment absorbed
    initiateNonelasticBreakup(animation) {
        const { projectile, target } = animation;

        // Remove projectile
        this.scene.remove(projectile);

        // Create fragments
        const type = projectile.userData.type;
        let escapingFrag, absorbedFrag;

        switch (type) {
            case 'deuteron':
                // Neutron escapes, proton absorbed (or vice versa)
                escapingFrag = this.particleSystem.createNeutron(projectile.position);
                absorbedFrag = this.particleSystem.createProton(projectile.position);
                escapingFrag.userData.velocity = new THREE.Vector3(0.1, 0.08, 0.02);
                break;

            case 'li6':
                // Alpha escapes, deuteron absorbed
                escapingFrag = this.particleSystem.createAlpha(projectile.position);
                absorbedFrag = this.particleSystem.createDeuteron(projectile.position);
                escapingFrag.userData.velocity = new THREE.Vector3(0.08, 0.06, 0);
                break;

            case 'li7':
                // Alpha escapes, triton absorbed
                escapingFrag = this.particleSystem.createAlpha(projectile.position);
                absorbedFrag = this.particleSystem.createProton(projectile.position); // Simplified
                escapingFrag.userData.velocity = new THREE.Vector3(0.08, 0.05, 0);
                break;

            default:
                escapingFrag = this.particleSystem.createNeutron(projectile.position);
                absorbedFrag = this.particleSystem.createProton(projectile.position);
                escapingFrag.userData.velocity = new THREE.Vector3(0.1, 0.06, 0);
        }

        // Position fragments
        escapingFrag.position.add(new THREE.Vector3(0, 0.5, 0));
        absorbedFrag.position.add(new THREE.Vector3(0, -0.3, 0));

        // Add to scene
        this.scene.add(escapingFrag);
        this.scene.add(absorbedFrag);

        animation.escapingFragment = escapingFrag;
        animation.absorbedFragment = absorbedFrag;
        animation.fragments.push(escapingFrag, absorbedFrag);

        // Create trail for escaping fragment only
        const trail = this.particleSystem.createTrail(escapingFrag,
            escapingFrag.userData.type === 'neutron' ? 0x4488ff : 0xffaa00);
        this.scene.add(trail);
        animation.trails.push(trail);

        // Create breakup effect
        const breakupFlash = this.particleSystem.createExplosion(projectile.position, 0xaaffaa);
        breakupFlash.forEach(p => this.scene.add(p));
        animation.effects.push(...breakupFlash);
    }

    // Create absorption effect
    createAbsorptionEffect(animation, absorbedFragment) {
        // Remove absorbed fragment
        this.scene.remove(absorbedFragment);

        // Create absorption flash
        const flash = this.particleSystem.createAbsorptionFlash(
            animation.target.position,
            2
        );
        this.scene.add(flash);
        animation.effects.push(flash);

        // Create secondary particles (gamma-like effects)
        const gammas = this.particleSystem.createExplosion(
            animation.target.position,
            0xffff00
        );
        gammas.forEach(p => {
            p.userData.velocity.multiplyScalar(2);
            this.scene.add(p);
        });
        animation.effects.push(...gammas);
    }

    // Run animation loop
    update(delta) {
        if (!this.currentAnimation || !this.isPlaying) return false;

        try {
            const isComplete = this.currentAnimation.type === 'elastic'
                ? this.updateElasticBreakup(this.currentAnimation, delta)
                : this.updateNonelasticBreakup(this.currentAnimation, delta);

            if (isComplete) {
                this.isPlaying = false;
                console.log('Animation complete');
                return true;
            }
        } catch (error) {
            console.error('Animation update error:', error);
            this.isPlaying = false;
            return true;
        }

        return false;
    }

    // Start animation
    play(animation) {
        console.log('Playing animation:', animation.type);
        console.log('Projectile position:', animation.projectile.position);
        console.log('Target position:', animation.target.position);
        this.currentAnimation = animation;
        this.isPlaying = true;
    }

    // Stop animation
    stop() {
        this.isPlaying = false;
    }

    // Reset animation
    reset() {
        if (this.currentAnimation) {
            // Clean up fragments
            this.currentAnimation.fragments.forEach(f => this.scene.remove(f));
            this.currentAnimation.trails.forEach(t => this.scene.remove(t));
            this.currentAnimation.effects.forEach(e => this.scene.remove(e));

            if (this.currentAnimation.projectile) {
                this.scene.remove(this.currentAnimation.projectile);
            }
        }
        this.currentAnimation = null;
        this.isPlaying = false;
    }

    // Clean up
    cleanup() {
        this.reset();
    }
}

// Export
window.BreakupAnimator = BreakupAnimator;
