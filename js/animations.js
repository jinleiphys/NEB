/**
 * Animation System for Nuclear Breakup Visualization
 * Handles different breakup scenarios and animations
 *
 * NEB (Nonelastic Breakup) Processes for d+A reactions:
 * 1. Elastic Breakup (EBU) - Coulomb/nuclear breakup, target remains in ground state
 * 2. Nonelastic Breakup (NEB) - Target is excited or absorbs a fragment
 *    - Inelastic Breakup: Target excited, projectile breaks up
 *    - Incomplete Fusion: One fragment absorbed, forms compound nucleus
 *    - Complete Fusion: All fragments absorbed (not shown here)
 */

class BreakupAnimator {
    constructor(scene, particleSystem) {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.animations = [];
        this.isPlaying = false;
        this.speed = 1;
        this.currentAnimation = null;

        // Extended effect arrays for new physics
        this.gammaRays = [];
        this.energyWaves = [];
        this.compoundNuclei = [];
        this.excitedTargets = [];
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
    // Models incomplete fusion: d + A → p + (n + A)* → p + B + γ
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
            escapingFragment: null,
            // New physics tracking
            compoundNucleus: null,
            excitedTarget: null,
            gammaRays: [],
            energyWaves: [],
            resonanceTime: 0,
            maxResonanceTime: 80 // frames to show compound nucleus
        };

        // Starting position - start to the left of target
        const startX = target.position.x - 12;
        projectile.position.set(startX, impactParam, 0);
        projectile.userData.velocity = new THREE.Vector3(0.2, 0, 0);

        console.log('Nonelastic breakup created, projectile at:', projectile.position);

        return animation;
    }

    // Create inelastic breakup animation (target excitation without absorption)
    // Models: d + A → d' + A* where target gets excited
    createInelasticBreakup(projectile, target, impactParam = 2.5) {
        const animation = {
            type: 'inelastic',
            projectile: projectile,
            target: target,
            phase: 'approach',
            time: 0,
            impactParam: impactParam,
            fragments: [],
            trails: [],
            effects: [],
            excitedTarget: null,
            gammaRays: [],
            energyWaves: []
        };

        const startX = target.position.x - 12;
        projectile.position.set(startX, impactParam, 0);
        projectile.userData.velocity = new THREE.Vector3(0.2, 0, 0);

        console.log('Inelastic breakup created');
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

    // Update nonelastic breakup - Enhanced with compound nucleus and gamma emission
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
                        // Absorption complete - transition to compound nucleus formation
                        animation.phase = 'compound';
                        this.createCompoundNucleusEffect(animation, absorbed);
                    }
                }
                break;

            case 'compound':
                // Compound nucleus resonance state - the key physics!
                animation.resonanceTime += this.speed;

                // Update compound nucleus pulsation
                if (animation.compoundNucleus) {
                    const alive = this.particleSystem.updateCompoundNucleus(animation.compoundNucleus);
                    if (!alive) {
                        this.scene.remove(animation.compoundNucleus);
                        animation.compoundNucleus = null;
                    }
                }

                // Continue moving escaping fragment during resonance
                if (animation.escapingFragment) {
                    const frag = animation.escapingFragment;
                    frag.position.add(frag.userData.velocity.clone().multiplyScalar(this.speed));
                    if (animation.trails[0]) {
                        this.particleSystem.updateTrail(animation.trails[0]);
                    }
                }

                // After resonance time, emit gamma rays (de-excitation)
                if (animation.resonanceTime > animation.maxResonanceTime * 0.6 && animation.gammaRays.length === 0) {
                    this.emitGammaRays(animation);
                }

                // Update gamma rays
                animation.gammaRays = animation.gammaRays.filter(gamma => {
                    const alive = this.particleSystem.updateGammaRay(gamma);
                    if (!alive) {
                        this.scene.remove(gamma);
                    }
                    return alive;
                });

                // Transition to decay after resonance
                if (animation.resonanceTime > animation.maxResonanceTime) {
                    animation.phase = 'decay';
                    this.initiateDecayPhase(animation);
                }
                break;

            case 'decay':
                // De-excitation complete, show final state

                // Update energy wave
                animation.energyWaves = animation.energyWaves.filter(wave => {
                    const alive = this.particleSystem.updateEnergyWave(wave);
                    if (!alive) {
                        this.scene.remove(wave);
                    }
                    return alive;
                });

                // Update remaining gamma rays
                animation.gammaRays = animation.gammaRays.filter(gamma => {
                    const alive = this.particleSystem.updateGammaRay(gamma);
                    if (!alive) {
                        this.scene.remove(gamma);
                    }
                    return alive;
                });

                // Update effects
                this.updateEffects(animation);

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

            case 'absorption':
                // Legacy phase - kept for compatibility
                this.updateEffects(animation);

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

    // Helper to update visual effects
    updateEffects(animation) {
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
    }

    // Create compound nucleus effect - key for NEB visualization
    createCompoundNucleusEffect(animation, absorbedFragment) {
        // Remove absorbed fragment
        this.scene.remove(absorbedFragment);

        // Hide original target temporarily
        animation.target.visible = false;

        // Create compound nucleus at target position
        const compound = this.particleSystem.createCompoundNucleus(
            animation.target.position.clone(),
            2
        );
        this.scene.add(compound);
        animation.compoundNucleus = compound;

        // Create initial energy release wave
        const energyWave = this.particleSystem.createEnergyWave(
            animation.target.position.clone(),
            0xff6600,
            6
        );
        this.scene.add(energyWave);
        animation.energyWaves.push(energyWave);

        // Create initial absorption flash
        const flash = this.particleSystem.createAbsorptionFlash(
            animation.target.position,
            2
        );
        this.scene.add(flash);
        animation.effects.push(flash);

        console.log('Compound nucleus formed - resonance state');
    }

    // Emit gamma rays from de-excitation
    emitGammaRays(animation) {
        const origin = animation.target.position.clone();

        // Emit 3-5 gamma rays in cascade
        const gammaCount = 3 + Math.floor(Math.random() * 3);
        const gammas = this.particleSystem.createGammaRays(origin, gammaCount);

        gammas.forEach(gamma => {
            this.scene.add(gamma);
            animation.gammaRays.push(gamma);
        });

        console.log(`Emitting ${gammaCount} gamma rays from de-excitation`);
    }

    // Initiate decay phase after compound nucleus
    initiateDecayPhase(animation) {
        // Remove compound nucleus if still present
        if (animation.compoundNucleus) {
            this.scene.remove(animation.compoundNucleus);
            animation.compoundNucleus = null;
        }

        // Show target again (now in different state - product nucleus)
        animation.target.visible = true;

        // Create final energy wave
        const finalWave = this.particleSystem.createEnergyWave(
            animation.target.position.clone(),
            0x00ffff,
            8
        );
        this.scene.add(finalWave);
        animation.energyWaves.push(finalWave);

        // More gamma emission
        const additionalGammas = this.particleSystem.createGammaRays(
            animation.target.position.clone(),
            2
        );
        additionalGammas.forEach(gamma => {
            this.scene.add(gamma);
            animation.gammaRays.push(gamma);
        });

        console.log('Decay phase initiated - final state');
    }

    // Update inelastic breakup (target excitation)
    updateInelasticBreakup(animation, delta) {
        const { projectile, target, phase } = animation;
        animation.time += delta * this.speed;

        switch (phase) {
            case 'approach':
                const vel = projectile.userData.velocity.clone().multiplyScalar(this.speed);
                projectile.position.add(vel);

                const distToTarget = projectile.position.distanceTo(target.position);

                // Coulomb force
                if (distToTarget < 6) {
                    const force = new THREE.Vector3()
                        .subVectors(projectile.position, target.position)
                        .normalize()
                        .multiplyScalar(0.0025 / (distToTarget * distToTarget) * this.speed);
                    projectile.userData.velocity.add(force);
                }

                // At closest approach, excite target
                if (distToTarget < 3.5 && !animation.excitedTarget) {
                    this.initiateInelasticBreakup(animation);
                }

                // Check if projectile has passed
                if (projectile.position.x > target.position.x + 5) {
                    animation.phase = 'escape';
                }
                break;

            case 'escape':
                // Projectile continues (possibly as fragments)
                animation.fragments.forEach((frag, index) => {
                    frag.position.add(frag.userData.velocity.clone().multiplyScalar(this.speed));
                    if (animation.trails[index]) {
                        this.particleSystem.updateTrail(animation.trails[index]);
                    }
                });

                // Update excited target
                if (animation.excitedTarget) {
                    const alive = this.particleSystem.updateExcitedTarget(animation.excitedTarget);
                    if (!alive) {
                        this.scene.remove(animation.excitedTarget);
                        animation.excitedTarget = null;
                        // Emit gamma rays when excitation ends
                        this.emitTargetGammas(animation);
                    }
                }

                // Update gamma rays
                animation.gammaRays = animation.gammaRays.filter(gamma => {
                    const alive = this.particleSystem.updateGammaRay(gamma);
                    if (!alive) {
                        this.scene.remove(gamma);
                    }
                    return alive;
                });

                // Update energy waves
                animation.energyWaves = animation.energyWaves.filter(wave => {
                    const alive = this.particleSystem.updateEnergyWave(wave);
                    if (!alive) {
                        this.scene.remove(wave);
                    }
                    return alive;
                });

                // Check completion
                const allFar = animation.fragments.every(f =>
                    f.position.distanceTo(target.position) > 15
                );
                if (allFar && animation.gammaRays.length === 0 && !animation.excitedTarget) {
                    animation.phase = 'complete';
                }
                break;

            case 'complete':
                return true;
        }

        return false;
    }

    // Initiate inelastic breakup
    initiateInelasticBreakup(animation) {
        const { projectile, target } = animation;

        // Remove original projectile
        this.scene.remove(projectile);

        // Create fragments (breakup may or may not occur)
        const type = projectile.userData.type;
        let fragment1, fragment2;

        switch (type) {
            case 'deuteron':
                fragment1 = this.particleSystem.createProton(projectile.position);
                fragment2 = this.particleSystem.createNeutron(projectile.position);
                fragment1.userData.velocity = new THREE.Vector3(0.1, 0.04, 0.01);
                fragment2.userData.velocity = new THREE.Vector3(0.08, -0.03, -0.01);
                break;
            default:
                fragment1 = this.particleSystem.createProton(projectile.position);
                fragment2 = this.particleSystem.createNeutron(projectile.position);
                fragment1.userData.velocity = new THREE.Vector3(0.1, 0.04, 0);
                fragment2.userData.velocity = new THREE.Vector3(0.08, -0.04, 0);
        }

        fragment1.position.add(new THREE.Vector3(0, 0.2, 0));
        fragment2.position.add(new THREE.Vector3(0, -0.2, 0));

        this.scene.add(fragment1);
        this.scene.add(fragment2);
        animation.fragments.push(fragment1, fragment2);

        // Create trails
        const trail1 = this.particleSystem.createTrail(fragment1, 0xff4444);
        const trail2 = this.particleSystem.createTrail(fragment2, 0x4488ff);
        this.scene.add(trail1);
        this.scene.add(trail2);
        animation.trails.push(trail1, trail2);

        // Hide original target, show excited version
        target.visible = false;
        const excited = this.particleSystem.createExcitedTarget(
            target.position.clone(),
            2,
            1.5
        );
        this.scene.add(excited);
        animation.excitedTarget = excited;

        // Create energy wave from excitation
        const wave = this.particleSystem.createEnergyWave(
            target.position.clone(),
            0xff8844,
            5
        );
        this.scene.add(wave);
        animation.energyWaves.push(wave);

        // Initial breakup flash
        const flash = this.particleSystem.createExplosion(projectile.position, 0xaaffaa);
        flash.forEach(p => this.scene.add(p));
        animation.effects.push(...flash);

        console.log('Inelastic breakup initiated - target excited');
    }

    // Emit gamma rays from excited target de-excitation
    emitTargetGammas(animation) {
        const origin = animation.target.position.clone();
        animation.target.visible = true; // Show target again

        const gammas = this.particleSystem.createGammaRays(origin, 2);
        gammas.forEach(gamma => {
            this.scene.add(gamma);
            animation.gammaRays.push(gamma);
        });

        // Final energy release
        const wave = this.particleSystem.createEnergyWave(origin, 0x00ffff, 6);
        this.scene.add(wave);
        animation.energyWaves.push(wave);
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
            let isComplete = false;

            switch (this.currentAnimation.type) {
                case 'elastic':
                    isComplete = this.updateElasticBreakup(this.currentAnimation, delta);
                    break;
                case 'nonelastic':
                    isComplete = this.updateNonelasticBreakup(this.currentAnimation, delta);
                    break;
                case 'inelastic':
                    isComplete = this.updateInelasticBreakup(this.currentAnimation, delta);
                    break;
                default:
                    isComplete = this.updateNonelasticBreakup(this.currentAnimation, delta);
            }

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

            // Clean up new physics effects
            if (this.currentAnimation.gammaRays) {
                this.currentAnimation.gammaRays.forEach(g => this.scene.remove(g));
            }
            if (this.currentAnimation.energyWaves) {
                this.currentAnimation.energyWaves.forEach(w => this.scene.remove(w));
            }
            if (this.currentAnimation.compoundNucleus) {
                this.scene.remove(this.currentAnimation.compoundNucleus);
            }
            if (this.currentAnimation.excitedTarget) {
                this.scene.remove(this.currentAnimation.excitedTarget);
            }

            // Restore target visibility
            if (this.currentAnimation.target) {
                this.currentAnimation.target.visible = true;
            }

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
