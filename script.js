// --- Card Definitions ---
const ALL_CARDS_DATA = [];
const RANKS_STR_ORDER_FOR_DECK_DISPLAY = 'A K Q J T 9 8 7 6 5 4 3 2'.split(' ');
const SUITS_ORDER_FOR_DECK_DISPLAY = 'SHDC'.split('');

const RANK_ORDER = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};
const IMAGE_PATH_PREFIX = 'card_images/';

for (const rank of RANKS_STR_ORDER_FOR_DECK_DISPLAY) {
    for (const suit of SUITS_ORDER_FOR_DECK_DISPLAY) {
        ALL_CARDS_DATA.push({ rank, suit, str: rank + suit, value: RANK_ORDER[rank] });
    }
}
const HAND_HIERARCHY = {
    "Royal Flush": 10, "Straight Flush": 9, "Four of a Kind": 8, "Full House": 7,
    "Flush": 6, "Straight": 5, "Three of a Kind": 4, "Two Pair": 3, "One Pair": 2, "High Card": 1
};
let currentSelectedCards = [];

// --- Sound Effect Function ---
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0; // Rewind to start for re-playing
        const playPromise = sound.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // console.log(`Sound '${soundId}' playback started.`); // Optional
            }).catch(error => {
                console.warn(`Sound '${soundId}' playback FAILED:`, error.name, error.message);
            });
        }
    } else {
        console.warn(`Sound element with ID "${soundId}" not found.`);
    }
}

// --- Helper Functions ---
function parseCard(cardStr) {
    if (cardStr.length !== 2) throw new Error(`Invalid card format: ${cardStr}`);
    const rank = cardStr[0].toUpperCase(); const suit = cardStr[1].toUpperCase();
    if (!RANK_ORDER[rank] || !'SHDC'.includes(suit)) throw new Error(`Unknown card value: ${cardStr}`);
    return { rank, suit, value: RANK_ORDER[rank], str: rank + suit };
}
function getCardRankValue(card) { return card.value; }
function formatCardsForDisplay(cardObjects) {
    if (!cardObjects || cardObjects.length === 0) return '<em style="color:var(--text-muted);">None</em>';
    return cardObjects.map(c =>
        `<img src="${IMAGE_PATH_PREFIX}${c.str}.png" alt="${c.str}" title="${c.str}">`
    ).join("");
}
function getHandDetails(handCards) {
    const numericRanks = handCards.map(getCardRankValue).sort((a, b) => b - a);
    const suits = new Set(handCards.map(c => c.suit));
    const rankCounts = {};
    handCards.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });
    return { numericRanks, suits, rankCounts };
}
function combinations(arr, k) {
    if (k > arr.length || k <= 0) return []; if (k === arr.length) return [arr]; if (k === 1) return arr.map(item => [item]);
    let combs = [];
    for (let i = 0; i < arr.length - k + 1; i++) {
        const head = arr.slice(i, i + 1); const tailcombs = combinations(arr.slice(i + 1), k - 1);
        for (const tailcomb of tailcombs) { combs.push(head.concat(tailcomb)); }
    }
    return combs;
}

// --- Poker Hand Evaluation Functions ---
function checkStraightFlush(handCards) {
    const { numericRanks, suits } = getHandDetails(handCards); if (suits.size !== 1) return null;
    let isStraight = false; let descriptiveCards = [...handCards].sort((a, b) => b.value - a.value);
    const uniqueNumericRanksSet = new Set(numericRanks);
    if (uniqueNumericRanksSet.size === 5 && [RANK_ORDER.A, RANK_ORDER['5'], RANK_ORDER['4'], RANK_ORDER['3'], RANK_ORDER['2']].every(v => uniqueNumericRanksSet.has(v))) {
        isStraight = true; const handValueTuple = [HAND_HIERARCHY["Straight Flush"], RANK_ORDER['5']];
        const aceCard = handCards.find(c => c.rank === 'A'); const otherCards = handCards.filter(c => c.rank !== 'A').sort((a,b) => b.value - a.value);
        descriptiveCards = [aceCard, ...otherCards];
        return { name: "Straight Flush", valueTuple: handValueTuple, descriptiveCards };
    }
    let currentStraight = true; for (let i = 0; i < numericRanks.length - 1; i++) { if (numericRanks[i] !== numericRanks[i+1] + 1) { currentStraight = false; break; } }
    if (currentStraight) isStraight = true;
    if (isStraight) { const highCardRankVal = numericRanks[0]; if (highCardRankVal === RANK_ORDER.A) return { name: "Royal Flush", valueTuple: [HAND_HIERARCHY["Royal Flush"], highCardRankVal], descriptiveCards }; else return { name: "Straight Flush", valueTuple: [HAND_HIERARCHY["Straight Flush"], highCardRankVal], descriptiveCards }; } return null;
}
function checkFourOfAKind(handCards) {
    const { numericRanks, rankCounts } = getHandDetails(handCards);
    for (const rankChar in rankCounts) { if (rankCounts[rankChar] === 4) {
            const quadRankVal = RANK_ORDER[rankChar]; const kickerVal = numericRanks.find(rVal => rVal !== quadRankVal);
            const valueTuple = [HAND_HIERARCHY["Four of a Kind"], quadRankVal, kickerVal];
            const quadCards = handCards.filter(c => c.rank === rankChar).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
            const kickerCard = handCards.find(c => c.rank !== rankChar); const descriptiveCards = [...quadCards, kickerCard];
            return { name: "Four of a Kind", valueTuple, descriptiveCards };
    }} return null;
}
function checkFullHouse(handCards) {
    const { rankCounts } = getHandDetails(handCards); const counts = Object.values(rankCounts);
    if (counts.length === 2 && counts.includes(3) && counts.includes(2)) {
        const tripRankChar = Object.keys(rankCounts).find(r => rankCounts[r] === 3); const pairRankChar = Object.keys(rankCounts).find(r => rankCounts[r] === 2);
        const tripVal = RANK_ORDER[tripRankChar]; const pairVal = RANK_ORDER[pairRankChar]; const valueTuple = [HAND_HIERARCHY["Full House"], tripVal, pairVal];
        const tripCards = handCards.filter(c => c.rank === tripRankChar).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const pairCards = handCards.filter(c => c.rank === pairRankChar).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const descriptiveCards = [...tripCards, ...pairCards]; return { name: "Full House", valueTuple, descriptiveCards };
    } return null;
}
function checkFlush(handCards) {
    const { numericRanks, suits } = getHandDetails(handCards);
    if (suits.size === 1) { const valueTuple = [HAND_HIERARCHY["Flush"], ...numericRanks]; const descriptiveCards = [...handCards].sort((a, b) => b.value - a.value); return { name: "Flush", valueTuple, descriptiveCards }; } return null;
}
function checkStraight(handCards) {
    const uniqueRankValues = [...new Set(handCards.map(c => c.value))].sort((a, b) => b - a);
    if (uniqueRankValues.length >= 5) {
         const aceVal = RANK_ORDER.A; const fiveVal = RANK_ORDER['5'];
         if (uniqueRankValues.includes(aceVal) && uniqueRankValues.includes(fiveVal) && uniqueRankValues.includes(RANK_ORDER['4']) && uniqueRankValues.includes(RANK_ORDER['3']) && uniqueRankValues.includes(RANK_ORDER['2'])) {
            let tempHand = [...handCards]; let straightCards = []; const targetRanks = ['A', '5', '4', '3', '2']; let possible = true;
            for (const rChar of targetRanks) { const cardIndex = tempHand.findIndex(c => c.rank === rChar); if (cardIndex !== -1) straightCards.push(tempHand.splice(cardIndex, 1)[0]); else { possible = false; break; } }
            if (possible && straightCards.length === 5) { const aceCard = straightCards.find(c => c.rank === 'A'); const otherStraightCards = straightCards.filter(c => c.rank !== 'A').sort((a,b)=>b.value - a.value); const descriptiveCards = [aceCard, ...otherStraightCards]; return { name: "Straight", valueTuple: [HAND_HIERARCHY["Straight"], fiveVal], descriptiveCards }; }
        }
    }
    if (uniqueRankValues.length >= 5) {
        for (let i = 0; i <= uniqueRankValues.length - 5; i++) {
            const window = uniqueRankValues.slice(i, i + 5); let isConsecutive = true;
            for (let j = 0; j < 4; j++) { if (window[j] !== window[j+1] + 1) { isConsecutive = false; break; } }
            if (isConsecutive) {
                let tempHand = [...handCards]; let straightCards = []; let possible = true;
                for (const rankValTarget of window) { const cardIndex = tempHand.findIndex(c => c.value === rankValTarget); if (cardIndex !== -1) straightCards.push(tempHand.splice(cardIndex, 1)[0]); else { possible = false; break; } }
                if (possible && straightCards.length === 5) { const descriptiveCards = straightCards.sort((a,b) => b.value - a.value); return { name: "Straight", valueTuple: [HAND_HIERARCHY["Straight"], window[0]], descriptiveCards }; }
            }
        }
    } return null;
}
function checkThreeOfAKind(handCards) {
    const { rankCounts } = getHandDetails(handCards); const rankChars = Object.keys(rankCounts);
    if (Object.values(rankCounts).includes(3) && rankChars.length === 3) {
        const tripRankChar = rankChars.find(r => rankCounts[r] === 3); const tripVal = RANK_ORDER[tripRankChar];
        const kickerRankChars = rankChars.filter(r => rankCounts[r] === 1); const kickerVals = kickerRankChars.map(r => RANK_ORDER[r]).sort((a,b) => b-a);
        const valueTuple = [HAND_HIERARCHY["Three of a Kind"], tripVal, ...kickerVals];
        const tripCards = handCards.filter(c => c.rank === tripRankChar).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const kickerCards = handCards.filter(c => kickerRankChars.includes(c.rank)).sort((a,b) => b.value - a.value);
        const descriptiveCards = [...tripCards, ...kickerCards]; return { name: "Three of a Kind", valueTuple, descriptiveCards };
    } return null;
}
function checkTwoPair(handCards) {
    const { rankCounts } = getHandDetails(handCards); const pairRankChars = Object.keys(rankCounts).filter(r => rankCounts[r] === 2);
    if (pairRankChars.length === 2 && Object.keys(rankCounts).length === 3) {
        const pairValsNumeric = pairRankChars.map(r => RANK_ORDER[r]).sort((a,b) => b-a);
        const kickerRankChar = Object.keys(rankCounts).find(r => rankCounts[r] === 1); const kickerValNumeric = RANK_ORDER[kickerRankChar];
        const valueTuple = [HAND_HIERARCHY["Two Pair"], ...pairValsNumeric, kickerValNumeric];
        const highPairCards = handCards.filter(c => c.value === pairValsNumeric[0]).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const lowPairCards = handCards.filter(c => c.value === pairValsNumeric[1]).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const kickerCard = handCards.find(c => c.rank === kickerRankChar);
        const descriptiveCards = [...highPairCards, ...lowPairCards, kickerCard]; return { name: "Two Pair", valueTuple, descriptiveCards };
    } return null;
}
function checkOnePair(handCards) {
    const { rankCounts } = getHandDetails(handCards); const pairRankChars = Object.keys(rankCounts).filter(r => rankCounts[r] === 2);
    if (pairRankChars.length === 1 && Object.keys(rankCounts).length === 4) {
        const pairRankChar = pairRankChars[0]; const pairValNumeric = RANK_ORDER[pairRankChar];
        const kickerRankChars = Object.keys(rankCounts).filter(r => rankCounts[r] === 1); const kickerValsNumeric = kickerRankChars.map(r => RANK_ORDER[r]).sort((a,b) => b-a);
        const valueTuple = [HAND_HIERARCHY["One Pair"], pairValNumeric, ...kickerValsNumeric];
        const pairCards = handCards.filter(c => c.rank === pairRankChar).sort((a,b) => SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
        const kickerCards = handCards.filter(c => kickerRankChars.includes(c.rank)).sort((a,b) => b.value - a.value);
        const descriptiveCards = [...pairCards, ...kickerCards]; return { name: "One Pair", valueTuple, descriptiveCards };
    } return null;
}
function checkHighCard(handCards) {
    const { numericRanks } = getHandDetails(handCards); const valueTuple = [HAND_HIERARCHY["High Card"], ...numericRanks];
    const descriptiveCards = [...handCards].sort((a, b) => b.value - a.value || SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(a.suit) - SUITS_ORDER_FOR_DECK_DISPLAY.indexOf(b.suit));
    return { name: "High Card", valueTuple, descriptiveCards };
}
const EVALUATION_FUNCTIONS = [ checkStraightFlush, checkFourOfAKind, checkFullHouse, checkFlush, checkStraight, checkThreeOfAKind, checkTwoPair, checkOnePair, checkHighCard ];
function evaluate5CardHand(handCards) {
    if (handCards.length !== 5) throw new Error("Hand must be 5 cards for evaluation.");
    for (const func of EVALUATION_FUNCTIONS) { const result = func(handCards); if (result) return result; }
    console.error("Hand evaluation fell through all checks."); return null;
}
function findBestHandsFromAvailable(allAvailableCards) {
    if (allAvailableCards.length < 5) return [];
    const possible5CardHands = combinations(allAvailableCards, 5); const evaluatedHands = [];
    for (const fiveCardCombo of possible5CardHands) {
        const evalResult = evaluate5CardHand(fiveCardCombo);
        if (evalResult) evaluatedHands.push({ ...evalResult, originalCombo: fiveCardCombo });
    }
    if (evaluatedHands.length === 0) return [];
    evaluatedHands.sort((a, b) => {
        for (let i = 0; i < Math.max(a.valueTuple.length, b.valueTuple.length); i++) {
            const valA = a.valueTuple[i] || 0; const valB = b.valueTuple[i] || 0;
            if (valA !== valB) return valB - valA;
        } return 0;
    }); return evaluatedHands;
}
function recommendDiscardsForImprovement(fiveCardHandSet, handEvalResult) {
    const handName = handEvalResult.name; const descriptiveCards = handEvalResult.descriptiveCards;
    if (["Royal Flush", "Straight Flush", "Four of a Kind", "Full House"].includes(handName)) return { keep: descriptiveCards, discard: [], advice: `Keep this masterpiece: ${handName}!` };
    const getDiscards = (kept) => fiveCardHandSet.filter(c => !kept.some(kc => kc.str === c.str));
    for (const combo4 of combinations(fiveCardHandSet, 4)) {
        const suits4 = new Set(combo4.map(c => c.suit)); if (suits4.size === 1) {
            const ranks4Numeric = new Set(combo4.map(c => c.value)); const royalRanks = new Set("AKQJT".split("").map(r => RANK_ORDER[r]));
            let intersectionCount = 0; ranks4Numeric.forEach(r => { if (royalRanks.has(r)) intersectionCount++; });
            if (intersectionCount === 4) return { keep: combo4, discard: getDiscards(combo4), advice: "Almost a Royal Flush! Hold these 4." };
        }
    }
    if (handName === "Flush" || handName === "Straight") return { keep: descriptiveCards, discard: [], advice: `Solid! Keep this ${handName}.` };
    if (handName === "Three of a Kind") { const tripsCards = descriptiveCards.slice(0, 3); return { keep: tripsCards, discard: getDiscards(tripsCards), advice: "Nice Trips! Hold 'em." };}
    for (const combo4 of combinations(fiveCardHandSet, 4)) {
        const suits4 = new Set(combo4.map(c => c.suit)); if (suits4.size === 1) {
            const ranks4NumericSorted = combo4.map(c => c.value).sort((a, b) => b - a);
            if ((ranks4NumericSorted[0] - ranks4NumericSorted[3] <= 4 && new Set(ranks4NumericSorted).size === 4) || (new Set(ranks4NumericSorted).has(RANK_ORDER.A) && ranks4NumericSorted.some(r => r <= RANK_ORDER['5']) && new Set(ranks4NumericSorted).size === 4 )) return { keep: combo4, discard: getDiscards(combo4), advice: "So close to a Straight Flush! Keep these 4." };
        }
    }
    if (handName === "Two Pair") { const pairsCards = descriptiveCards.slice(0, 4); return { keep: pairsCards, discard: getDiscards(pairsCards), advice: "Two Pair is good! Hold the pairs." };}
    if (handName === "One Pair") { const pairValNumeric = handEvalResult.valueTuple[1]; if (pairValNumeric >= RANK_ORDER.J) { const pairCards = descriptiveCards.slice(0, 2); return { keep: pairCards, discard: getDiscards(pairCards), advice: "Hold that High Pair (Jacks or Better)!" }; } }
    const suitCounts = {}; fiveCardHandSet.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
    for (const suit in suitCounts) { if (suitCounts[suit] === 4) { const keptCards = fiveCardHandSet.filter(c => c.suit === suit); return { keep: keptCards, discard: getDiscards(keptCards), advice: "Four to a Flush! Worth a shot." }; } }
    for (const combo4 of combinations(fiveCardHandSet, 4)) {
        const ranks4UniqueSorted = [...new Set(combo4.map(c => c.value))].sort((a, b) => b - a); if (ranks4UniqueSorted.length === 4) {
            if ((ranks4UniqueSorted[0] - ranks4UniqueSorted[3] === 3) || (ranks4UniqueSorted.includes(RANK_ORDER.A) && ranks4UniqueSorted.includes(RANK_ORDER['2']) && ranks4UniqueSorted.includes(RANK_ORDER['3']) && ranks4UniqueSorted.includes(RANK_ORDER['4'])) ) return { keep: combo4, discard: getDiscards(combo4), advice: "Four to an Open-Ended Straight! Go for it." };
        }
    }
    if (handName === "One Pair") { const pairCards = descriptiveCards.slice(0, 2); return { keep: pairCards, discard: getDiscards(pairCards), advice: "Just a Low Pair. Maybe hold it and hope?" }; }
    const highValueCardsToKeep = fiveCardHandSet.filter(c => c.value >= RANK_ORDER.J);
    if (handName === "High Card" && highValueCardsToKeep.length > 0 && highValueCardsToKeep.length < 5) return { keep: highValueCardsToKeep, discard: getDiscards(highValueCardsToKeep), advice: "Only High Cards? Keep J, Q, K, or A. Toss the rest."};
    else if (handName === "High Card" && descriptiveCards.length > 0) { const highestCard = [descriptiveCards[0]]; return { keep: highestCard, discard: getDiscards(highestCard), advice: "Tough hand... Hold your highest card, or let Jokers decide!" }; }
    return { keep: descriptiveCards, discard: [], advice: "An interesting hand... Play as is, or let the Jokers guide you!" };
}

// --- Card Selector & Drag-and-Drop Logic ---
function makeDeckCardDraggable(cardElement) {
    cardElement.setAttribute('draggable', 'true');
    cardElement.addEventListener('dragstart', (event) => {
        if (cardElement.classList.contains('selected')) { event.preventDefault(); return; }
        event.dataTransfer.setData('text/cardStr', cardElement.dataset.cardStr);
        event.dataTransfer.setData('text/source', 'deck');
        event.dataTransfer.effectAllowed = 'move';
        setTimeout(() => cardElement.classList.add('dragging'), 0);
        playSound('cardSelectSound'); // Assuming pickup is a selection
    });
    cardElement.addEventListener('dragend', () => cardElement.classList.remove('dragging'));
}
function makeSelectedCardDraggable(imgElement, cardStr) {
    imgElement.setAttribute('draggable', 'true');
    imgElement.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/cardStr', cardStr);
        event.dataTransfer.setData('text/source', 'hand');
        event.dataTransfer.effectAllowed = 'move';
        setTimeout(() => imgElement.classList.add('dragging-from-hand'), 0);
        playSound('cardSelectSound'); // Assuming pickup is a selection
    });
    imgElement.addEventListener('dragend', () => { imgElement.classList.remove('dragging-from-hand'); });
}
function renderAvailableCardsDeck(deckElement) {
    deckElement.innerHTML = '';
    ALL_CARDS_DATA.forEach(cardData => {
        const cardButtonWrapper = document.createElement('div');
        cardButtonWrapper.classList.add('clickable-card'); cardButtonWrapper.dataset.cardStr = cardData.str;
        cardButtonWrapper.setAttribute('role', 'button'); cardButtonWrapper.setAttribute('tabindex', '0');
        cardButtonWrapper.setAttribute('aria-label', `Select or drag ${cardData.str}`);
        const cardImg = document.createElement('img');
        cardImg.src = `${IMAGE_PATH_PREFIX}${cardData.str}.png`;
        cardImg.alt = cardData.str; cardImg.title = cardData.str; cardImg.setAttribute('draggable', 'false');
        cardButtonWrapper.appendChild(cardImg);
        if (currentSelectedCards.includes(cardData.str)) { cardButtonWrapper.classList.add('selected'); cardButtonWrapper.setAttribute('aria-pressed', 'true'); cardButtonWrapper.setAttribute('draggable', 'false'); }
        else { cardButtonWrapper.setAttribute('aria-pressed', 'false'); makeDeckCardDraggable(cardButtonWrapper); }
        cardButtonWrapper.addEventListener('click', () => {
            if (cardButtonWrapper.classList.contains('selected') && currentSelectedCards.includes(cardData.str)) return; // Already selected, do nothing on click from deck
            toggleCardSelection(cardData.str); // This will add it
            playSound('cardSelectSound');
            cardButtonWrapper.classList.add('card-pop-select'); setTimeout(() => cardButtonWrapper.classList.remove('card-pop-select'), 300);
        });
        cardButtonWrapper.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                if (cardButtonWrapper.classList.contains('selected') && currentSelectedCards.includes(cardData.str)) return;
                event.preventDefault(); toggleCardSelection(cardData.str); playSound('cardSelectSound');
                cardButtonWrapper.classList.add('card-pop-select'); setTimeout(() => cardButtonWrapper.classList.remove('card-pop-select'), 300);
            }
        });
        deckElement.appendChild(cardButtonWrapper);
    });
}
function toggleCardSelection(cardStr) {
    const cardIndex = currentSelectedCards.indexOf(cardStr);
    const errorDisplay = document.getElementById('errorDisplay');
    if (cardIndex > -1) { currentSelectedCards.splice(cardIndex, 1); playSound('cardReturnSound'); } // Implicitly a return/deselect
    else {
        if (currentSelectedCards.length >= 8) { errorDisplay.textContent = "Hand limit (8 cards) for selection reached."; setTimeout(() => {if(errorDisplay.textContent.includes("Hand limit (8 cards) for selection reached.")) errorDisplay.textContent = ""; }, 3000); return; }
        currentSelectedCards.push(cardStr); playSound('cardSelectSound'); // Explicit select
    }
    syncVisualsAndInputFromSelection();
}
function syncVisualsAndInputFromSelection() { updateSelectedCardsDisplay(); updateClickableCardStates(); updateTextInputFromSelection(); }
function updateSelectedCardsDisplay() {
    const displayElement = document.getElementById('selectedCardsDisplay');
    if (currentSelectedCards.length === 0) displayElement.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Drag cards here or click above!</p>';
    else {
        const selectedObjects = currentSelectedCards.map(cs => ALL_CARDS_DATA.find(d => d.str === cs)).filter(Boolean);
        displayElement.innerHTML = formatCardsForDisplay(selectedObjects);
        displayElement.querySelectorAll('img').forEach(imgElement => {
            const cardStr = imgElement.getAttribute('alt'); if (cardStr) makeSelectedCardDraggable(imgElement, cardStr);
        });
    }
}
function updateClickableCardStates() {
    document.querySelectorAll('#availableCardsDeck .clickable-card').forEach(cardButtonWrapper => {
        const cardStr = cardButtonWrapper.dataset.cardStr;
        if (currentSelectedCards.includes(cardStr)) { cardButtonWrapper.classList.add('selected'); cardButtonWrapper.setAttribute('aria-pressed', 'true'); cardButtonWrapper.setAttribute('draggable', 'false'); }
        else { cardButtonWrapper.classList.remove('selected'); cardButtonWrapper.setAttribute('aria-pressed', 'false'); if(cardButtonWrapper.getAttribute('draggable') !== 'true') makeDeckCardDraggable(cardButtonWrapper); }
    });
}
function updateTextInputFromSelection() { document.getElementById('cardInput').value = currentSelectedCards.join(' '); }
function clearAllSelectedCards() { if (currentSelectedCards.length > 0) playSound('cardReturnSound'); currentSelectedCards = []; syncVisualsAndInputFromSelection(); }

function setupDropZones() {
    const selectedHandDropZone = document.getElementById('selectedHandDropZone');
    const availableCardsDeckDropZone = document.getElementById('availableCardsDeck');
    const errorDisplay = document.getElementById('errorDisplay');

    selectedHandDropZone.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; selectedHandDropZone.classList.add('drag-over'); });
    selectedHandDropZone.addEventListener('dragenter', (event) => { event.preventDefault(); selectedHandDropZone.classList.add('drag-over'); });
    selectedHandDropZone.addEventListener('dragleave', (event) => { if (!selectedHandDropZone.contains(event.relatedTarget)) selectedHandDropZone.classList.remove('drag-over'); });
    selectedHandDropZone.addEventListener('drop', (event) => {
        event.preventDefault(); selectedHandDropZone.classList.remove('drag-over');
        const cardStr = event.dataTransfer.getData('text/cardStr'); const source = event.dataTransfer.getData('text/source');
        if (source === 'deck' && cardStr && !currentSelectedCards.includes(cardStr)) {
            if (currentSelectedCards.length < 8) { currentSelectedCards.push(cardStr); syncVisualsAndInputFromSelection(); playSound('cardDropSound'); }
            else { errorDisplay.textContent = "Hand limit (8 cards) reached. Cannot add more."; setTimeout(() => {if(errorDisplay.textContent.includes("Hand limit (8 cards) reached.")) errorDisplay.textContent = ""; }, 3000); }
        }
    });
    availableCardsDeckDropZone.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; availableCardsDeckDropZone.classList.add('drag-over-return'); });
    availableCardsDeckDropZone.addEventListener('dragenter', (event) => { event.preventDefault(); availableCardsDeckDropZone.classList.add('drag-over-return'); });
    availableCardsDeckDropZone.addEventListener('dragleave', (event) => { if (!availableCardsDeckDropZone.contains(event.relatedTarget)) availableCardsDeckDropZone.classList.remove('drag-over-return'); });
    availableCardsDeckDropZone.addEventListener('drop', (event) => {
        event.preventDefault(); availableCardsDeckDropZone.classList.remove('drag-over-return');
        const cardStr = event.dataTransfer.getData('text/cardStr'); const source = event.dataTransfer.getData('text/source');
        if (source === 'hand' && cardStr && currentSelectedCards.includes(cardStr)) {
            const cardIndex = currentSelectedCards.indexOf(cardStr); if (cardIndex > -1) { currentSelectedCards.splice(cardIndex, 1); syncVisualsAndInputFromSelection(); playSound('cardReturnSound'); }
        }
    });
}
function handleAutocomplete(inputElement, suggestionsElement) {
    const currentText = inputElement.value.toUpperCase(); const words = currentText.split(/\s+/);
    const currentWord = words.pop() || ""; const existingCardsInInputVal = words.join(' ');
    suggestionsElement.innerHTML = ''; if (currentWord.length === 0) { suggestionsElement.style.display = 'none'; return; }
    const alreadyUsedFullCards = new Set(currentSelectedCards.concat(words.filter(w => w.length === 2)));
    const filtered = ALL_CARDS_DATA.filter(card => card.str.startsWith(currentWord) && !alreadyUsedFullCards.has(card.str));
    filtered.slice(0, 5).forEach(card => {
        const div = document.createElement('div'); div.innerHTML = `<img src="${IMAGE_PATH_PREFIX}${card.str}.png" alt="${card.str}" title="${card.str}">`;
        div.addEventListener('mousedown', (e) => { e.preventDefault(); const errorDisplay = document.getElementById('errorDisplay');
            if (!currentSelectedCards.includes(card.str)) { if (currentSelectedCards.length < 8) { currentSelectedCards.push(card.str); playSound('cardSelectSound'); } else { errorDisplay.textContent = "Hand limit (8 cards) via autocomplete."; setTimeout(() => {if(errorDisplay.textContent.includes("Hand limit (8 cards) via autocomplete.")) errorDisplay.textContent = ""; }, 3000); return; }}
            inputElement.value = (existingCardsInInputVal ? existingCardsInInputVal + ' ' : '') + card.str + ' ';
            suggestionsElement.innerHTML = ''; inputElement.focus(); syncVisualsAndInputFromSelection();
        });
        suggestionsElement.appendChild(div);
    });
    suggestionsElement.style.display = filtered.length > 0 ? 'block' : 'none';
}
function debounce(func, delay) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); };}

// --- THEME TOGGLE LOGIC ---
function setTheme(themeName) {
    localStorage.setItem('theme', themeName); document.body.className = themeName + '-theme';
    const themeToggleButton = document.getElementById('themeToggleButton');
    if (themeName === 'light') { themeToggleButton.innerHTML = '🃏'; themeToggleButton.setAttribute('aria-label', 'Switch to dark theme'); }
    else { themeToggleButton.innerHTML = '☀️'; themeToggleButton.setAttribute('aria-label', 'Switch to light theme'); }
}
function toggleTheme() { if (localStorage.getItem('theme') === 'light') setTheme('dark'); else setTheme('light'); }

// --- DOM Elements & Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('themeToggleButton'); themeToggleButton.addEventListener('click', toggleTheme);
    const currentTheme = localStorage.getItem('theme') || 'dark'; setTheme(currentTheme);

    const availableCardsDeckElement = document.getElementById('availableCardsDeck');
    const clearSelectedCardsButton = document.getElementById('clearSelectedCards');
    const cardInputElement = document.getElementById('cardInput');
    const suggestionsElement = document.getElementById('autocompleteSuggestions');
    const evaluateButton = document.getElementById('evaluateButton');
    const errorDisplay = document.getElementById('errorDisplay');
    const resultsArea = document.getElementById('resultsArea');
    const inputSummarySection = document.getElementById('inputSummarySection');
    const inputSummaryCards = document.getElementById('inputSummaryCards');
    const bestPlaySection = document.getElementById('bestPlaySection');
    const bestHandTypeElement = document.getElementById('bestHandType');
    const bestHandCardsElement = document.getElementById('bestHandCards');
    const cardsNotPlayedWrapper = document.getElementById('cardsNotPlayedWrapper');
    const cardsNotPlayedElement = document.getElementById('cardsNotPlayed');
    const discardAdviceSection = document.getElementById('discardAdviceSection');
    const adviceTextElement = document.getElementById('adviceText');
    const cardsToKeepElement = document.getElementById('cardsToKeep');
    const cardsToDiscardElement = document.getElementById('cardsToDiscard');
    const keepDiscardInfoDiv = document.getElementById('keepDiscardInfo');
    const otherHandsSection = document.getElementById('otherHandsSection');
    const otherHandsListElement = document.getElementById('otherHandsList');

    renderAvailableCardsDeck(availableCardsDeckElement); updateSelectedCardsDisplay(); setupDropZones();
    clearSelectedCardsButton.addEventListener('click', clearAllSelectedCards);
    const debouncedAutocomplete = debounce(handleAutocomplete, 200);
    cardInputElement.addEventListener('input', () => debouncedAutocomplete(cardInputElement, suggestionsElement));
    cardInputElement.addEventListener('blur', () => { setTimeout(() => { suggestionsElement.style.display = 'none'; }, 150); });
    cardInputElement.addEventListener('focus', () => { if (cardInputElement.value.trim().length > 0 && (cardInputElement.value.trim().split(/\s+/).pop() || "").length < 2 ) { handleAutocomplete(cardInputElement, suggestionsElement); }});

    function clearResultsDOM() {
        errorDisplay.textContent = ''; resultsArea.style.display = 'none';
        const resultCardsToClearAnimation = resultsArea.querySelectorAll('.result-card.reveal-animation');
        resultCardsToClearAnimation.forEach(card => card.classList.remove('reveal-animation'));
        inputSummarySection.style.display = 'none'; bestPlaySection.style.display = 'none';
        discardAdviceSection.style.display = 'none'; otherHandsSection.style.display = 'none';
        cardsNotPlayedWrapper.style.display = 'none'; inputSummaryCards.innerHTML = '';
        bestHandTypeElement.textContent = ''; bestHandCardsElement.innerHTML = '';
        cardsNotPlayedElement.innerHTML = ''; adviceTextElement.textContent = '';
        cardsToKeepElement.innerHTML = ''; cardsToDiscardElement.innerHTML = '';
        otherHandsListElement.innerHTML = '';
    }

    cardInputElement.addEventListener('change', () => {
        const textValue = cardInputElement.value.trim().toUpperCase();
        const textCardStrings = textValue.split(/\s+/).filter(s => s.length > 0);
        let tempSelectedCards = []; const seenInText = new Set(); let handLimitExceeded = false;
        try {
            textCardStrings.forEach(tc => {
                const cardObj = parseCard(tc);
                if (!seenInText.has(cardObj.str)) {
                    if (tempSelectedCards.length < 8) { tempSelectedCards.push(cardObj.str); seenInText.add(cardObj.str); }
                    else { handLimitExceeded = true; throw new Error("Hand limit reached."); }
                }
            });
        } catch (e) {
            if (handLimitExceeded) {
                errorDisplay.textContent = "Hand limit (8 cards) in text input. Extra cards ignored.";
                 setTimeout(() => {if(errorDisplay.textContent.includes("Hand limit (8 cards) in text input.")) errorDisplay.textContent = ""; }, 3000);
            }
        }
        currentSelectedCards = tempSelectedCards.slice(0, 8);
        cardInputElement.value = currentSelectedCards.join(' ');
        syncVisualsAndInputFromSelection();
    });

    evaluateButton.addEventListener('click', () => {
        clearResultsDOM(); playSound('resultsRevealSound');
        const event = new Event('change'); cardInputElement.dispatchEvent(event);
        if (errorDisplay.textContent && (errorDisplay.textContent.includes("Invalid card") || errorDisplay.textContent.includes("Unknown card"))) return;

        let availableCardObjects = []; const seenInFinalInput = new Set();
        try {
            currentSelectedCards.forEach(cs => {
                const cardObj = parseCard(cs);
                if (seenInFinalInput.has(cardObj.str)) { console.warn(`Duplicate card in final processing: ${cardObj.str}`); return; }
                availableCardObjects.push(cardObj); seenInFinalInput.add(cardObj.str);
            });

            if (availableCardObjects.length === 0 && cardInputElement.value.trim().length > 0 && !errorDisplay.textContent.includes("Hand limit")) { errorDisplay.textContent = "No valid cards parsed from input."; return; }
            else if (availableCardObjects.length === 0) { errorDisplay.textContent = "Please enter or select your cards!"; return; }

            if (availableCardObjects.length < 5) {
                resultsArea.style.display = 'grid'; inputSummaryCards.innerHTML = formatCardsForDisplay(availableCardObjects);
                inputSummarySection.style.display = 'block'; inputSummarySection.classList.add('reveal-animation');
                errorDisplay.textContent = "Need at least 5 cards for a poker hand."; return;
            }
            resultsArea.style.display = 'grid'; inputSummaryCards.innerHTML = formatCardsForDisplay(availableCardObjects);
            inputSummarySection.style.display = 'block';

            const best5CardHandsData = findBestHandsFromAvailable(availableCardObjects);
            if (!best5CardHandsData || best5CardHandsData.length === 0) { errorDisplay.textContent = "No standard poker hands found in the deck."; return; }

            const bestPlayOverall = best5CardHandsData[0];
            bestPlaySection.style.display = 'block'; bestHandTypeElement.textContent = bestPlayOverall.name;
            bestHandCardsElement.innerHTML = formatCardsForDisplay(bestPlayOverall.descriptiveCards);

            if (availableCardObjects.length > 5) {
                const playedCardSet = new Set(bestPlayOverall.descriptiveCards.map(c => c.str));
                const notPlayedCards = availableCardObjects.filter(c => !playedCardSet.has(c.str));
                if (notPlayedCards.length > 0) { cardsNotPlayedElement.innerHTML = formatCardsForDisplay(notPlayedCards); cardsNotPlayedWrapper.style.display = 'block'; }
            }
            const adviceResult = recommendDiscardsForImprovement(bestPlayOverall.descriptiveCards, bestPlayOverall);
            discardAdviceSection.style.display = 'block'; adviceTextElement.textContent = adviceResult.advice;
            cardsToKeepElement.innerHTML = formatCardsForDisplay(adviceResult.keep);
            cardsToDiscardElement.innerHTML = formatCardsForDisplay(adviceResult.discard);
            keepDiscardInfoDiv.style.display = (adviceResult.keep.length === 5 && adviceResult.discard.length === 0 && ["Royal Flush", "Straight Flush", "Four of a Kind", "Full House", "Flush", "Straight"].includes(bestPlayOverall.name)) ? 'none' : 'grid';

            if (availableCardObjects.length > 5 && best5CardHandsData.length > 1) {
                otherHandsSection.style.display = 'block';
                best5CardHandsData.slice(1, 4).forEach(handData => {
                    const li = document.createElement('li'); const cardDisplayDiv = document.createElement('div');
                    cardDisplayDiv.className = 'card-image-display small-cards'; cardDisplayDiv.innerHTML = formatCardsForDisplay(handData.descriptiveCards);
                    li.innerHTML = `<strong>${handData.name}:</strong>`; li.appendChild(cardDisplayDiv); otherHandsListElement.appendChild(li);
                });
            }
            const resultCards = resultsArea.querySelectorAll('.result-card');
            resultCards.forEach((card, index) => {
                if (card.style.display !== 'none') {
                    card.style.opacity = '0'; setTimeout(() => { card.classList.add('reveal-animation'); card.style.opacity = '1';}, index * 80 + 50);
                }
            });
        } catch (e) { errorDisplay.textContent = `Oracle's Mischief: ${e.message}`; console.error(e); }
    });
});