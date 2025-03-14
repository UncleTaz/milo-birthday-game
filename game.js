class Game {
    constructor() {
        try {
            console.log('Initializing game constructor...');
            
            // Get canvas element
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            console.log('Canvas element found');
            
            // Get canvas context
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get canvas context');
            }
            console.log('Canvas context created');
            
            // Set canvas dimensions
            this.canvas.width = 1984;  // Full image width
            this.canvas.height = 1088; // Full image height
            console.log(`Canvas dimensions set to ${this.canvas.width}x${this.canvas.height}`);
            
            // Game states
            this.gameState = 'title';
            this.timeLeft = 60;
            this.cakesCollected = 0;
            this.totalCakes = 13;
            this.victoryPending = false;
            
            // Initialize all other properties but don't start the game yet
            this.initializeProperties();
            
            console.log('Game constructor initialized successfully');
        } catch (error) {
            console.error('Error in game constructor:', error);
            throw error;
        }
    }

    initializeProperties() {
        // Player properties
        this.player = {
            x: 200,  // Starting on first platform
            y: 0,    // Will be set in restart()
            width: 20,  // Reduced collision width for tighter platform detection
            height: 88, // 44 * 2 (sprite height * scale)
            visualWidth: 50,  // Full sprite frame width for drawing
            visualHeight: 88, // Full sprite frame height for drawing
            speed: 7,  // Slightly faster movement
            velocityX: 0,
            velocityY: 0,
            isJumping: false,
            direction: 1,
            currentAnimation: 'idle',
            frameIndex: 0,
            frameCount: 0,
            isMoving: false,
            isDying: false,
            deathAnimationComplete: false,
            collisionOffset: 30 // Offset to align feet with platform
        };

        // Animation properties
        this.animations = {
            idle: { frames: 10, speed: 10, spriteHeight: 44, spriteWidth: 35 },
            run: { frames: 16, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            jumpStart: { frames: 3, speed: 6, spriteHeight: 44, spriteWidth: 35 },
            jumpTransition: { frames: 3, speed: 6, spriteHeight: 44, spriteWidth: 35 },
            jumpFall: { frames: 3, speed: 6, spriteHeight: 44, spriteWidth: 35 },
            attack: { frames: 6, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            death: { frames: 9, speed: 8, spriteHeight: 44, spriteWidth: 35 }
        };
        
        // Level properties
        this.currentLevel = 0;
        this.levels = ['entrance', 'mine', 'trees'];
        this.cakes = [];
        this.backgrounds = {};

        // Platform definitions - 13 evenly distributed horizontal platforms
        this.platforms = {
            entrance: [
                // Top row (y: 250-300)
                {x: 200, y: 250, width: 200, height: 20},     // Platform 1
                {x: 800, y: 300, width: 200, height: 20},     // Platform 2
                {x: 1400, y: 250, width: 200, height: 20},    // Platform 3
                
                // Upper middle row (y: 400-450)
                {x: 400, y: 400, width: 200, height: 20},     // Platform 4
                {x: 1200, y: 450, width: 200, height: 20},    // Platform 5
                
                // Middle row (y: 550-600)
                {x: 200, y: 550, width: 200, height: 20},     // Platform 6
                {x: 800, y: 600, width: 200, height: 20},     // Platform 7
                {x: 1400, y: 550, width: 200, height: 20},    // Platform 8
                
                // Lower middle row (y: 700-750)
                {x: 400, y: 750, width: 200, height: 20},     // Platform 9
                {x: 1200, y: 700, width: 200, height: 20},    // Platform 10
                
                // Bottom row (y: 900-950)
                {x: 200, y: 900, width: 200, height: 20},     // Platform 11
                {x: 800, y: 950, width: 200, height: 20},     // Platform 12
                {x: 1400, y: 900, width: 200, height: 20}     // Platform 13
            ]
        };

        // No slopes in this version
        this.slopes = {
            entrance: []
        };
    }

    // Static method to create and initialize the game
    static async create() {
        try {
            const game = new Game();
            console.log('Game instance created');
            await game.init();
            return game;
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    async init() {
        try {
            console.log('Initializing game...');
            // Load assets
            await this.loadAssets();
            console.log('Assets loaded');
            
            this.setupEventListeners();
            console.log('Event listeners set up');
            
            this.setupCakes();
            console.log('Cakes set up');
            
            this.startGameLoop();
            console.log('Game loop started');
            
            this.restart();  // Initialize player position after assets are loaded
            console.log('Player position initialized');
            
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    async loadAssets() {
        // Load main background image and victory background
        try {
            this.mainBackground = new Image();
            this.japanScenery = new Image();
            
            // Load both background images
            await Promise.all([
                new Promise((resolve, reject) => {
                    this.mainBackground.src = 'background0.png';
                    this.mainBackground.onload = resolve;
                    this.mainBackground.onerror = () => {
                        console.error('Failed to load background0.png');
                        reject(new Error('Failed to load background0.png'));
                    };
                }),
                new Promise((resolve, reject) => {
                    this.japanScenery.src = 'Japan platform game scenery.png';
                    this.japanScenery.onload = resolve;
                    this.japanScenery.onerror = () => {
                        console.error('Failed to load Japan platform game scenery.png');
                        reject(new Error('Failed to load Japan platform game scenery.png'));
                    };
                })
            ]);
            console.log('Successfully loaded background images');
        } catch (error) {
            console.error('Error loading background0.png:', error);
        }

        // Load log platform image
        this.logPlatform = new Image();
        await new Promise((resolve, reject) => {
            this.logPlatform.src = 'Log.png';
            this.logPlatform.onload = resolve;
            this.logPlatform.onerror = () => {
                console.error('Failed to load Log.png');
                reject(new Error('Failed to load Log.png'));
            };
        });
        console.log('Successfully loaded Log.png');

        // Load spikes image
        try {
            this.spikesImage = new Image();
            await new Promise((resolve, reject) => {
                this.spikesImage.src = 'spikes.png';
                this.spikesImage.onload = resolve;
                this.spikesImage.onerror = () => {
                    console.error('Failed to load spikes.png');
                    reject(new Error('Failed to load spikes.png'));
                };
            });
            console.log('Successfully loaded spikes.png');
        } catch (error) {
            console.error('Error loading spikes.png:', error);
        }

        // Load level background images
        for (let level of this.levels) {
            try {
                this.backgrounds[level] = new Image();
                this.backgrounds[level].src = `${level}.png`;
                await new Promise((resolve, reject) => {
                    this.backgrounds[level].onload = resolve;
                    this.backgrounds[level].onerror = () => {
                        console.error(`Failed to load ${level}.png`);
                        reject(new Error(`Failed to load ${level}.png`));
                    };
                });
                console.log(`Successfully loaded ${level}.png`);
            } catch (error) {
                console.error(`Error loading ${level}.png:`, error);
            }
        }

        // Load player sprites
        this.sprites = {
            idle: new Image(),
            run: new Image(),
            jumpStart: new Image(),
            jumpTransition: new Image(),
            jumpFall: new Image(),
            attack: new Image(),
            death: new Image()
        };

        // Update sprite paths to match your folder structure
        this.sprites.idle.src = 'Sprites/IDLE.png';
        this.sprites.run.src = 'Sprites/RUN.png';
        this.sprites.jumpStart.src = 'Sprites/JUMP-START.png';
        this.sprites.jumpTransition.src = 'Sprites/JUMP-TRANSITION.png';
        this.sprites.jumpFall.src = 'Sprites/JUMP-FALL.png';
        this.sprites.attack.src = 'Sprites/ATTACK 1.png';
        this.sprites.death.src = 'Sprites/DEATH.png';

        try {
            // Wait for all sprites to load and set initial player size based on sprite
            await Promise.all(Object.values(this.sprites).map(sprite => 
                new Promise((resolve, reject) => {
                    sprite.onload = () => {
                        try {
                            // Calculate dimensions for each animation type
                            const scale = 2; // Reduced scale factor for better proportions
                            
                            // Find which sprite this is
                            const animationType = Object.entries(this.sprites).find(([_, s]) => s === sprite)[0];
                            const animation = this.animations[animationType];
                            
                            // Calculate frame dimensions for this specific animation
                            const frameWidth = sprite.width / animation.frames;
                            const frameHeight = sprite.height;
                            
                            // Store frame info in the animation object
                            animation.frameWidth = frameWidth;
                            animation.frameHeight = frameHeight;
                            animation.visualWidth = frameWidth * scale;
                            animation.visualHeight = frameHeight * scale;
                            
                            // Set initial player dimensions based on idle animation
                            if (animationType === 'idle') {
                                this.player.visualWidth = frameWidth * scale;
                                this.player.visualHeight = frameHeight * scale;
                                this.player.width = (frameWidth * 0.8) * scale;
                                this.player.height = frameHeight * scale;
                            }
                            
                            console.log(`Loaded sprite: ${sprite.src}, Frame Width: ${frameWidth}, Frame Height: ${frameHeight}, Scale: ${scale}`);
                            resolve();
                        } catch (error) {
                            console.error('Error processing sprite:', error);
                            reject(error);
                        }
                    };
                    sprite.onerror = () => {
                        console.error(`Failed to load sprite: ${sprite.src}`);
                        reject(new Error(`Failed to load sprite: ${sprite.src}`));
                    };
                })
            ));
            console.log('All player sprites loaded successfully');

            // Load cake sprite
            this.cakeSprite = new Image();
            this.cakeSprite.src = 'birthday-cake.png';
            await new Promise((resolve, reject) => {
                this.cakeSprite.onload = resolve;
                this.cakeSprite.onerror = () => {
                    console.error('Failed to load birthday-cake.png');
                    reject(new Error('Failed to load birthday-cake.png'));
                };
            });
            console.log('Cake sprite loaded successfully');

            // Load audio files
            this.deathSound = new Audio('CombatGruntMale - nNooah.wav');
            this.deathSound.volume = 0.5;
            
            this.arigatoSound = new Audio('arigato.mp3');
            this.arigatoSound.volume = 0.5;
            
            this.bigArigatoFinaleSound = new Audio('big_arigato_finale.mp3');
            this.bigArigatoFinaleSound.volume = 0.5;
            
            // Load background music
            this.backgroundMusic = new Audio('Main game music.wav');
            this.backgroundMusic.volume = 0.2;
            this.backgroundMusic.loop = true; // Make it loop continuously
            console.log('Audio files loaded successfully');
        } catch (error) {
            console.error('Error loading sprites or audio:', error);
            throw error;
        }
    }

    setupCakes() {
        // Define cake positions for each level - placed above each platform
        const cakePositions = {
            entrance: [
                {x: 250, y: 200},    // Above Platform 1
                {x: 850, y: 250},    // Above Platform 2
                {x: 1450, y: 200},   // Above Platform 3
                {x: 450, y: 350},    // Above Platform 4
                {x: 1250, y: 400},   // Above Platform 5
                {x: 250, y: 500},    // Above Platform 6
                {x: 970, y: 550},    // Above Platform 7
                {x: 1450, y: 500},   // Above Platform 8
                {x: 450, y: 700},    // Above Platform 9
                {x: 1250, y: 650},   // Above Platform 10
                {x: 250, y: 850},    // Above Platform 11
                {x: 850, y: 900},    // Above Platform 12
                {x: 1450, y: 850}    // Above Platform 13
            ]
        };

        this.cakes = cakePositions[this.levels[this.currentLevel]].map(pos => ({
            ...pos,
            width: 30,
            height: 30,
            collected: false
        }));
    }

    setupEventListeners() {
        // Keyboard controls
        const keys = new Set();
        
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            keys.add(e.code);
            
            if (e.code === 'Space' && !this.player.isJumping && !this.player.isDying) {
                this.player.velocityY = -15;  // Increased jump height for reaching higher platforms
                this.player.isJumping = true;
                this.player.currentAnimation = 'jumpStart';  // Start with jumpStart animation
                this.player.frameIndex = 0;  // Reset frame index for jump animation
            }
            
            // Update movement based on current keys pressed
            this.updatePlayerMovement(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys.delete(e.code);
            // Update movement based on remaining keys pressed
            this.updatePlayerMovement(keys);
        });
    }

    updatePlayerMovement(keys) {
        // Don't allow movement during death animation
        if (this.player.isDying) return;

        // Reset movement flag
        this.player.isMoving = false;

        // Calculate movement direction and animation
        if (keys.has('ArrowLeft')) {
            this.player.velocityX = -this.player.speed;
            this.player.direction = -1;
            this.player.isMoving = true;
            if (!this.player.isJumping) {
                this.player.currentAnimation = 'run';
            }
        } else if (keys.has('ArrowRight')) {
            this.player.velocityX = this.player.speed;
            this.player.direction = 1;
            this.player.isMoving = true;
            if (!this.player.isJumping) {
                this.player.currentAnimation = 'run';
            }
        } else {
            this.player.velocityX = 0;
            if (!this.player.isJumping) {
                this.player.currentAnimation = 'idle';
                this.player.frameIndex = 0;
            }
        }

        // Keep player within canvas bounds
        const newX = Math.max(0, Math.min(this.player.x + this.player.velocityX, this.canvas.width - this.player.width));
        
        // Check if we can stand at the new position
        const canStandAtNewPos = this.canStandAt(newX, this.player.y);
        
        // Update position and handle falling
        if (this.player.isJumping || canStandAtNewPos) {
            this.player.x = newX;
        }
        
        // Start falling if we're not jumping and can't stand at current position
        if (!this.player.isJumping && !this.canStandAt(this.player.x, this.player.y)) {
            this.player.isJumping = true;
            this.player.velocityY = 0.1;
            this.player.currentAnimation = 'jumpFall';
            this.player.frameIndex = 0;
        }
    }

    canStandAt(x, y) {
        const currentPlatforms = this.platforms[this.levels[this.currentLevel]];
        const playerBottom = y + this.player.height - this.player.collisionOffset;
        
        // Calculate feet position (bottom center point)
        const feetX = x + (this.player.width / 2);
        
        for (const platform of currentPlatforms) {
            if (Math.abs(playerBottom - platform.y) <= 2) { // Tight vertical tolerance
                // Check if feet point is on the platform with a larger margin from edges
                if (feetX >= platform.x + 5 && feetX <= platform.x + platform.width - 5) {
                    return true;
                }
            }
        }
        return false;
    }

    startTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Reset time
        this.timeLeft = 30;

        // Update timer display
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = `Time: ${this.timeLeft}s`;
        }

        // Start countdown
        this.timerInterval = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(this.timerInterval);
                return;
            }

            this.timeLeft--;
            
            // Update display
            if (timerDisplay) {
                timerDisplay.textContent = `Time: ${this.timeLeft}s`;
            }
            
            // Check if time's up
            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    startGame() {
        try {
            console.log('Starting game...');
            this.gameState = 'playing';
            
            const welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
                console.log('Welcome screen hidden');
            } else {
                console.error('Welcome screen element not found');
            }
            
            if (this.canvas) {
                this.canvas.style.display = 'block';
                console.log('Canvas displayed');
            } else {
                console.error('Canvas element not found');
            }
            
            const hud = document.getElementById('hud');
            if (hud) {
                hud.style.display = 'block';
                console.log('HUD displayed');
            } else {
                console.error('HUD element not found');
            }
            
            // Start the game timer
            this.startTimer();
            
            // Start playing background music
            if (this.backgroundMusic) {
                this.backgroundMusic.play().catch(error => {
                    console.warn('Could not play background music:', error);
                });
                console.log('Background music started');
            }
            
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            throw error;
        }
    }

    gameOver() {
        clearInterval(this.timerInterval);
        
        // Pause background music
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        
        if (this.cakesCollected === this.totalCakes) {
            this.victory();
        } else {
            this.restart();
        }
    }

    victory() {
        this.gameState = 'victory';
        clearInterval(this.timerInterval);
        
        // Fade out background music
        this.fadeOutBackgroundMusic();
        
        // Add a slight delay to allow the music to fade before redirecting
        setTimeout(() => {
            // Redirect to celebration.html
            window.location.href = 'celebration.html';
        }, 1000); // 1 second delay for a smoother transition
    }

    // New method to fade out background music
    fadeOutBackgroundMusic() {
        if (!this.backgroundMusic) return;
        
        const fadeInterval = setInterval(() => {
            // Reduce volume gradually
            if (this.backgroundMusic.volume > 0.05) {
                this.backgroundMusic.volume -= 0.05;
            } else {
                // Stop music and clear interval when volume is very low
                this.backgroundMusic.pause();
                this.backgroundMusic.volume = 0.3; // Reset volume for future use
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Check if player should start falling (only if not dying)
        if (!this.player.isDying && !this.player.isJumping && !this.canStandAt(this.player.x, this.player.y)) {
            this.player.isJumping = true;
            this.player.velocityY = 0.1; // Small initial falling velocity
            this.player.currentAnimation = 'jumpFall';
            this.player.frameIndex = 0;
        }

        // Update player position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Check platform collisions
        this.checkPlatformCollisions();

        // Keep player in horizontal bounds
        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));

        // Update jump animation states only if not dying
        if (this.player.isJumping && !this.player.isDying) {
            if (this.player.velocityY < 0) {
                // Going up
                if (this.player.currentAnimation !== 'jumpStart') {
                    this.player.currentAnimation = 'jumpStart';
                    this.player.frameIndex = 0;
                }
            } else if (this.player.velocityY > 0) {
                // Falling
                if (this.player.currentAnimation !== 'jumpFall') {
                    this.player.currentAnimation = 'jumpFall';
                    this.player.frameIndex = 0;
                }
            }
        }

        // Check if player has reached the bottom of the screen
        if (this.player.y + this.player.height >= this.canvas.height) {
            // Keep player at bottom of screen
            this.player.y = this.canvas.height - this.player.height;
            
            if (!this.player.isDying) {
                this.startDeathAnimation();
            } else if (this.player.currentAnimation === 'death') {
                this.updateDeathAnimation();
            }
        }

        // Always update animation frames when dying, otherwise only when moving, jumping, attacking, or idle
        if (this.player.isDying || this.player.isMoving || this.player.isJumping || this.player.currentAnimation === 'attack' || this.player.currentAnimation === 'idle') {
            const currentAnim = this.animations[this.player.currentAnimation];
            this.player.frameCount++;
            if (this.player.frameCount >= currentAnim.speed) {
                this.player.frameCount = 0;
                if (this.player.currentAnimation === 'death') {
                    // Ensure death animation advances
                    if (this.player.frameIndex < currentAnim.frames - 1) {
                        this.player.frameIndex++;
                    }
                } else {
                    this.player.frameIndex = (this.player.frameIndex + 1) % currentAnim.frames;
                }
            }
        }

        // Check cake collisions
        this.cakes.forEach(cake => {
            if (!cake.collected && this.checkCollision(this.player, cake)) {
                cake.collected = true;
                this.cakesCollected++;
                document.getElementById('score').textContent = `Cakes: ${this.cakesCollected}/${this.totalCakes}`;
                
                // Play arigato sound when 6th cake is collected
                if (this.cakesCollected === 6) {
                    this.arigatoSound.play();
                }
                
                // Handle final cake collection
                if (this.cakesCollected === this.totalCakes && !this.victoryPending) {
                    this.victoryPending = true;
                    // Pause the timer immediately when final cake is collected
                    clearInterval(this.timerInterval);
                    this.bigArigatoFinaleSound.play();
                    // Wait for sound to finish plus 2 seconds before victory
                    setTimeout(() => {
                        this.victory();
                    }, this.bigArigatoFinaleSound.duration * 1000 + 2000);
                }
            }
        });
    }

    checkCollision(player, cake) {
        // Calculate player's feet position (the red debugging dot)
        const feetX = player.x + (player.width / 2);
        const feetY = player.y + player.height - player.collisionOffset;
        
        // Calculate cake's center bottom position
        // Add the same vertical offset that's used when drawing the cake
        const cakeBottomX = cake.x + (cake.width / 2);
        const cakeBottomY = cake.y + cake.height + cake.height/2 + 8; // Match the drawing offset
        
        // Check vertical alignment (y-coordinate proximity)
        const verticalMatch = Math.abs(feetY - cakeBottomY) < 10; // Tolerance of 10px
        
        // Check horizontal alignment
        const horizontalMatch = Math.abs(feetX - cakeBottomX) < 20; // Wider tolerance for x-axis
        
        // Return true only if both conditions are met
        return verticalMatch && horizontalMatch;
    }

    checkPlatformCollisions() {
        if (this.gameState !== 'playing') return;

        const currentPlatforms = this.platforms[this.levels[this.currentLevel]];
        const currentSlopes = this.slopes[this.levels[this.currentLevel]];
        let onSurface = false;

        // Check slope collisions first
        for (const slope of currentSlopes) {
            const playerLeftX = this.player.x;
            const playerRightX = this.player.x + this.player.width;
            const playerBottom = this.player.y + this.player.height - this.player.collisionOffset;

            if (playerRightX >= slope.start.x && playerLeftX <= slope.end.x) {
                const leftY = slope.getY(Math.max(playerLeftX, slope.start.x));
                const rightY = slope.getY(Math.min(playerRightX, slope.end.x));
                const slopeY = Math.min(leftY, rightY);

                if (Math.abs(playerBottom - slopeY) <= 5) {
                    this.player.y = slopeY - this.player.height + this.player.collisionOffset;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    if (!this.player.isDying) {  // Only change animation if not dying
                        if (this.player.isMoving) {
                            this.player.currentAnimation = 'run';
                        } else {
                            this.player.currentAnimation = 'idle';
                        }
                    }
                    onSurface = true;
                    break;
                }
                else if (this.player.velocityY > 0 && playerBottom < slopeY && playerBottom + this.player.velocityY >= slopeY) {
                    this.player.y = slopeY - this.player.height + this.player.collisionOffset;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    if (!this.player.isDying) {  // Only change animation if not dying
                        if (this.player.isMoving) {
                            this.player.currentAnimation = 'run';
                        } else {
                            this.player.currentAnimation = 'idle';
                        }
                    }
                    onSurface = true;
                    break;
                }
            }
        }

        // Check platform collisions if not on a slope
        if (!onSurface) {
            for (const platform of currentPlatforms) {
                // Calculate feet center position - use the same logic as canStandAt()
                const feetX = this.player.x + (this.player.width / 2);
                const playerBottom = this.player.y + this.player.height - this.player.collisionOffset;
                
                // First case: Player is at platform level
                if (Math.abs(playerBottom - platform.y) <= 5) {
                    // Use center point check instead of rectangle overlap
                    if (feetX >= platform.x + 10 && feetX <= platform.x + platform.width - 10) {
                        this.player.y = platform.y - this.player.height + this.player.collisionOffset;
                        this.player.velocityY = 0;
                        this.player.isJumping = false;
                        if (!this.player.isDying) {  // Only change animation if not dying
                            if (this.player.isMoving) {
                                this.player.currentAnimation = 'run';
                            } else {
                                this.player.currentAnimation = 'idle';
                            }
                        }
                        onSurface = true;
                        break;
                    }
                }
                // Second case: Player is falling onto platform
                else if (this.player.velocityY > 0 && playerBottom < platform.y && playerBottom + this.player.velocityY >= platform.y) {
                    // Also use center point check for this case
                    if (feetX >= platform.x + 10 && feetX <= platform.x + platform.width - 10) {
                        this.player.y = platform.y - this.player.height + this.player.collisionOffset;
                        this.player.velocityY = 0;
                        this.player.isJumping = false;
                        if (!this.player.isDying) {  // Only change animation if not dying
                            if (this.player.isMoving) {
                                this.player.currentAnimation = 'run';
                            } else {
                                this.player.currentAnimation = 'idle';
                            }
                        }
                        onSurface = true;
                        break;
                    }
                }
            }
        }

        // Apply gravity if not on any surface
        if (!onSurface) {
            this.player.velocityY += 0.5;  // Further reduced gravity for higher jumps
        }
    }

    draw() {
        // Don't draw anything in victory state
        if (this.gameState === 'victory') {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background image
        if (this.mainBackground) {
            this.ctx.drawImage(this.mainBackground, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback to gradient if image fails to load
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');  // Light blue at top
            gradient.addColorStop(1, '#E0F6FF');  // Lighter blue at bottom
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw platforms with the log image
        this.platforms[this.levels[this.currentLevel]].forEach(platform => {
            this.ctx.drawImage(this.logPlatform, platform.x, platform.y, platform.width, platform.height);
        });

        // Draw spikes at the bottom of the canvas
        this.drawSpikes();

        // Draw player sprite
        // Get the correct sprite based on animation state
        let spriteName = this.player.currentAnimation;
        if (!this.sprites[spriteName]) {
            // Fallback to idle if sprite doesn't exist
            spriteName = 'idle';
            this.player.currentAnimation = 'idle';
        }
        const sprite = this.sprites[spriteName];
        const animation = this.animations[spriteName];
        const frameWidth = animation.frameWidth;
        const frameHeight = animation.frameHeight;
        // Update visual dimensions based on current animation
        this.player.visualWidth = animation.visualWidth;
        this.player.visualHeight = animation.visualHeight;

        // Save the current context state
        this.ctx.save();

        // Position sprite aligned with collision box
        const spriteX = this.player.x - ((this.player.visualWidth - this.player.width) / 2);
        
        if (this.player.direction === 1) {
            // Draw sprite normally for right direction
            this.ctx.drawImage(
                sprite,
                this.player.frameIndex * frameWidth, 0,
                frameWidth, frameHeight,
                spriteX, this.player.y,
                this.player.visualWidth, this.player.visualHeight
            );
        } else {
            // For left direction, flip the sprite
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(
                sprite,
                this.player.frameIndex * frameWidth, 0,
                frameWidth, frameHeight,
                -spriteX - this.player.visualWidth, this.player.y,
                this.player.visualWidth, this.player.visualHeight
            );
            this.ctx.restore();
        }

        // Restore the context state
        this.ctx.restore();

        // Draw cakes with glow effect
        this.cakes.forEach(cake => {
            if (!cake.collected) {
                // Draw glow
                const gradient = this.ctx.createRadialGradient(
                    cake.x + cake.width/2, cake.y + cake.height/2, 0,
                    cake.x + cake.width/2, cake.y + cake.height/2, cake.width
                );
                gradient.addColorStop(0, 'rgba(255, 255, 150, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(cake.x - cake.width/2, cake.y - cake.height/2, 
                                cake.width * 2, cake.height * 2);
                
                // Draw cake with vertical offset to center the cake graphic on platforms
                this.ctx.drawImage(this.cakeSprite, cake.x, cake.y + cake.height/2 + 8, cake.width, cake.height);
            }
        });

        // Remove all debug visuals
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.gameState === 'playing') {
                this.update();
                this.draw();
            }
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    startDeathAnimation() {
        if (!this.player.isDying) {  // Only start if not already dying
            this.player.isDying = true;
            this.player.currentAnimation = 'death';
            this.player.frameIndex = 0;
            this.player.frameCount = 0;  // Reset frame count
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.player.isMoving = false;  // Ensure movement is stopped
            this.player.isJumping = false; // Ensure jumping is stopped
            this.deathSound.currentTime = 0;
            this.deathSound.play();
        }
    }

    updateDeathAnimation() {
        const deathAnim = this.animations.death;
        if (this.player.frameIndex >= deathAnim.frames - 1 && !this.player.deathAnimationComplete) {
            this.player.deathAnimationComplete = true;
            setTimeout(() => {
                this.restart();
            }, 1000); // 1 second delay
        }
    }

    restart() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timeLeft = 60;
        this.cakesCollected = 0;
        
        // Position player on the center platform (Platform 7)
        const centerPlatform = this.platforms[this.levels[this.currentLevel]][6]; // Index 6 is platform 7
        this.player.x = centerPlatform.x + (centerPlatform.width - this.player.width) / 2; // Center on platform
        this.player.y = centerPlatform.y - this.player.height + this.player.collisionOffset;

        // Start a new timer if the game is in playing state
        if (this.gameState === 'playing') {
            this.startTimer();
            
            // Restart background music if it exists
            if (this.backgroundMusic) {
                this.backgroundMusic.currentTime = 0;
                this.backgroundMusic.play().catch(error => {
                    console.warn('Could not play background music on restart:', error);
                });
            }
        }
        
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isDying = false;
        this.player.deathAnimationComplete = false;
        this.player.currentAnimation = 'idle';
        this.player.frameIndex = 0;
        this.victoryPending = false;
        
        this.setupCakes();
        document.getElementById('score').textContent = `Cakes: ${this.cakesCollected}/${this.totalCakes}`;
    }

    // Draw spikes across the bottom of the canvas
    drawSpikes() {
        if (!this.spikesImage) return;
        
        // Calculate how many times to repeat the image to cover the canvas width
        const repeats = Math.ceil(this.canvas.width / this.spikesImage.width);
        
        // Draw the back row of spikes (upper row) with offset for 3D layered effect
        for (let i = 0; i < repeats + 1; i++) {
            this.ctx.drawImage(
                this.spikesImage,
                (i * this.spikesImage.width) - (this.spikesImage.width / 2),  // x position with offset
                this.canvas.height - (this.spikesImage.height * 2) + (this.spikesImage.height / 2),  // y position (above bottom row, slightly overlapping)
                this.spikesImage.width,
                this.spikesImage.height
            );
        }
        
        // Draw the front row of spikes (bottom row)
        for (let i = 0; i < repeats; i++) {
            this.ctx.drawImage(
                this.spikesImage,
                i * this.spikesImage.width,  // x position
                this.canvas.height - this.spikesImage.height,  // y position (bottom of canvas)
                this.spikesImage.width,
                this.spikesImage.height
            );
        }
    }

    // Add a new method to show the welcome screen
    showWelcomeScreen() {
        try {
            console.log('Showing welcome screen...');
            this.gameState = 'welcome';
            
            const titleScreen = document.getElementById('title-screen');
            if (titleScreen) {
                titleScreen.style.display = 'none';
                console.log('Title screen hidden');
            } else {
                console.error('Title screen element not found');
            }
            
            const welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
                console.log('Welcome screen displayed');
            } else {
                console.error('Welcome screen element not found');
            }
            
            console.log('Successfully transitioned to welcome screen');
        } catch (error) {
            console.error('Error showing welcome screen:', error);
            throw error;
        }
    }
}

// Modify the window.onload handler at the bottom of the file
window.onload = async () => {
    const game = await Game.create();
    console.log('Game initialized:', game);
    
    // Add event listener for continue button (title screen to welcome screen)
    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            console.log('Continue button clicked');
            game.showWelcomeScreen();
        });
    } else {
        console.error('Continue button not found');
    }
    
    // Ensure the start button exists and is clickable
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            game.startGame();
        });
    } else {
        console.error('Start button not found');
    }
};
