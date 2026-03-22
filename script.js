// --- GLOBAL VARIABLES ---
let currentPlayer = null;
let gameStarted = false;
let audioUnlocked = false;

// Domyślne statystyki nowego gracza
const defaultStats = () => ({
    gold: 0,
    miners: 1, // Start z 1 górnikiem
    warriors: 0,
    warriorArmorPerUnit: 2,
    totalArmor: 0,
    clickValue: 1,
    minerBonus: 0,
    minerLevel: 0,
    costs: { miner: 30, warrior: 30, upMiner: 50, upWarrior: 50 },
    pickaxes: [
        { name: "Better Pickaxe", power: 1.5, cost: 200, bought: false },
        { name: "Great Pickaxe", power: 2, cost: 800, bought: false },
        { name: "Super Pickaxe", power: 3, cost: 2500, bought: false },
        { name: "Mega Pickaxe", power: 5, cost: 7000, bought: false },
        { name: "Omega Pickaxe", power: 10, cost: 20000, bought: false }
    ]
});

// Aktualne statystyki załadowanego gracza
let pData = {};

// --- LOGIN SYSTEM ---
function getProfiles() {
    return JSON.parse(localStorage.getItem('miningEmpireProfiles')) || {};
}

function saveProfiles(profiles) {
    localStorage.setItem('miningEmpireProfiles', JSON.stringify(profiles));
    updateLeaderboardGlobal(profiles);
}

function createNewGame() {
    const nick = document.getElementById('player-nick').value.trim();
    const errorEl = document.getElementById('login-error');
    
    if (nick.length < 2) {
        errorEl.innerText = "Nick musi mieć min. 2 znaki!";
        return;
    }
    
    let profiles = getProfiles();
    if (profiles[nick]) {
        errorEl.innerText = "Ta nazwa jest już zajęta! Użyj innej lub wczytaj.";
        return;
    }

    // Tworzenie nowego profilu
    profiles[nick] = defaultStats();
    saveProfiles(profiles);
    
    startGame(nick, profiles[nick]);
}

function loadExistingGame() {
    const nick = document.getElementById('player-nick').value.trim();
    const errorEl = document.getElementById('login-error');
    
    let profiles = getProfiles();
    if (!profiles[nick]) {
        errorEl.innerText = "Nie znaleziono takiego profilu!";
        return;
    }

    // Wczytywanie istniejącego profilu
    startGame(nick, profiles[nick]);
}

function startGame(nick, data) {
    currentPlayer = nick;
    pData = data;
    
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    document.getElementById('display-name').innerText = currentPlayer;
    document.getElementById('log').innerText = `Zalogowano jako: ${currentPlayer}`;
    
    unlockAudio();
    gameStarted = true;
    updateUI();
}

function unlockAudio() {
    if (!audioUnlocked) {
        ['alarm-snd', 'success-snd', 'lose-snd'].forEach(id => {
            const s = document.getElementById(id);
            if (s) { s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(()=>{}); }
        });
        audioUnlocked = true;
    }
}

// --- SAVE & LEADERBOARD ---
function saveGame() {
    if (!currentPlayer) return;
    let profiles = getProfiles();
    profiles[currentPlayer] = pData; // Nadpisz statystyki gracza
    saveProfiles(profiles);
}

function updateLeaderboardGlobal(profiles) {
    let board = [];
    for (const [name, data] of Object.entries(profiles)) {
        board.push({ name: name, miners: data.miners });
    }
    board.sort((a, b) => b.miners - a.miners);
    
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = board.slice(0, 5).map((e, i) => `<li>${i+1}. ${e.name} - ${e.miners} 👷</li>`).join('');
}

function showLeaderboard() {
    updateLeaderboardGlobal(getProfiles());
    document.getElementById('leaderboard-modal').style.display = 'flex';
}
function hideLeaderboard() { document.getElementById('leaderboard-modal').style.display = 'none'; }
function showHowTo() { document.getElementById('howto-modal').style.display = 'flex'; }
function hideHowTo() { document.getElementById('howto-modal').style.display = 'none'; }

// --- GAME LOGIC ---
function clickGold() {
    if (!gameStarted) return;
    pData.gold += pData.clickValue;
    updateUI();
}

function buyMiner() {
    if (pData.gold >= pData.costs.miner) {
        pData.gold -= pData.costs.miner; 
        pData.miners++;
        pData.costs.miner = Math.floor(pData.costs.miner * 1.3);
        updateUI();
    }
}

function sellMiner() {
    if (pData.miners > 0) {
        pData.miners--;
        pData.gold += 100;
        document.getElementById('log').innerText = "Sprzedano górnika za 100 G.";
        updateUI();
    }
}

function buyWarrior() {
    if (pData.gold >= pData.costs.warrior) {
        pData.gold -= pData.costs.warrior;
        pData.warriors++;
        pData.totalArmor += pData.warriorArmorPerUnit;
        pData.costs.warrior = Math.floor(pData.costs.warrior * 1.4);
        updateUI();
    }
}

function upgradeMiners() {
    if (pData.gold >= pData.costs.upMiner) {
        pData.gold -= pData.costs.upMiner;
        pData.minerLevel++;
        pData.minerBonus++;
        pData.costs.upMiner = Math.floor(pData.costs.upMiner * 1.6);
        updateUI();
    }
}

function upgradeWarriors() {
    if (pData.gold >= pData.costs.upWarrior) {
        pData.gold -= pData.costs.upWarrior;
        pData.warriorArmorPerUnit++;
        pData.totalArmor += pData.warriors; // Dodaj nowy bonus do istniejących wojowników
        pData.costs.upWarrior = Math.floor(pData.costs.upWarrior * 1.6);
        updateUI();
    }
}

function buyPickaxe(index) {
    let p = pData.pickaxes[index];
    if (pData.gold >= p.cost && !p.bought) {
        pData.gold -= p.cost;
        pData.clickValue = p.power;
        p.bought = true;
        document.getElementById('log').innerText = `Kupiono ${p.name}!`;
        updateUI();
    }
}

function renderTools() {
    const list = document.getElementById('tools-list');
    if(!list) return;
    list.innerHTML = '';
    pData.pickaxes.forEach((p, index) => {
        if (!p.bought) {
            let btn = document.createElement('button');
            btn.className = 'btn-upgrade';
            btn.innerHTML = `${p.name} (Pow: ${p.power})<br>${p.cost} G`;
            btn.onclick = () => buyPickaxe(index);
            btn.disabled = pData.gold < p.cost;
            list.appendChild(btn);
        }
    });
}

function toggleShop() { document.getElementById('side-shop').classList.toggle('open'); }
function showTab(t) { 
    document.getElementById('tab-tools').style.display = t === 'tools' ? 'block' : 'none';
    document.getElementById('tab-upgrades').style.display = t === 'upgrades' ? 'block' : 'none';
}

// --- LOOPS ---
setInterval(() => {
    if (gameStarted && pData.miners > 0) { 
        pData.gold += (pData.miners * (1 + pData.minerBonus)); 
        updateUI(); 
    }
}, 1000);

setInterval(() => {
    if (!gameStarted || pData.miners <= 0) return;
    const warning = document.getElementById('warning-overlay');
    const alarm = document.getElementById('alarm-snd');
    
    warning.classList.add('danger-active');
    document.getElementById('log').innerText = "🚨 ATAK POTWORA! 🚨";
    if (alarm && audioUnlocked) { alarm.currentTime = 0; alarm.play().catch(()=>{}); }

    setTimeout(() => {
        warning.classList.remove('danger-active');
        if (alarm) alarm.pause();
        
        if (pData.totalArmor > 0) {
            pData.totalArmor -= pData.warriorArmorPerUnit;
            if (pData.totalArmor < 0) pData.totalArmor = 0;
            pData.warriors = Math.ceil(pData.totalArmor / pData.warriorArmorPerUnit);
            document.getElementById('log').innerText = "⚔️ Atak odparty!";
            if(audioUnlocked) document.getElementById('success-snd').play().catch(()=>{});
        } else {
            pData.miners--;
            document.getElementById('log').innerText = "💀 Górnik został pożarty!";
            if(audioUnlocked) document.getElementById('lose-snd').play().catch(()=>{});
        }
        updateUI();
    }, 5000);
}, 40000);

// --- UI REFRESH ---
function updateUI() {
    if (pData.miners <= 0 && gameStarted) {
        document.getElementById('game-over-screen').style.display = 'flex';
        gameStarted = false;
        saveGame();
        return;
    }

    document.getElementById('gold').innerText = Math.floor(pData.gold);
    document.getElementById('miners').innerText = pData.miners;
    document.getElementById('warriors').innerText = pData.warriors;
    document.getElementById('click-power').innerText = pData.clickValue;
    document.getElementById('miner-bonus').innerText = pData.minerBonus;
    
    document.getElementById('costMinerUp').innerText = pData.costs.upMiner;
    document.getElementById('costWarriorUp').innerText = pData.costs.upWarrior;
    document.getElementById('buyMiner').innerText = `+Miner (${pData.costs.miner})`;
    document.getElementById('buyWarrior').innerText = `+Warrior (${pData.costs.warrior})`;
    
    document.getElementById('buyMiner').disabled = pData.gold < pData.costs.miner;
    document.getElementById('buyWarrior').disabled = pData.gold < pData.costs.warrior;
    document.getElementById('upMiner').disabled = pData.gold < pData.costs.upMiner;
    document.getElementById('upWarrior').disabled = pData.gold < pData.costs.upWarrior;
    
    renderTools();
    saveGame();
}
