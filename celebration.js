class Game {
    constructor() {
        // Create overlay before doing anything else
        this.createStartOverlay();
        
        // Get canvas element
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.canvas.width = 1984;  // Full image width
        this.canvas.height = 1088; // Full image height
        
        // Initialize properties but DON'T start celebration yet
        this.initializeProperties();
        this.init().then(() => {
            // Draw the background scene once to show behind the overlay
            this.drawVictoryScreen();
            
            // Position player above the victory platform and draw once
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.y = this.victoryPlatform.y - this.player.height + this.player.collisionOffset;
            this.player.currentAnimation = 'idle';
            
            const sprite = this.sprites[this.player.currentAnimation];
            const animation = this.animations[this.player.currentAnimation];
            const frameWidth = animation.frameWidth;
            const frameHeight = animation.frameHeight;
            
            this.player.visualWidth = animation.visualWidth;
            this.player.visualHeight = animation.visualHeight;

            this.ctx.save();
            const collisionCenterX = this.player.x + (this.player.width / 2);
            this.ctx.translate(collisionCenterX, this.player.y);
            
            this.ctx.drawImage(
                sprite,
                0, 0,
                frameWidth, frameHeight,
                -this.player.visualWidth / 2, 0,
                this.player.visualWidth, this.player.visualHeight
            );

            this.ctx.restore();
        });
    }
    
    // Add button overlay to ensure audio works with user interaction
    createStartOverlay() {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'celebration-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '1000';
        overlay.style.fontFamily = 'SAKURATA, serif';
        
        // Create instruction message
        const message = document.createElement('div');
        message.textContent = 'Click the button to start Milo\'s birthday celebration!';
        message.style.color = 'white';
        message.style.fontSize = '24px';
        message.style.marginBottom = '30px';
        message.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
        overlay.appendChild(message);
        
        // Create button
        const button = document.createElement('button');
        button.textContent = 'Start Celebration';
        button.style.padding = '20px 40px';
        button.style.fontSize = '24px';
        button.style.background = '#d81717';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
        button.style.transition = 'transform 0.3s';
        
        // Hover effect
        button.onmouseover = () => {
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
        };
        
        // Store reference to this for callback
        const self = this;
        
        // Click handler
        button.onclick = function() {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                self.startCelebration(); // Start celebration when clicked
            }, 500);
            overlay.style.transition = 'opacity 0.5s';
        };
        
        overlay.appendChild(button);
        document.body.appendChild(overlay);
    }

    initializeProperties() {
        // Sound properties
        this.gruntSounds = {
            attack1: 'CombatGruntMale - hHah.wav',
            attack2: 'CombatGruntMale - hHah.wav',
            airAttack: null,
            throwAttack: 'CombatGruntMale - Shyuah.wav',
            specialAttack: null,
            music: 'victory scene music.wav',
            voiceMessage: 'audiomessage.wav'
        };
        this.audioElements = {};
        this.shouldPlaySounds = true;
        this.isIntroPlaying = true;
        this.isEndingPlaying = false;

        // Player properties
        this.player = {
            x: 200,
            y: 0,
            width: 20,
            height: 88,
            visualWidth: 50,
            visualHeight: 88,
            direction: 1,
            currentAnimation: 'idle',
            frameIndex: 0,
            frameCount: 0,
            collisionOffset: 30
        };

        // Animation properties
        this.animations = {
            idle: { frames: 10, speed: 10, spriteHeight: 44, spriteWidth: 35 },
            attack1: { frames: 7, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            attack2: { frames: 7, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            attack3: { frames: 6, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            airAttack: { frames: 6, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            throwAttack: { frames: 7, speed: 8, spriteHeight: 44, spriteWidth: 35 },
            specialAttack: { frames: 14, speed: 8, spriteHeight: 44, spriteWidth: 35 }
        };

        // Victory platform
        this.victoryPlatform = {
            x: 0,
            y: 903,
            width: this.canvas.width,
            height: 10
        };
    }

    async init() {
        await this.loadAssets();
        // Celebration will now be started by the button click, not automatically
        // Position player to be ready for when celebration starts
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.victoryPlatform.y - this.player.height + this.player.collisionOffset;
    }

    async loadAssets() {
        try {
            // Load grunt sounds
            const loadSound = async (sound) => {
                return new Promise((resolve, reject) => {
                    const audio = new Audio(sound);
                    audio.oncanplaythrough = () => resolve(audio);
                    audio.onerror = () => reject(new Error(`Failed to load sound: ${sound}`));
                });
            };

            // Load all sounds
            for (const [key, soundPath] of Object.entries(this.gruntSounds)) {
                if (soundPath) {  // Only load if there's a sound file specified
                    this.audioElements[key] = await loadSound(soundPath);
                    
                    // Set specific properties for certain audio elements
                    if (key === 'music') {
                        this.audioElements[key].loop = true;
                    }
                }
            }

            // Load Japan scenery background
            this.japanScenery = new Image();
            await new Promise((resolve, reject) => {
                this.japanScenery.src = 'Japan platform game scenery.png';
                this.japanScenery.onload = resolve;
                this.japanScenery.onerror = () => reject(new Error('Failed to load Japan platform game scenery.png'));
            });

            // Load player sprites
            this.sprites = {
                idle: new Image(),
                attack1: new Image(),
                attack2: new Image(),
                attack3: new Image(),
                airAttack: new Image(),
                throwAttack: new Image(),
                specialAttack: new Image()
            };

            // Update sprite paths
            const basePath = 'Sprites/';
            this.sprites.idle.src = basePath + 'IDLE.png';
            this.sprites.attack1.src = basePath + 'ATTACK 1.png';
            this.sprites.attack2.src = basePath + 'ATTACK 2.png';
            this.sprites.attack3.src = basePath + 'ATTACK 3.png';
            this.sprites.airAttack.src = basePath + 'AIR ATTACK.png';
            this.sprites.throwAttack.src = basePath + 'THROW.png';
            this.sprites.specialAttack.src = basePath + 'SPECIAL ATTACK.png';

            // Wait for all sprites to load
            await Promise.all(Object.values(this.sprites).map(sprite => 
                new Promise((resolve, reject) => {
                    sprite.onload = () => {
                        try {
                            const scale = 2;
                            const animationType = Object.entries(this.sprites).find(([_, s]) => s === sprite)[0];
                            const animation = this.animations[animationType];
                            
                            const frameWidth = sprite.width / animation.frames;
                            const frameHeight = sprite.height;
                            
                            animation.frameWidth = frameWidth;
                            animation.frameHeight = frameHeight;
                            animation.visualWidth = frameWidth * scale;
                            animation.visualHeight = frameHeight * scale;
                            
                            if (animationType === 'attack1') {
                                this.player.visualWidth = frameWidth * scale;
                                this.player.visualHeight = frameHeight * scale;
                                this.player.width = (frameWidth * 0.6) * scale;
                                this.player.height = frameHeight * scale;
                            }
                            
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    sprite.onerror = () => reject(new Error(`Failed to load sprite: ${sprite.src}`));
                })
            ));
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }
    }

    createStars() {
        const numStars = 30;
        const invitationMessage = document.getElementById('invitation-message');
        const messageRect = invitationMessage.getBoundingClientRect();
        
        // Remove any existing stars
        document.querySelectorAll('.star').forEach(star => star.remove());
        
        // Create new stars
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Position stars around the message
            const padding = 50; // Distance from the message
            const x = messageRect.x - padding + Math.random() * (messageRect.width + padding * 2);
            const y = messageRect.y - padding + Math.random() * (messageRect.height + padding * 2);
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = Math.random() * 2 + 's';
            
            document.body.appendChild(star);
        }
    }

    startCelebration() {
        // Position player above the victory platform
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.victoryPlatform.y - this.player.height + this.player.collisionOffset;
        
        // Start with idle animation
        this.playVictoryAnimation();

        // Start attack sequence after 1 second
        setTimeout(() => {
            this.isIntroPlaying = false;
        }, 1000);

        // Set up voice message completion handler
        if (this.audioElements.voiceMessage) {
            this.audioElements.voiceMessage.addEventListener('ended', () => {
                const victoryScreen = document.getElementById('victory-screen');
                const invitationMessage = document.getElementById('invitation-message');
                
                // Fade out victory screen
                victoryScreen.style.transition = 'opacity 1s';
                victoryScreen.style.opacity = '0';
                
                // Show invitation message
                invitationMessage.style.display = 'block';
                
                // Create stars after a slight delay to allow the message to appear
                setTimeout(() => {
                    this.createStars();
                    this.audioElements.music.play();
                }, 2000);

                // Recreate stars periodically to maintain the effect
                setInterval(() => this.createStars(), 5000);
            });
        }
    }

    drawVictoryScreen() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Japan scenery background
        if (this.japanScenery) {
            this.ctx.drawImage(this.japanScenery, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Platform is now invisible since the background image has a floor
    }

    playVictoryAnimation() {
        let animationSequence = [
            { name: 'attack1', direction: 1 },    // facing right
            { name: 'attack2', direction: -1 },   // facing left
            { name: 'airAttack', direction: -1 }, // facing left
            { name: 'throwAttack', direction: 1 },      // facing right
            { name: 'specialAttack', direction: 1 } // facing right
        ];
        let currentIndex = 0;
        let frameCount = 0;

        const animate = () => {
            // Update animation frame
            const currentAnim = this.animations[this.player.currentAnimation];
            this.player.frameCount++;
            if (this.player.frameCount >= currentAnim.speed) {
                this.player.frameCount = 0;
                this.player.frameIndex = (this.player.frameIndex + 1) % currentAnim.frames;
            }

            let currentMove = null;
            
            // Handle different animation states
            if (this.isIntroPlaying) {
                // Initial idle animation
                this.player.currentAnimation = 'idle';
                this.player.direction = 1;
                
                // Allow idle animation to cycle continuously during intro
                // The setTimeout will end the intro state after 1 second
            } else if (this.isEndingPlaying) {
                // Final idle animation after invitation appears
                this.player.currentAnimation = 'idle';
                this.player.direction = 1;
            } else {
                if (currentIndex >= animationSequence.length) {
                    // End the sequence and switch to idle
                    this.isEndingPlaying = true;
                    this.shouldPlaySounds = false;
                    this.player.frameIndex = 0;
                    
                    // Play voice message and show speech bubble when switching to idle
                    if (this.audioElements.voiceMessage && !this.voiceMessagePlayed) {
                        this.voiceMessagePlayed = true;
                        const speechBubble = document.getElementById('speech-bubble');
                        
                        // Calculate canvas scaling ratio
                        const canvasRect = this.canvas.getBoundingClientRect();
                        const scaleX = canvasRect.width / this.canvas.width;
                        const scaleY = canvasRect.height / this.canvas.height;
                        const scale = Math.min(scaleX, scaleY); // Use minimum scale to maintain proportions

                        // Scale speech bubble dimensions
                        const baseMaxWidth = 250;
                        const baseFontSize = 20;
                        const basePadding = 15;
                        const baseBorderRadius = 20;

                        speechBubble.style.maxWidth = (baseMaxWidth * scale) + 'px';
                        speechBubble.style.fontSize = (baseFontSize * scale) + 'px';
                        speechBubble.style.padding = (basePadding * scale) + 'px';
                        speechBubble.style.borderRadius = (baseBorderRadius * scale) + 'px';

                        // Position speech bubble above character accounting for canvas scaling
                        speechBubble.style.display = 'block';
                        const scaledX = (this.player.x + this.player.width / 2) * scaleX;
                        const scaledY = (this.canvas.height - this.player.y + 20 * scale) * scaleY;
                        
                        // Convert canvas coordinates to screen coordinates
                        const canvasLeft = this.canvas.offsetLeft;
                        speechBubble.style.left = (canvasLeft + scaledX) + 'px';
                        speechBubble.style.bottom = scaledY + 'px';

                        // Scale the arrow
                        const baseArrowSize = 10;
                        const styleSheet = document.styleSheets[0];
                        const rules = styleSheet.cssRules || styleSheet.rules;
                        for (let rule of rules) {
                            if (rule.selectorText === '#speech-bubble:after') {
                                rule.style.border = `${baseArrowSize * scale}px solid transparent`;
                                rule.style.borderTopColor = 'white';
                                rule.style.marginLeft = `-${baseArrowSize * scale}px`;
                                rule.style.bottom = `-${baseArrowSize * 2 * scale}px`;
                                break;
                            }
                        }

                        // Fade in the bubble
                        setTimeout(() => {
                            speechBubble.style.opacity = '1';
                        }, 100);

                        // Play voice message
                        this.audioElements.voiceMessage.play();
                        
                        // Hide bubble when voice message ends
                        this.audioElements.voiceMessage.addEventListener('ended', () => {
                            speechBubble.style.opacity = '0';
                            setTimeout(() => {
                                speechBubble.style.display = 'none';
                            }, 500);
                        });
                    }
                    // Continue with the animation loop for the idle animation
                    currentMove = null;
                } else {
                    currentMove = animationSequence[currentIndex];
                    this.player.currentAnimation = currentMove.name;
                    this.player.direction = currentMove.direction;

                    frameCount++;
                }
            }

            // Play sounds slightly earlier to compensate for audio delay
            if (!this.isIntroPlaying && frameCount >= currentAnim.frames * 7) {
                // Play the corresponding grunt sound based on the current animation
                if (this.shouldPlaySounds && currentMove && frameCount === currentAnim.frames * 7) {
                    // Play the corresponding sound for the current animation
                    const soundElement = this.audioElements[currentMove.name];
                    if (soundElement) {
                        soundElement.currentTime = 0;
                        
                        // Add delay for throwAttack sound
                        if (currentMove.name === 'throwAttack') {
                            setTimeout(() => {
                                soundElement.play();
                            }, 250); // 250ms delay
                        } else {
                            // Play other sounds immediately
                            soundElement.play();
                        }
                    }
                }
                
                // Move to next animation
                // Move to next animation after full duration
                if (frameCount >= currentAnim.frames * 8) {
                    currentIndex++;
                    frameCount = 0;
                    this.player.frameIndex = 0;  // Reset frame index for new animation
                }
            }

            // Draw victory screen
            this.drawVictoryScreen();

            // Draw the player
            const sprite = this.sprites[this.player.currentAnimation];
            const animation = this.animations[this.player.currentAnimation];
            const frameWidth = animation.frameWidth;
            const frameHeight = animation.frameHeight;
            
            this.player.visualWidth = animation.visualWidth;
            this.player.visualHeight = animation.visualHeight;

            this.ctx.save();
            const collisionCenterX = this.player.x + (this.player.width / 2);
            this.ctx.translate(collisionCenterX, this.player.y);
            
            if (this.player.direction === -1) {
                this.ctx.scale(-1, 1);
            }

            this.ctx.drawImage(
                sprite,
                this.player.frameIndex * frameWidth, 0,
                frameWidth, frameHeight,
                -this.player.visualWidth / 2, 0,
                this.player.visualWidth, this.player.visualHeight
            );

            this.ctx.restore();

            requestAnimationFrame(animate);
        };

        animate();
    }
}

// Create and initialize the game when the page loads
window.onload = () => new Game();
