// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnGHMQhiYTMNZfnAa94NqM5vTaqhOd3Yc",
  authDomain: "spelling-castle-test.firebaseapp.com",
  projectId: "spelling-castle-test",
  storageBucket: "spelling-castle-test.appspot.com",
  messagingSenderId: "754771190060",
  appId: "1:754771190060:web:43e162ea2526dc59cb4c89"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
signInAnonymously(auth)
    .then(() => {
        console.log("User signed in anonymously");
    })
    .catch((error) => {
        console.error("Error during authentication: ", error);
    });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const createUnitBtn = document.getElementById('createUnitBtn');
const getMeatBtn = document.getElementById('getMeatBtn');
const meatCountDiv = document.getElementById('meatCount');
const unitSelection = document.getElementById('unitSelection');
const wordLists = {
    1: [
        "hay", "tray", "claim", "pain", "stay", 
        "speed", "mean", "bleed", "deep", "beat", 
        "pie", "lie", "tried", "thief", "chief",
        "basket", "traffic", "contest", "picnic", "rabbit", "robot", "tiger", "never", "recess", 
        "begin", "canteen", "delay", "goalie", "neatly", "repeat", "jumble", "pimple", "maple", "handle", "table", "contract", "dolphin", "pilgrim", "complain", "hundred", 
        "city", "cent", "circus", "price", "place", "gem", "ginger", "giant", "cage", "magic", 
        "edge", "fudge", "badge", "bridge", "dodge", "mommy", "miles", "isaac", "cat", "dog",
        "weekly", "quickly", "firmly", "lovely", "mostly",
        "also", "around", "each", "want", "going", "another", "talk", "three", "work", "threw almost", "because", "does", "even", "square", 
        "away", "different", "help", "why", "twenty", "again", "number", "old", "saw", "how", "found", "important", "start", "women", "sugar", 
        "before", "between", "every", "pretty", "sweet", "along", "favorite", "next", "while", "parent", 
        "could", "should", "usually", "would", "bottom", "father", "mother", "under", "stuff", "forget", "last", "left", "through", "fight", "huge", "enough", "few", "probably", "until", "leader", 
        "foot", "food", "room", "took", "tooth", "coin", "voice", "point", "toy", "enjoy", "round", "house", "flower", "town", "loud", "draw", "taught", "lawn", "author", "caught", "suit", "clue", "juice", "blew", "drew", 
        "retell", "remove", "unable", "unfair", "unwrap", "spells", "boxes", "wishes", "buses", "trucks", "teacher", "softer", "ruler", "faster", "painter", "dark", 
        "darker", "darkest", "smaller", "smallest", "wanted", "acted", "sailed", "filled", "walked", "tricked", "cries", "crying", "puppies", "happier", "played", "sitting", "sleeping", "runner", "stopped", "biggest",
        "both", "something", "thought", "person", "lesson", "always", "large", "those", "kind", "cool", "asked", "often", "together", "whole", "month", "children", "form", "terrible", 
        "wonderful", "half", "beautiful", "though", "without", "care", "able", "fast", "door", "five", "books", "above", "behind", "new", "paper", "whether", "same", "across", "things", "gone", "plain", "year", 
        "anything", "close", "store", "team", "become", "maybe", "watch", "river", "queen", "change", "outside", "wrong", "second", "insect", "each", "ahead", "wrote", "part", "excited",
        "word", "birds", "lion", "grandma", "shark", "orange", "color"
    ],
    2: ["speed", "mean", "bleed", "deep", "beat"],
    3: ["pie", "lie", "tried", "thief", "chief"],
    4: ["basket", "traffic", "contest", "picnic", "rabbit"],
    5: ["city", "cent", "circus", "price", "place"]
};


// Preload images
const images = {
    'Basic': { idle: null, attack: null },
    'Tank': { idle: null, attack: null },
    'Scout': { idle: null, attack: null },
    'Steve': { idle: null, attack: null },
    'Sammie': { idle: null, attack: null },
};

// Function to save game record
async function saveGameRecord(name, level, score) {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not authenticated");
        return;
    }
    try {
        await addDoc(collection(db, "game_records"), {
            name: name,
            level: level,
            score: score,
            userId: user.uid
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
  
  // Function to fetch top 10 records
  async function fetchTopRecords() {
    try {
        const q = query(collection(db, "game_records"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        const records = [];
        querySnapshot.forEach((doc) => {
            records.push(doc.data());
        });
        console.log("Loaded records:", records);
        return records;
    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
        return [];
    }
}
  
  // Screen management
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
  }
  
  // Game logic
  let playerName = "";
  let currentLevel = 1;
  
  function startGame() {
    playerName = document.getElementById('player-input-name').value;
    if (playerName.trim() === "") {
      alert("Please enter your name.");
      return;
    }
    showScreen('level-selection-screen');
  }

  function selectLevel(level) {
    currentLevel = level;
    showScreen('game-screen');
    initGame();
  }

  function showLeaderboardScreen() {
    fetchTopRecords().then(records => {
        const leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = "";
        if (records.length === 0) {
            leaderboardDiv.innerHTML = "<p>No records found!</p>";
        } else {
            records.forEach((record, index) => {
                leaderboardDiv.innerHTML += `<p>${index + 1}. ${record.name}: ${record.score} (Level ${record.level})</p>`;
            });
        }
        document.getElementById('current-level').textContent = currentLevel;
        showScreen('leaderboard-screen');
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function loadAllImages() {
    const imagePromises = [
        loadImage('images/basic_idle.gif').then(img => images.Basic.idle = img),
        loadImage('images/basic_attack.gif').then(img => images.Basic.attack = img),
        loadImage('images/tank_idle.gif').then(img => images.Tank.idle = img),
        loadImage('images/tank_attack.gif').then(img => images.Tank.attack = img),
        loadImage('images/scout_idle.gif').then(img => images.Scout.idle = img),
        loadImage('images/scout_attack.gif').then(img => images.Scout.attack = img),
        loadImage('images/steve_idle.gif').then(img => images.Steve.idle = img),
        loadImage('images/steve_attack.gif').then(img => images.Steve.attack = img),
        loadImage('images/sammie_idle.gif').then(img => images.Sammie.idle = img),
        loadImage('images/sammie_attack.gif').then(img => images.Sammie.attack = img),
    ];
    await Promise.all(imagePromises);
}

class Castle {
    constructor(x, y, color, health = 500, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.health = health;
        this.maxHealth = health;
        this.width = 80;
        this.height = 120;
        this.isPlayer = isPlayer;
    }

    draw() {
        // Main castle body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Castle top
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y - 30);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Windows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x + 10, this.y + 30, 20, 30);
        ctx.fillRect(this.x + 50, this.y + 30, 20, 30);
        
        // Health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 40, this.width, 10);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 40, this.width * (this.health / this.maxHealth), 10);
    }
}

class Unit {
    constructor(x, y, type, power, speed, range, health, cost, name, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.power = power;
        this.speed = speed;
        this.range = range;
        this.health = health;
        this.maxHealth = health;
        this.cost = cost;
        this.name = name;
        this.width = 60;  // Adjust based on your GIF size
        this.height = 60; // Adjust based on your GIF size
        this.lastAttackTime = 0;
        this.isPlayer = isPlayer;
        this.isAttacking = false;
        this.attackAnimationStart = 0;
    }

    move(enemyCastle) {
        if (this.isPlayer) {
            if (this.x + this.width + this.range < enemyCastle.x) {
                this.x += this.speed;
            }
        } else {
            if (this.x - this.range > enemyCastle.x + enemyCastle.width) {
                this.x -= this.speed;
            }
        }
    }

    draw(ctx) {
        const image = this.isAttacking && Date.now() - this.attackAnimationStart < 500 
            ? images[this.type].attack 
            : images[this.type].idle;
        
        ctx.save();
        if (!this.isPlayer) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        ctx.drawImage(image, 0, this.y, this.width, this.height);
        ctx.restore();

        // Draw health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
    }

    canAttack() {
        return Date.now() - this.lastAttackTime > 1000; // Attack every 1 second
    }

    attack(target) {
        if (this.canAttack()) {
            target.health -= this.power;
            this.lastAttackTime = Date.now();
            this.isAttacking = true;
            this.attackAnimationStart = Date.now();
            setTimeout(() => { this.isAttacking = false; }, 500);
            if (target.health <= 0) {
                return true; // Target is destroyed
            }
        }
        return false;
    }

    isInRange(target) {
        if (this.isPlayer) {
            return Math.abs(target.x - (this.x + this.width)) <= this.range;
        } else {
            return Math.abs((this.x - target.x - target.width)) <= this.range;
        }
    }
}

function updateMeatCount(meatValue) {
    meatCountDiv.textContent = `Meat: ${meatValue}`;
}

class Player {
    constructor(castle, isHuman = true) {
        this.castle = castle;
        this.units = [];
        this.meat = isHuman ? 0 : Infinity; // Computer has infinite resources
        this.isHuman = isHuman;
    }

    createUnit(unitType) {
        if (this.meat >= unitType.cost) {
            this.meat -= unitType.cost;
            const x = this.isHuman ? this.castle.x + this.castle.width : this.castle.x - unitType.width;
            const y = this.castle.y + this.castle.height / 2;
            const newUnit = new Unit(x, y, unitType.type, unitType.power, unitType.speed, unitType.range, 
                                     unitType.health, unitType.cost, unitType.name, this.isHuman);
            this.units.push(newUnit);
            if (this.isHuman) {
                updateMeatCount(this.meat);
            }
        }
    }
}

class Game {
    constructor() {
        this.player = new Player(new Castle(50, canvas.height - 150, '#8B4513', 100, true));
        this.computer = new Player(new Castle(canvas.width - 130, canvas.height - 150, '#4682B4', 100, false), false);

    this.level = currentLevel;
    this.difficulty = 0.01 + (this.level - 1) * 0.01;
    this.levelScore = 0;

     // Store all possible unit types
    this.allUnitTypes = [
        new Unit(0, 0, 'Basic',  1,    1, 40, 1, 1, 'Donkey Kong'),
        new Unit(0, 0, 'Scout',  1,  2.5, 40, 1, 2, 'Sonic'),
        new Unit(0, 0, 'Sammie', 0.5, .2, 90, 2, 2, 'Sammie-Man'),
        new Unit(0, 0, 'Steve',  3,    1, 30, 4, 3, 'Steve'),
        new Unit(0, 0, 'Tank',   2,  0.5, 60, 4, 2, 'Bowser')
    ];

    // Start with only basic unit
    this.unitTypes = [this.allUnitTypes[0]];

    this.selectedUnitIndex = 0;
    this.createUnitButtons();
    this.isPaused = false;
    this.updateAvailableUnits();
    this.currentWord = '';
	this.meatCooldown = 0;
    this.correctWords = new Set();
    this.incorrectWords = [];
    this.wordQueue = [];
    this.wordListCopy = [...(wordLists[currentLevel] || [])];

    }

updateAvailableUnits() {
    this.unitTypes = [];
    // Basic unit always available
    this.unitTypes.push(this.allUnitTypes[0]);
    
    if (this.level >= 2) {
        this.unitTypes.push(this.allUnitTypes[1]); // Scout
    }
    if (this.level >= 3) {
        this.unitTypes.push(this.allUnitTypes[2]); // Sammie
    }
    if (this.level >= 4) {
        this.unitTypes.push(this.allUnitTypes[3]); // Steve
    }
    if (this.level >= 5) {
        this.unitTypes.push(this.allUnitTypes[4]); // Tank
    }

    // Reset selected unit to Basic when updating units
    this.selectedUnitIndex = 0;
    
    // Clear and recreate unit buttons
    while (unitSelection.firstChild) {
        unitSelection.removeChild(unitSelection.firstChild);
    }
    this.createUnitButtons();
}

    startSpellingQuiz() {
    if (Date.now() < this.meatCooldown) {
        const remainingTime = Math.ceil((this.meatCooldown - Date.now()) / 1000);
        alert(`Please wait ${remainingTime} second(s) before trying again.`);
        return;
    }

    this.isPaused = true;

    // Select a word
    if (this.wordQueue.length > 0 && Math.random() < 0.5) {
        // 50% chance to pick from the queue of incorrect words
        this.currentWord = this.wordQueue.shift();
    } else if (this.wordListCopy.length > 0) {
        // Pick a new word from the remaining words
        const randomIndex = Math.floor(Math.random() * this.wordListCopy.length);
        this.currentWord = this.wordListCopy[randomIndex];
        this.wordListCopy.splice(randomIndex, 1);
    } else {
        // If all words have been used, reset the word list
        this.wordListCopy = [...wordList];
        const randomIndex = Math.floor(Math.random() * this.wordListCopy.length);
        this.currentWord = this.wordListCopy[randomIndex];
        this.wordListCopy.splice(randomIndex, 1);
    }
        
        // Create and show the spelling quiz interface
        const quizContainer = document.createElement('div');
        quizContainer.id = 'quizContainer';
        quizContainer.style.position = 'absolute';
        quizContainer.style.top = '50%';
        quizContainer.style.left = '50%';
        quizContainer.style.transform = 'translate(-50%, -50%)';
        quizContainer.style.backgroundColor = 'white';
        quizContainer.style.padding = '20px';
        quizContainer.style.borderRadius = '10px';
        quizContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        quizContainer.innerHTML = `
            <h2>Spell the word:</h2>
            <input type="text" id="spellingInput" autocomplete="off" spellcheck="false" style="font-size:25px;">
<br>
<br>
            <button id="submitSpelling">Done</button>
            <button id="sayAgain">Say Word Again</button>
        `;

        document.body.appendChild(quizContainer);

        const submitButton = document.getElementById('submitSpelling');
        const spellingInput = document.getElementById('spellingInput');
        const sayAgainButton = document.getElementById('sayAgain');

       // Use text-to-speech to pronounce the word
        const speech = new SpeechSynthesisUtterance(this.currentWord);

        submitButton.addEventListener('click', () => this.checkSpelling());
        sayAgainButton.addEventListener('click', () =>  window.speechSynthesis.speak(speech));
        spellingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkSpelling();
            }
        });

        window.speechSynthesis.speak(speech);
    }

checkSpelling() {
    const spellingInput = document.getElementById('spellingInput');
    const userSpelling = spellingInput.value.trim().toLowerCase();

    if (userSpelling === this.currentWord) {
        this.player.meat += 20;
        updateMeatCount(this.player.meat);
        this.correctWords.add(this.currentWord);
    } else {
        alert(`Sorry, that's incorrect. The correct spelling is: ${this.currentWord}`);
        this.meatCooldown = Date.now() + 1000; // Set cooldown to 1 second from now
        
        // Add the word to the incorrect words list and queue
        if (!this.incorrectWords.includes(this.currentWord)) {
            this.incorrectWords.push(this.currentWord);
        }
        this.wordQueue.push(this.currentWord);
        
        // Ensure the queue doesn't get too long
        if (this.wordQueue.length > 5) {
            this.wordQueue.shift();
        }
    }

    // Remove the quiz container and unpause the game
    document.body.removeChild(document.getElementById('quizContainer'));
    this.isPaused = false;
}

resetWordTracking() {
    this.correctWords.clear();
    this.incorrectWords = [];
    this.wordQueue = [];
    this.wordListCopy = [...(wordLists[currentLevel] || [])];
}

    createUnitButtons() {
        this.unitTypes.forEach((unit, index) => {
            const button = document.createElement('div');
            button.className = 'unitButton';
            button.style.backgroundImage = `url('images/${unit.type.toLowerCase()}_idle.gif')`;
            button.style.backgroundSize = 'cover';
            button.innerHTML = `${unit.name}<br>Cost: ${unit.cost}`;
            button.addEventListener('click', () => this.selectUnit(index));
            unitSelection.appendChild(button);
        });
        this.updateUnitButtonSelection();
    }

    selectUnit(index) {
        this.selectedUnitIndex = index;
        this.updateUnitButtonSelection();
    }

    updateUnitButtonSelection() {
        const buttons = unitSelection.getElementsByClassName('unitButton');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('selected', i === this.selectedUnitIndex);
        }
    }

    update() {

    if (this.isPaused || this.gameOverState) return;
        
	// Move units
        this.player.units.forEach(unit => unit.move(this.computer.castle));
        this.computer.units.forEach(unit => unit.move(this.player.castle));

    // Computer creates units
    if (Math.random() < this.difficulty) {
        const randomUnit = this.unitTypes[Math.floor(Math.random() * this.unitTypes.length)];
        this.computer.createUnit(randomUnit);
    }

        // Combat logic
        this.combat(this.player, this.computer);
        this.combat(this.computer, this.player);

        // Remove destroyed units
        this.player.units = this.player.units.filter(unit => unit.health > 0);
        this.computer.units = this.computer.units.filter(unit => unit.health > 0);

        // Check for game over
        if (this.player.castle.health <= 0 || this.computer.castle.health <= 0) {
            this.gameOver();
        }
    }

    combat(attacker, defender) {
        attacker.units.forEach(unit => {
            // Check if unit can attack the enemy castle
            if (unit.isInRange(defender.castle)) {
                if (unit.attack(defender.castle)) {
                    console.log(`${attacker.isHuman ? 'Player' : 'Computer'} destroyed the enemy castle!`);
                }
            } else {
                // Check if unit can attack enemy units
                for (let i = 0; i < defender.units.length; i++) {
                    const enemyUnit = defender.units[i];
                    if (unit.isInRange(enemyUnit)) {
                        if (unit.attack(enemyUnit)) {
                            console.log(`${attacker.isHuman ? 'Player' : 'Computer'} unit destroyed an enemy unit!`);
                            defender.units.splice(i, 1);
                            i--;
                        }
                        break; // Only attack one enemy unit
                    }
                }
            }
        });
    }

 async gameOver() {
    if (this.gameOverState) return;

    this.gameOverState = true;
    let levelScore;
    let message;

    if (this.player.castle.health > 0) {
        levelScore = this.player.castle.health;
        message = `Congratulations! You won level ${this.level}!\nLevel Score: ${levelScore}\n`;
        console.log("Saving record:", playerName, this.level, levelScore);
        await saveGameRecord(playerName, this.level, levelScore);
        this.resetGame();
        
        // Add unit unlock message if applicable
        if (this.level === 2) {
            message += "\nUnlocked new unit: Sonic!";
        } else if (this.level === 3) {
            message += "\nUnlocked new unit: Sammie!";
        } else if (this.level === 4) {
            message += "\nUnlocked new unit: Steve!";
        } else if (this.level === 5) {
            message += "\nUnlocked new unit: Bowser!";
        }
        
        alert(message);
        this.endGame();
        showLeaderboardScreen();
    } else {
        levelScore = -1 * this.computer.castle.health;
        message = `Game Over! You lost on level ${this.level}.\n`;
        alert(message);
        this.endGame();
        showScreen('level-selection-screen');
    }
}

resetGame() {
    this.levelScore = 0;
    this.player.castle.health = this.player.castle.maxHealth;
    this.computer.castle.health = this.computer.castle.maxHealth;
    this.player.units = [];
    this.computer.units = [];
    this.player.meat = 0;
    updateMeatCount(this.player.meat);
    this.resetWordTracking();
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.remove();
    }

}

endGame() {
    this.resetGame();
    this.resetWordTracking();
    this.updateAvailableUnits(); // Reset available units to just Basic
    this.gameOverState = false;
}

    draw() {
        // Draw background
        ctx.fillStyle = '#87CEEB';  // Sky blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw ground
        ctx.fillStyle = '#228B22';  // Forest green
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

        this.player.castle.draw();
        this.computer.castle.draw();
        this.player.units.concat(this.computer.units).forEach(unit => unit.draw(ctx));
    }
}

async function initGame() {
    await loadAllImages();
    const game = new Game();

    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }

    createUnitBtn.addEventListener('click', () => {
        if (!game.isPaused) {
            game.player.createUnit(game.unitTypes[game.selectedUnitIndex]);
        }
    });

    getMeatBtn.addEventListener('click', () => {
        if (!game.isPaused) {
            game.startSpellingQuiz();
        }
    });

    // Add a display for current level and overall score
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'scoreDisplay';
    document.body.appendChild(scoreDisplay);

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Level: ${game.level} | Score: ${game.levelScore}`;
    }

// Update score display in the game loop
function extendedGameLoop() {
    const gameScreen = document.getElementById('game-screen');
    
    if (gameScreen && gameScreen.style.display === 'block') {
        game.update();
        game.draw();
        updateScoreDisplay();
    }
    
    requestAnimationFrame(extendedGameLoop);
}

extendedGameLoop();
}

window.showScreen = showScreen;
window.startGame = startGame;
window.selectLevel = selectLevel;
window.showLeaderboardScreen = showLeaderboardScreen;