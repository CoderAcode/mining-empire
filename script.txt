// Game Data (English version)
let gold = 0;
let miners = 0; // Starts at 0, becomes 1 when YES is clicked
let warriors = 0;
let warriorArmorPerUnit = 2;
let totalArmor = 0;
let clickValue = 1;
let minerBonus = 0; 
let minerLevel = 0;
let gameStarted = false; // Check if game is running
let audioUnlocked = false; 

let costs = { miner: 30, warrior: 60, upMiner: 100, upWarrior: 200 };

const pickaxes = [
    { name: "Better Pickaxe", power: 1.5, cost: 200, bought: false },
    { name: "Great Pickaxe", power: 2, cost: 800, bought: false },
    { name: "Super Pickaxe", power: 3, cost: 2500, bought: false },
    { name: "Mega Pickaxe", power: 5, cost: 7000, bought: false },
    { name: "Omega Pickaxe", power: 10, cost: 20000, bought: false }
];

// --- INTRO & START FUNCTIONS ---
function startGame() {
    const introEl = document.getElementById('intro-screen');
    const gameUIEl = document.getElementById('game-ui');

    // Aktywujemy animację zanikania
    introEl.classList.add('fade-out-active');
    
    unlockAudio();
    
    // Czekamy 0.8s na koniec animacji i pokazujemy grę
    setTimeout(() => {
        introEl.style.display = 'none';
        gameUIEl.style.display = 'block';
        
        if (!gameStarted) {
            miners = 1;
            gameStarted = true;
            document.getElementById('log').innerText = "Mining Empire started!";
            updateUI();
        }
    }, 800);
}


function showHowTo() {
    document.getElementById('howto-modal').style.display = 'flex';
}

function hideHowTo() {
    document.getElementById('howto-modal').style.display = 'none';
}

// Unlock audio on first interaction
function unlockAudio() {
    if (!audioUnlocked) {
        const sounds = ['alarm-snd', 'success-snd', 'lose-snd'];
        sounds.forEach(id => {
            const s = document.getElementById(id);
            if (s) {
                s.play().then(() => {
                    s.pause();
                    s.currentTime = 0;
                }).catch(e => console.log("Audio waiting for interaction"));
            }
        });
        audioUnlocked = true;
    }
}

// --- BASIC GAME FUNCTIONS ---
function toggleShop() {
    if (!gameStarted) return;
    document.getElementById('side-shop').classList.toggle('open');
}

function showTab(tabName) {
    document.getElementById('tab-tools').style.display = tabName === 'tools' ? 'block' : 'none';
    document.getElementById('tab-upgrades').style.display = tabName === 'upgrades' ? 'block' : 'none';
}

function clickGold() {
    if (!gameStarted) return;
    gold += clickValue;
    updateUI();
}

// --- BUYING & UPGRADES ---
function buyMiner() {
    if (gold >= costs.miner) {
        gold -= costs.miner;
        miners++;
        costs.miner = Math.floor(costs.miner * 1.3);
        document.getElementById('log').innerText = "Hired a Miner! 👷";
        updateUI();
    }
}

function buyWarrior() {
    if (gold >= costs.warrior) {
        gold -= costs.warrior;
        warriors++;
        totalArmor += warriorArmorPerUnit;
        costs.warrior = Math.floor(costs.warrior * 1.4);
        document.getElementById('log').innerText = "Warrior hired! ⚔️";
        updateUI();
    }
}

function upgradeMiners() {
    if (gold >= costs.upMiner && minerLevel < 500) {
        gold -= costs.upMiner;
        minerLevel++;
        minerBonus += 1;
        costs.upMiner = Math.floor(costs.upMiner * 1.5);
        document.getElementById('log').innerText = "Miners upgraded! (+1 gold/s)";
        updateUI();
    }
}

function upgradeWarriors() {
    if (gold >= costs.upWarrior) {
        gold -= costs.upWarrior;
        warriorArmorPerUnit += 1; 
        totalArmor += warriors; 
        costs.upWarrior = Math.floor(costs.upWarrior * 1.6);
        document.getElementById('log').innerText = "Warriors upgraded! (+1 Armor/unit)";
        updateUI();
    }
}

function buyPickaxe(index) {
    let p = pickaxes[index];
    if (gold >= p.cost && !p.bought) {
        gold -= p.cost;
        clickValue = p.power;
        p.bought = true;
        document.getElementById('log').innerText = `Bought ${p.name}!`;
        updateUI();
    }
}

function renderTools() {
    const list = document.getElementById('tools-list');
    list.innerHTML = '';
    pickaxes.forEach((p, index) => {
        if (!p.bought) {
            let btn = document.createElement('button');
            btn.className = 'btn-upgrade';
            btn.innerHTML = `${p.name} (Power: ${p.power})<br>${p.cost} gold`;
            btn.onclick = () => buyPickaxe(index);
            btn.disabled = gold < p.cost;
            list.appendChild(btn);
        }
    });
}

// --- LOOPING FUNCTIONS ---
// Mining Loop
setInterval(() => {
    if (gameStarted && miners > 0) {
        gold += (miners * (1 + minerBonus));
        updateUI();
    }
}, 1000);

// Monster Attack Loop
setInterval(() => {
    if (!gameStarted || miners <= 0) return;

    const warningOverlay = document.getElementById('warning-overlay');
    const logEl = document.getElementById('log');
    const alarmSnd = document.getElementById('alarm-snd');
    const successSnd = document.getElementById('success-snd');
    const loseSnd = document.getElementById('lose-snd');
    
    warningOverlay.classList.add('danger-active');
    logEl.innerText = "🚨 ALARM! A MONSTER APPROACHES! 🚨";
    
    if (alarmSnd && audioUnlocked) {
        alarmSnd.currentTime = 0;
        alarmSnd.play().catch(e => console.log("Audio blocked"));
    }

    setTimeout(() => {
        warningOverlay.classList.remove('danger-active');
        if (alarmSnd) { alarmSnd.pause(); alarmSnd.currentTime = 0; }
        
        if (miners > 0) {
            if (totalArmor > 0) {
                // DEFENSE SUCCESS
                totalArmor -= warriorArmorPerUnit; 
                if (totalArmor < 0) totalArmor = 0;
                warriors = Math.ceil(totalArmor / warriorArmorPerUnit);
                logEl.innerText = "⚔️ Attack repelled! Kopalnia is safe.";
                
                if (successSnd && audioUnlocked) {
                    successSnd.currentTime = 0;
                    successSnd.play();
                }
                document.body.classList.add('success-flash');
                setTimeout(() => document.body.classList.remove('success-flash'), 500);

            } else {
                // MINER LOST
                miners--;
                logEl.innerText = "💀 Massacre! Monster ate a Miner!";
                if (loseSnd && audioUnlocked) {
                    loseSnd.currentTime = 0;
                    loseSnd.play();
                }
            }
        }
        updateUI();
    }, 5000);
}, 25000);

// UI Update
function updateUI() {
    if (miners <= 0 && gameStarted) {
        endGame();
        return; 
    }
    if (!gameStarted) return; // Wait for start

    document.getElementById('gold').innerText = Math.floor(gold);
    document.getElementById('miners').innerText = miners;
    document.getElementById('warriors').innerText = warriors;
    document.getElementById('click-power').innerText = clickValue;
    document.getElementById('miner-bonus').innerText = minerBonus;
    
    document.getElementById('buyMiner').innerText = `Miner (${costs.miner})`;
    document.getElementById('buyWarrior').innerText = `Warrior (${costs.warrior})`;
    document.getElementById('costMinerUp').innerText = costs.upMiner;
    document.getElementById('costWarriorUp').innerText = costs.upWarrior;

    document.getElementById('buyMiner').disabled = gold < costs.miner;
    document.getElementById('buyWarrior').disabled = gold < costs.warrior;
    document.getElementById('upMiner').disabled = gold < costs.upMiner || minerLevel >= 500;
    document.getElementById('upWarrior').disabled = gold < costs.upWarrior;
    
    renderTools();
}

function endGame() {
    document.getElementById('game-over-screen').style.display = 'flex';
    const alarmSnd = document.getElementById('alarm-snd');
    if (alarmSnd) alarmSnd.pause();
    document.getElementById('log').innerText = "Game Over.";
}
// Funkcja zapisująca stan gry
function saveGame() {
    const gameData = {
        gold: gold,
        miners: miners,
        warriors: warriors,
        clickValue: clickValue,
        minerBonus: minerBonus,
        minerLevel: minerLevel,
        costs: costs,
        pickaxes: pickaxes,
        totalArmor: totalArmor
    };
    localStorage.setItem("miningEmpireSave", JSON.stringify(gameData));
    console.log("Game Saved!");
}

// Funkcja wczytująca stan gry
function loadGame() {
    const savedData = localStorage.getItem("miningEmpireSave");
    if (savedData) {
        const data = JSON.parse(savedData);
        gold = data.gold;
        miners = data.miners;
        warriors = data.warriors;
        clickValue = data.clickValue;
        minerBonus = data.minerBonus;
        minerLevel = data.minerLevel;
        costs = data.costs;
        // Kopiujemy stan kilofów
        data.pickaxes.forEach((p, i) => {
            if(pickaxes[i]) pickaxes[i].bought = p.bought;
        });
        totalArmor = data.totalArmor;
        
        // Jeśli gracz miał już górników, uznajemy grę za rozpoczętą
        if (miners > 0) gameStarted = true;
        
        updateUI();
        document.getElementById('log').innerText = "Welcome back, Commander!";
    }
}
