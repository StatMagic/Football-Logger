// Global state management
const state = {
    teamA: [],
    teamB: [],
    match: {
        id: "",
        teamA: "Team A",
        teamB: "Team B",
        category: "",
        date: "",
        type: "",
        duration: "",
        team1_name_from_csv: "Team A",
        team2_name_from_csv: "Team B",
        team1_score: 0,
        team2_score: 0,
        avg_age: "",
        goalscorers: [],
        allGoalEvents: []
    },
    selectedPlayerId: null,
    currentLayout: 'name',
    gameLog: [],
    nextUniqueId: 1,
    highlights: {
        start: "",
        stop: "",
        currentState: "START"
    },
    player360ViewType: 'video',
    loggingMode: false
};

const playerDetailsMap = new Map();
const mediaBlobUrls = new Map();
let actionLog = []; // Stores string log entries
let highlightsLog = [];
let allHighlightsLog = [];
let videoPlayer;
let pendingGoalAction = null;

const teamAPlayerButtonsContainer = document.getElementById('teamAPlayerButtons');
const teamBPlayerButtonsContainer = document.getElementById('teamBPlayerButtons');
const teamAPlayerCount = document.getElementById('teamAPlayerCount');
const teamBPlayerCount = document.getElementById('teamBPlayerCount');
const addTeamAPlayerButton = document.getElementById('addTeamAPlayer');
const addTeamBPlayerButton = document.getElementById('addTeamBPlayer');
const removeTeamAPlayerButton = document.getElementById('removeTeamAPlayer');
const removeTeamBPlayerButton = document.getElementById('removeTeamBPlayer');
const gameLogTextBox = document.getElementById('gameLogTextBox');
const gameHighlightsTextBox = document.getElementById('gameHighlightsTextBox');
const popup = document.getElementById('popup');
const playerEditPopup = document.getElementById('playerEditPopup');
const layoutControls = document.querySelectorAll('input[name="layout"]');
const undoButton = document.getElementById('undoButton');
const matchVideoPlayer = document.getElementById('matchVideoPlayer');
const videoUrlInput = document.getElementById('videoUrlInput');
const updateVideoButton = document.getElementById('updateVideoButton');
const displayMatchSummaryText = document.getElementById('displayMatchSummaryText');
const player360ViewModeRadios = document.querySelectorAll('input[name="player360ViewMode"]');
const player360RosterSelect = document.getElementById('player360RosterSelect');
const player360VideoPlayerContainer = document.getElementById('player360VideoPlayerContainer');
const player360ManualIdDisplay = document.getElementById('player360ManualIdDisplay'); 
const uploadMatchFileButton = document.getElementById('uploadMatchFileButton');
const matchFileUploadInput = document.getElementById('matchFileUploadInput');
const playerImageUpload = document.getElementById('playerImageUpload');
const uploadPlayerImageBtn = document.getElementById('uploadPlayerImageBtn');
const playerImagePreview = document.getElementById('playerImagePreview');
const playerImageUploadSection = document.getElementById('playerImageUploadSection');

const actionButtonHotkeys = new Map([
    ['passBtn', { key: 'P', shiftKey: false, display: '(P)' }],
    ['longPassBtn', { key: 'L', shiftKey: false, display: '(L)' }],
    ['throughBallBtn', { key: 'T', shiftKey: false, display: '(T)' }],
    ['shotBallBtn', { key: 'X', shiftKey: false, display: '(X)' }],
    ['crossBtn', { key: 'C', shiftKey: false, display: '(C)' }],
    ['dribbleAttemptBtn', { key: 'D', shiftKey: false, display: '(D)' }],
    ['miscontrolBtn', { key: 'J', shiftKey: false, display: '(J)' }],
    ['goalBtn', { key: 'G', shiftKey: false, display: '(G)' }],
    ['noActionBtn', { key: 'N', shiftKey: false, display: '(N)' }],
    ['defensiveActionBtn', { key: 'E', shiftKey: false, display: '(E)' }],
    ['clearanceBtn', { key: 'R', shiftKey: false, display: '(R)' }],
    ['ownGoalBtn', { key: 'O', shiftKey: false, display: '(O)' }],
    ['saveBtn', { key: 'S', shiftKey: true, display: '(Shift+S)' }],
    ['catchBtn', { key: 'V', shiftKey: false, display: '(V)' }],
    ['punchBtn', { key: 'U', shiftKey: false, display: '(U)' }],
    ['cornerBtn', { key: '1', shiftKey: false, display: '(1)' }],
    ['freeKickBtn', { key: '2', shiftKey: false, display: '(2)' }],
    ['penaltyBtn', { key: '3', shiftKey: false, display: '(3)' }],
    ['outOfBoundsBtn', { key: '4', shiftKey: false, display: '(4)' }],
    ['offsideBtn', { key: '5', shiftKey: false, display: '(5)' }],
    ['headerBtn', { key: 'A', shiftKey: false, display: '(A)' }],
    ['woodworkBtn', { key: 'W', shiftKey: false, display: '(W)' }],
    ['moiBtn', { key: 'Q', shiftKey: false, display: '(Q)' }],
    ['aerialDuelBtn', { key: 'Z', shiftKey: false, display: '(Z)' }],
    ['highlightWorthyBtn', { key: 'B', shiftKey: false, display: '(B)' }],
    ['skillMoveBtn', { key: 'K', shiftKey: false, display: '(K)' }]
]);


addTeamAPlayerButton.addEventListener('click', () => addPlayer('teamA'));
addTeamBPlayerButton.addEventListener('click', () => addPlayer('teamB'));
removeTeamAPlayerButton.addEventListener('click', () => removePlayer('teamA'));
removeTeamBPlayerButton.addEventListener('click', () => removePlayer('teamB'));
undoButton.addEventListener('click', undoAction);
document.getElementById('saveToHighlightsButton').addEventListener('click', startStopHighlights);
document.getElementById('calculateStats').addEventListener('click', calculateStats);
updateVideoButton.addEventListener('click', updateVideo);

if (uploadMatchFileButton && matchFileUploadInput) {
    uploadMatchFileButton.addEventListener('click', () => {
        matchFileUploadInput.click();
    });
    matchFileUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            processUploadedMatchFile(file);
        }
        matchFileUploadInput.value = ''; // Reset file input
    });
}

player360ViewModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        state.player360ViewType = event.target.value;
        refresh360Content();
    });
});

if (uploadPlayerImageBtn && playerImageUpload) {
    uploadPlayerImageBtn.addEventListener('click', () => {
        playerImageUpload.click();
    });

    playerImageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Clear and show preview
                playerImagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                playerImagePreview.appendChild(img);
                playerImagePreview.style.display = 'block';

                // Show success message
                const successMessage = document.getElementById('uploadSuccessMessage');
                if (successMessage) {
                    // Reset the animation by removing and re-adding the element
                    const newMessage = successMessage.cloneNode(true);
                    successMessage.parentNode.replaceChild(newMessage, successMessage);
                    newMessage.style.display = 'block';
                    newMessage.style.animation = 'fadeOut 2s forwards';
                    newMessage.style.animationDelay = '1s';
                }

                // Ensure the upload section is visible
                if (playerImageUploadSection) {
                    playerImageUploadSection.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

function refresh360Content() {
    const manualIdDisp = player360ManualIdDisplay; 
    if (state.selectedPlayerId) {
        render360Content(playerDetailsMap.get(state.selectedPlayerId));
    } else {
        player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Player 360° view will appear here.</div>`;
        if(manualIdDisp) manualIdDisp.textContent = ''; 
    }
}

function logActionFromButton(buttonId) {
    if (!state.selectedPlayerId) {
        alert('Error: No player selected to log action for.');
        return;
    }
    const playerDetails = playerDetailsMap.get(state.selectedPlayerId);
    if (!playerDetails) {
        alert('Error: Selected player details not found.');
        return;
    }

    const actionButton = document.getElementById(buttonId);
    if (!actionButton) {
        alert(`Error: Action button with ID ${buttonId} not found.`);
        return;
    }

    if (buttonId === 'goalBtn' || buttonId === 'ownGoalBtn') {  
        return;
    }

    const actionText = actionButton.textContent.trim().split(" (")[0];
    const timestamp = getVideoPlayerTimeStamp();
    const teamName = playerDetails.team === 'teamA' ? state.match.teamA : state.match.teamB;

    // MODIFIED LOG FORMAT
    const logEntry = `Player (Name: ${playerDetails.playerName || 'N/A'}, PID: ${playerDetails.playerId || 'N/A'}, Jersey: ${playerDetails.jerseyId || 'N/A'}, Manual ID: ${playerDetails.manualId || 'N/A'}) | Team (${teamName}) | Action: ${actionText} | Timestamp: ${timestamp}`;
    actionLog.push(logEntry);
    gameLogTextBox.value += logEntry + '\n';
    gameLogTextBox.scrollTop = gameLogTextBox.scrollHeight;

    showGreenTick(`Logged: ${actionText}`);
    copyToClipboard();
}

function setupActionButtons() {
    actionButtonHotkeys.forEach((hotkeyConfig, buttonId) => {
        const button = document.getElementById(buttonId);
        if (button) {
            const originalText = button.textContent.trim().split(" (")[0];
            button.textContent = `${originalText} ${hotkeyConfig.display}`;

            button.addEventListener('click', () => {
                if (!button.disabled && state.loggingMode) {
                    logActionFromButton(buttonId);
                }
            });
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            console.warn(`Button with ID '${buttonId}' not found for hotkey setup.`);
        }
    });
    const saveHighlightBtn = document.getElementById('saveToHighlightsButton');
    if (saveHighlightBtn && saveHighlightBtn.textContent.indexOf('(H)') === -1) {
        saveHighlightBtn.textContent = `${saveHighlightBtn.textContent.trim().split(" (")[0]} (H)`;
    }
}

layoutControls.forEach(radio => {
    radio.addEventListener('change', (e) => {
        state.currentLayout = e.target.value;
        updateAllPlayerButtons();
        populatePlayer360RosterSelect();
    });
});

function generateUniqueId() { return `player_${state.nextUniqueId++}`; }

function createPlayerButton(uniqueId, isOpposition = false) {
    const button = document.createElement('button');
    button.classList.add('player-button');
    if (isOpposition) button.classList.add('opposition');
    button.dataset.uniqueId = uniqueId;
    const textSpan = document.createElement('span');
    textSpan.classList.add('player-text');
    button.appendChild(textSpan);
    const editIcon = document.createElement('span');
    editIcon.innerHTML = '✎'; editIcon.classList.add('edit-icon');
    editIcon.title = "Edit Player Details";
    editIcon.addEventListener('click', (e) => { e.stopPropagation(); showEditPopup(uniqueId); });
    button.appendChild(editIcon);
    updatePlayerButtonText(button);
    return button;
}

function addPlayer(team) {
    const uniqueId = generateUniqueId();
    const teamLetter = team === 'teamA' ? 'A' : 'B';
    let maxNum = 0;
    playerDetailsMap.forEach(details => {
        if (details.team === team && details.playerId.startsWith(teamLetter)) {
            const num = parseInt(details.playerId.substring(1), 10);
            if (!isNaN(num) && num > maxNum) { maxNum = num; }
        }
    });
    const nextPlayerNum = maxNum + 1;
    state[team].push(uniqueId);
    playerDetailsMap.set(uniqueId, {
        playerId: `${teamLetter}${nextPlayerNum}`, original_player_id_from_csv: null,
        manualId: 'N/A', jerseyId: 'N/A', playerName: "New Player " + nextPlayerNum, team: team,
        video_360_filename: "", video_360_src: "", video_360_thumbnail_src: ""
    });
    const button = createPlayerButton(uniqueId, team === 'teamB');
    button.addEventListener('click', () => handlePlayerSelection(uniqueId));
    const container = team === 'teamA' ? teamAPlayerButtonsContainer : teamBPlayerButtonsContainer;
    container.appendChild(button);
    updateTeamPlayerCount(team);
    populatePlayer360RosterSelect();
}

function removePlayer(team) {
    if (state[team].length > 0) {
        const uniqueIdToRemove = state[team].pop();
        const details = playerDetailsMap.get(uniqueIdToRemove);
        if (details) {
            if (details.video_360_src && details.video_360_src.startsWith('blob:')) {
                URL.revokeObjectURL(details.video_360_src);
                const videoKey = details.video_360_filename ? `player_360_videos/${details.video_360_filename}` : null;
                if(videoKey) mediaBlobUrls.delete(videoKey);
            }
        }
        playerDetailsMap.delete(uniqueIdToRemove);
        const container = team === 'teamA' ? teamAPlayerButtonsContainer : teamBPlayerButtonsContainer;
        const buttonToRemove = container.querySelector(`[data-unique-id="${uniqueIdToRemove}"]`);
        if (buttonToRemove) container.removeChild(buttonToRemove);
        if (state.selectedPlayerId === uniqueIdToRemove) {
            state.selectedPlayerId = null;
            updateActionButtonsState();
        }
        updateTeamPlayerCount(team);
        populatePlayer360RosterSelect();
    }
}
function updateTeamPlayerCount(team) {
    const countElement = team === 'teamA' ? teamAPlayerCount : teamBPlayerCount;
    countElement.textContent = state[team].length;
}
function updatePlayerButtonText(button) {
    const uniqueId = button.dataset.uniqueId;
    const details = playerDetailsMap.get(uniqueId);
    const textSpan = button.querySelector('.player-text');
    if (textSpan && details) {
        let displayText = details.playerId;
        switch (state.currentLayout) {
            case 'manual': displayText = details.manualId || 'N/A'; break;
            case 'jersey': displayText = details.jerseyId || 'N/A'; break;
            case 'name': displayText = details.playerName || 'N/A'; break;
        }
        textSpan.textContent = displayText;
    } else if (!details && textSpan) {
        textSpan.textContent = "Error";
    }
}

function enableActionButtons(enable) {
    actionButtonHotkeys.forEach((_, buttonId) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !enable;
        }
    });
}

function handlePlayerSelection(uniqueId) {
    const allPlayerButtons = document.querySelectorAll('.team-section-container .player-button');
    const clickedButton = document.querySelector(`.player-button[data-unique-id="${uniqueId}"]`);
    if (!clickedButton) return;

    const playerDetails = playerDetailsMap.get(uniqueId);
    if (!playerDetails) return; 

    const previouslySelectedPlayerId = state.selectedPlayerId;

    allPlayerButtons.forEach(button => button.classList.remove('selected'));

    if (previouslySelectedPlayerId === uniqueId) {
        state.selectedPlayerId = null;
        updateActionButtonsState();
        player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Player 360° view will appear here.</div>`;
        if (player360ManualIdDisplay) player360ManualIdDisplay.textContent = ''; 
    } else {
        clickedButton.classList.add('selected');
        state.selectedPlayerId = uniqueId;
        updateActionButtonsState();

        if (state.loggingMode) {
            const timestamp = getVideoPlayerTimeStamp();
            const teamName = playerDetails.team === 'teamA' ? state.match.teamA : state.match.teamB;

            // MODIFIED LOG FORMAT
            const logEntry = `Player (Name: ${playerDetails.playerName || 'N/A'}, PID: ${playerDetails.playerId || 'N/A'}, Jersey: ${playerDetails.jerseyId || 'N/A'}, Manual ID: ${playerDetails.manualId || 'N/A'}) | Team (${teamName}) | Action: Player Selected | Timestamp: ${timestamp}`;
            actionLog.push(logEntry);
            gameLogTextBox.value += logEntry + '\n';
            gameLogTextBox.scrollTop = gameLogTextBox.scrollHeight;
            showGreenTick(`Selected: ${playerDetails.playerName}`);
            copyToClipboard();
        }

        render360Content(playerDetails);
    }
}

function render360Content(details) {
    player360VideoPlayerContainer.innerHTML = '';
    const manualIdDisp = player360ManualIdDisplay; 

    if (!details) {
        player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Player details not found.</div>`;
        if(manualIdDisp) manualIdDisp.textContent = ''; 
        return;
    }

    if(manualIdDisp) { 
        manualIdDisp.textContent = `Manual ID: ${details.manualId || 'N/A'}`;
    }

    if (state.player360ViewType === 'thumbnail') {
        if (details.video_360_thumbnail_src) {
            const imgElement = document.createElement('img');
            imgElement.src = details.video_360_thumbnail_src;
            imgElement.alt = `Thumbnail for ${details.playerName || details.playerId}`;
            imgElement.onerror = () => { player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Error loading thumbnail.</div>`; };
            player360VideoPlayerContainer.appendChild(imgElement);
        } else { player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">No thumbnail available.</div>`; }
    } else {
        if (details.video_360_src) {
            const videoElement = document.createElement('video');
            videoElement.src = details.video_360_src;
            videoElement.controls = true; videoElement.autoplay = true; videoElement.muted = true;
            videoElement.onerror = () => { player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Error loading video.</div>`; };
            player360VideoPlayerContainer.appendChild(videoElement);
        } else { player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">No video available.</div>`; }
    }
}

function showEditPopup(uniqueId) {
    const details = playerDetailsMap.get(uniqueId);
    if (!details) return;

    document.getElementById('editManualId').value = details.manualId || '';
    document.getElementById('editJerseyId').value = details.jerseyId || '';
    document.getElementById('editPlayerName').value = details.playerName || '';

    // Reset success message and preview
    const successMessage = document.getElementById('uploadSuccessMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
        successMessage.style.animation = 'none';
    }

    // Reset image preview
    if (playerImagePreview) {
        playerImagePreview.innerHTML = '';
        playerImagePreview.style.display = 'none';
    }

    // Show image upload section if player doesn't have a 360 video
    if (playerImageUploadSection) {
        if (!details.video_360_src) {
            playerImageUploadSection.style.display = 'block';
            if (details.video_360_thumbnail_src) {
                const img = document.createElement('img');
                img.src = details.video_360_thumbnail_src;
                playerImagePreview.innerHTML = '';
                playerImagePreview.appendChild(img);
                playerImagePreview.style.display = 'block';
            }
        } else {
            // If player has a 360 video, check if it's an uploaded image
            const isUploadedImage = details.video_360_src.startsWith('data:image');
            if (isUploadedImage) {
                playerImageUploadSection.style.display = 'block';
                const img = document.createElement('img');
                img.src = details.video_360_src;
                playerImagePreview.innerHTML = '';
                playerImagePreview.appendChild(img);
                playerImagePreview.style.display = 'block';
            } else {
                playerImageUploadSection.style.display = 'none';
            }
        }
    }

    // Reset file input
    if (playerImageUpload) {
        playerImageUpload.value = '';
    }

    playerEditPopup.dataset.uniqueId = uniqueId;
    playerEditPopup.style.display = 'flex';
}

function savePlayerDetails() {
    const uniqueId = playerEditPopup.dataset.uniqueId;
    if (!uniqueId) return;

    const details = playerDetailsMap.get(uniqueId);
    if (!details) return;

    // Update player details
    details.manualId = document.getElementById('editManualId').value;
    details.jerseyId = document.getElementById('editJerseyId').value;
    details.playerName = document.getElementById('editPlayerName').value;

    // If there's a new image uploaded, update both video and thumbnail sources
    if (playerImagePreview.firstChild) {
        const img = playerImagePreview.firstChild;
        if (img.src) {
            details.video_360_src = img.src;
            details.video_360_thumbnail_src = img.src;
        }
    }

    // Update the player card and refresh 360 content
    playerDetailsMap.set(uniqueId, details);
    document.querySelectorAll(`[data-unique-id="${uniqueId}"]`).forEach(updatePlayerButtonText);
    refresh360Content();
    
    // Close the popup
    playerEditPopup.style.display = 'none';
}

function updateAllPlayerButtons() {
    document.querySelectorAll('.player-button').forEach(updatePlayerButtonText);
}

function getPlayerDisplayText(uniqueId) {
    const details = playerDetailsMap.get(uniqueId);
    if (!details) return 'Unknown Player';
    switch (state.currentLayout) {
        case 'manual': return details.manualId || 'N/A';
        case 'jersey': return details.jerseyId || 'N/A';
        case 'name': return details.playerName || 'Player?';
        default: return details.playerId || 'PID?';
    }
}
function undoAction() {
    if (actionLog.length > 0) {
        const lastAction = actionLog.pop();
        gameLogTextBox.value = actionLog.join('\n') + (actionLog.length > 0 ? '\n' : '');
        alert(`Action removed:\n${lastAction}`);
        copyToClipboard();
    } else {
        alert("No actions in the log to undo.");
    }
}
function copyToClipboard() {
    const clipboardContent = `Game Log:\n${gameLogTextBox.value}\n--------\nGame Highlights:\n${gameHighlightsTextBox.value}`;
    navigator.clipboard.writeText(clipboardContent).catch(err => console.error('Failed to copy to clipboard: ', err));
}
function createPlayerCheckboxes() {
    const allPlayerMapKeys = Array.from(playerDetailsMap.keys());
    if (allPlayerMapKeys.length === 0) return "<p>No players available.</p>";
    return allPlayerMapKeys.map(mapKey => {
        const details = playerDetailsMap.get(mapKey); if (!details) return '';
        const displayText = getPlayerDisplayText(mapKey);
        const safeMapKey = mapKey.replace(/[^a-zA-Z0-9_]/g, "");
        return `<div><input type="checkbox" id="highlight_player_${safeMapKey}" class="player-checkbox" data-unique-id="${mapKey}"><label for="highlight_player_${safeMapKey}">${displayText}</label></div>`;
    }).join('');
}
function startStopHighlights() {
    const button = document.getElementById('saveToHighlightsButton');
    const currentTime = getVideoPlayerTimeStamp();
    if (state.highlights.currentState === "START") {
        state.highlights.start = currentTime; state.highlights.currentState = "STOP";
        button.innerText = "Stop Highlight (H)"; button.style.backgroundColor = "#dc3545";
    } else {
        state.highlights.stop = currentTime; state.highlights.currentState = "START";
        button.innerText = "Save Highlight (H)"; button.style.backgroundColor = "#28a745";
        if (videoPlayer && typeof videoPlayer.pauseVideo === 'function') videoPlayer.pauseVideo();
        showHighlightsPopup();
    }
}
function showHighlightsPopup() {
    const content = `<div class="highlights-popup-content"><h2>Add Highlight Details</h2><div class="highlights-form"><div class="form-group"><label for="startTimestamp">Start Timestamp:</label><input type="text" id="startTimestamp" value="${state.highlights.start||''}" placeholder="HH:MM:SS"></div><div class="form-group"><label for="endTimestamp">Stop Timestamp:</label><input type="text" id="endTimestamp" value="${state.highlights.stop||''}" placeholder="HH:MM:SS"></div><div class="form-group"><label for="notes">Notes:</label><textarea id="notes" placeholder="Describe..."></textarea></div><div class="form-group"><label>Players Involved (Optional):</label><div class="highlights-players">${createPlayerCheckboxes()}</div></div><div class="popup-buttons"><button id="cancelHighlights">Cancel</button><button id="saveHighlights">Save Highlight</button></div></div></div>`;
    const popupContentDiv = popup.querySelector('.popup-content'); if (!popupContentDiv) return;
    popupContentDiv.innerHTML = content;
    if (!popupContentDiv.querySelector('.close')) {
        const closeBtn = document.createElement('span'); closeBtn.classList.add('close'); closeBtn.innerHTML = '×';
        closeBtn.onclick = () => { popup.style.display = 'none'; resetHighlightState(); };
        popupContentDiv.prepend(closeBtn);
    }
    popup.style.display = 'flex';
    const cancelButton = popupContentDiv.querySelector('#cancelHighlights');
    const saveButton = popupContentDiv.querySelector('#saveHighlights');
    if (cancelButton) cancelButton.onclick = () => { popup.style.display = 'none'; resetHighlightState(); };
    if (saveButton) saveButton.onclick = () => { saveHighlightDetails(); popup.style.display = 'none'; resetHighlightState(); };
}
function resetHighlightState() { state.highlights.start = ""; state.highlights.stop = ""; }
function saveHighlightDetails() {
    const startTimestamp = document.getElementById('startTimestamp')?.value.trim() || 'N/A';
    const endTimestamp = document.getElementById('endTimestamp')?.value.trim() || 'N/A';
    const notes = document.getElementById('notes')?.value.trim() || 'No notes.';
    const selectedPlayers = Array.from(document.querySelectorAll('.player-checkbox:checked')).map(cb => getPlayerDisplayText(cb.dataset.uniqueId));
    const playersText = selectedPlayers.length > 0 ? selectedPlayers.join(', ') : 'None';
    const highlightEntry = `Inpoint: ${startTimestamp}\nOutpoint: ${endTimestamp}\nNotes: ${notes}\nPlayers: ${playersText}`;
    gameHighlightsTextBox.value += (gameHighlightsTextBox.value ? '\n\n---\n\n' : '') + highlightEntry;
    gameHighlightsTextBox.scrollTop = gameHighlightsTextBox.scrollHeight;
    showGreenTick("Highlight Saved!"); copyToClipboard();
}
document.querySelectorAll('.close').forEach(cb => {
    cb.addEventListener('click', () => {
        const pPop = cb.closest('.popup'); if (!pPop) return;
        pPop.style.display = 'none';
        if (pPop === popup) {
            resetHighlightState();
            const hBtn = document.getElementById('saveToHighlightsButton');
            if (state.highlights.currentState === 'STOP') {
                state.highlights.currentState = "START";
                hBtn.innerText = "Save Highlight (H)"; hBtn.style.backgroundColor = "#28a745";
            }
        }
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('popup')) {
        e.target.style.display = 'none';
        if (e.target === popup) {
            resetHighlightState();
            const hBtn = document.getElementById('saveToHighlightsButton');
            if (state.highlights.currentState === 'STOP') {
                state.highlights.currentState = "START";
                hBtn.innerText = "Save Highlight (H)"; hBtn.style.backgroundColor = "#28a745";
            }
        }
    }
});
function getVideoPlayerTimeStamp() {
    const videoElement = matchVideoPlayer.querySelector('video');
    if (videoElement) {
        const currentTime = videoElement.currentTime;
        if (typeof currentTime === 'number' && !isNaN(currentTime)) {
            const hours = Math.floor(currentTime/3600);
            const minutes = Math.floor((currentTime%3600)/60);
            const secs = Math.floor(currentTime%60);
            return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }
    }
    return '00:00:00';
}
function calculateStats() {
    alert("Statistics calculation needs to be updated for the new logging format.");
    displayStatsPopup("<p>Stats parser needs update for new log format.</p>", "<p>Stats parser needs update for new log format.</p>");
}
function generatePlayerStatsTable(stats) { return `<table><thead><tr><th>Stats</th></tr></thead><tbody><tr><td>${stats}</td></tr></tbody></table>`; }
function generateMatchStatsTable(stats) { return `<table><thead><tr><th>Stats</th></tr></thead><tbody><tr><td>${stats}</td></tr></tbody></table>`; }
function displayStatsPopup(playerStatsTableHTML, matchStatsTableHTML) {
    let statsPopup = document.getElementById('statsPopupContainer');
    if (!statsPopup) { statsPopup = document.createElement('div'); statsPopup.id = 'statsPopupContainer'; statsPopup.classList.add('stats-popup','full-screen'); document.body.appendChild(statsPopup); }
    statsPopup.innerHTML = `<div class="stats-popup-content"><div class="stats-popup-header"><h2>Stats</h2><a href="#" class="download-button" id="downloadStatsZipBtn">Download Zip</a><span class="close-button" id="closeStatsPopupBtn">×</span></div><div class="stats-container" id="playerStatsContainer">${playerStatsTableHTML}</div><hr><div class="stats-container" id="matchStatsContainer">${matchStatsTableHTML}</div></div>`;
    document.getElementById('closeStatsPopupBtn').addEventListener('click', () => statsPopup.remove());
    document.getElementById('downloadStatsZipBtn').addEventListener('click', (e) => { e.preventDefault(); exportTablesToZip(); });
    statsPopup.addEventListener('click', (e) => { if (e.target === statsPopup) statsPopup.remove(); });
    statsPopup.style.display = 'flex';
}

function showGreenTick(message) {
    const tickElement = document.createElement('div');
    tickElement.innerHTML = message;
    tickElement.className = 'green-tick';
    document.body.appendChild(tickElement);
    setTimeout(() => {
        if (document.body.contains(tickElement)) {
            document.body.removeChild(tickElement);
        }
    }, 2000);
}

function updateVideo() {
    const videoUrl = videoUrlInput.value.trim();
    if (!videoUrl) {
        alert('Please enter a video URL.');
        return;
    }

    // Create video element if it doesn't exist
    if (!matchVideoPlayer.querySelector('video')) {
        const videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        matchVideoPlayer.innerHTML = '';
        matchVideoPlayer.appendChild(videoElement);
    }

    // Update video source
    const videoElement = matchVideoPlayer.querySelector('video');
    videoElement.src = videoUrl;
    videoElement.load();
}

function resetApplicationStateForNewFile() {
    state.match = { id: "", teamA: "Team A", teamB: "Team B", category: "", date: "", type: "", duration: "", team1_name_from_csv: "Team A", team2_name_from_csv: "Team B", team1_score: 0, team2_score: 0, avg_age: "", goalscorers: [], allGoalEvents: [] };
    state.teamA = []; state.teamB = [];
    mediaBlobUrls.forEach(url => { 
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    });
    mediaBlobUrls.clear(); 
    playerDetailsMap.clear();
    teamAPlayerButtonsContainer.innerHTML = ''; 
    teamBPlayerButtonsContainer.innerHTML = '';
    updateTeamPlayerCount('teamA'); 
    updateTeamPlayerCount('teamB');
    state.selectedPlayerId = null; 
    state.nextUniqueId = 1;
    state.loggingMode = false;
    if (loggingModeToggle) loggingModeToggle.checked = false;
    updateActionButtonsState();
    videoUrlInput.value = "";
    if (matchVideoPlayer.querySelector('video')) {
        const videoElement = matchVideoPlayer.querySelector('video');
        videoElement.pause();
        videoElement.src = '';
        videoElement.load();
    }
    state.player360ViewType = 'video'; 
    document.querySelector('input[name="player360ViewMode"][value="video"]').checked = true;
    if(player360ManualIdDisplay) player360ManualIdDisplay.textContent = ''; 
    updateLiveScoreDisplay(); 
    updateMatchDetailsDisplay();
    actionLog = []; 
    gameLogTextBox.value = "";
    console.log("Application state reset for new file.");
}

function formatScorersForLog(scorers) {
    if (scorers.length === 0) return "None";
    return scorers.map(ev =>
        `${ev.scorerName}${ev.isOwnGoal ? ' (OG)' : ''}${ev.count > 1 ? ` (${ev.count})` : ''}`
    ).join(', ');
}

function logMatchDetailsAndScorers() {
    const { teamA, teamB, team1_score, team2_score, type, date, duration, avg_age, allGoalEvents } = state.match;

    const t1GE = allGoalEvents.filter(ev => ev.scoredForTeamId === 'team1');
    const t2GE = allGoalEvents.filter(ev => ev.scoredForTeamId === 'team2');

    const aggregateScorers = (events) => {
        const agg = new Map();
        events.forEach(ev => {
            const key = `${ev.scorerPlayerId}-${ev.isOwnGoal}`; 
            if (agg.has(key)) {
                agg.get(key).count += ev.count;
            } else {
                agg.set(key, { ...ev });
            }
        });
        return Array.from(agg.values());
    };

    const teamAScorersList = formatScorersForLog(aggregateScorers(t1GE));
    const teamBScorersList = formatScorersForLog(aggregateScorers(t2GE));

    const matchInfoLog = `--- MATCH DETAILS LOADED ---
Match: ${type || 'N/A'} on ${date || 'N/A'}
Duration: ${duration || 'N/A'} min
Avg Age Category: ${avg_age || 'N/A'}
Score: ${teamA || 'Team A'} ${team1_score} - ${team2_score} ${teamB || 'Team B'}
${teamA || 'Team A'} Scorers: ${teamAScorersList}
${teamB || 'Team B'} Scorers: ${teamBScorersList}
-----------------------------`;

    actionLog.push(matchInfoLog);
    gameLogTextBox.value += (gameLogTextBox.value.length > 0 && !gameLogTextBox.value.endsWith('\n') ? '\n' : '') + matchInfoLog + '\n';
    gameLogTextBox.scrollTop = gameLogTextBox.scrollHeight;
}


async function processUploadedMatchFile(file) {
    if (!file || !file.name.endsWith('.zip')) { alert("Please upload a valid ZIP file."); return; }
    resetApplicationStateForNewFile();
    try {
        const jszip = new JSZip(); const zip = await jszip.loadAsync(file);
        const gameDetailsFile = zip.file("game_details.csv");
        if (gameDetailsFile) parseGameDetailsCSV(await gameDetailsFile.async("text"));
        else alert("game_details.csv not found.");

        const goalscorersFile = zip.file("goalscorers.csv");
        if (goalscorersFile) parseGoalscorersCSV(await goalscorersFile.async("text"));
        else { console.log("goalscorers.csv not found."); state.match.allGoalEvents = []; state.match.team1_score = 0; state.match.team2_score = 0; }

        const playersFile = zip.file("players.csv");
        if (playersFile) await parseAndSetupPlayersCSV(await playersFile.async("text"), zip);
        else alert("players.csv not found.");

        updateMatchDetailsDisplay(); updateLiveScoreDisplay(); updateAllPlayerButtons(); populatePlayer360RosterSelect();
        document.querySelector('input[name="layout"][value="name"]').checked = true; state.currentLayout = 'name';
        
        logMatchDetailsAndScorers(); 

        alert("Match file processed successfully!");
    } catch (error) {
        console.error("Error processing ZIP file:", error); alert("Error processing ZIP file.");
        resetApplicationStateForNewFile(); updateMatchDetailsDisplay(); updateLiveScoreDisplay();
        updateAllPlayerButtons(); populatePlayer360RosterSelect();
    }
}

function parseGameDetailsCSV(csvText) {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) { console.warn("game_details.csv is empty or has no data rows."); return; }
    const headers = lines[0].split(',').map(h => h.trim()); const values = lines[1].split(',').map(v => v.trim());
    const matchData = {}; headers.forEach((header, index) => { matchData[header] = values[index] || ""; });
    state.match.category = matchData.match_category || state.match.category;
    state.match.date = matchData.match_date || state.match.date;
    state.match.type = matchData.match_type || state.match.type;
    state.match.duration = matchData.match_duration_minutes || state.match.duration;
    state.match.teamA = matchData.team1_name || state.match.teamA;
    state.match.teamB = matchData.team2_name || state.match.teamB;
    state.match.team1_name_from_csv = matchData.team1_name || "Team A";
    state.match.team2_name_from_csv = matchData.team2_name || "Team B";
    state.match.team1_score = parseInt(matchData.team1_score, 10) || 0; 
    state.match.team2_score = parseInt(matchData.team2_score, 10) || 0; 
    state.match.avg_age = matchData.average_age_category || state.match.avg_age;
}

function parseGoalscorersCSV(csvText) {
    state.match.team1_score = 0; state.match.team2_score = 0; state.match.allGoalEvents = [];
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) { console.warn("goalscorers.csv empty."); return; }
    const headers = lines[0].split(',').map(h => h.trim()); const dataRows = lines.slice(1);
    const pIdIdx = headers.indexOf("player_id"), pNameIdx = headers.indexOf("player_name"), pTeamIdIdx = headers.indexOf("player_team_identifier"), goalsOwnIdx = headers.indexOf("goals_for_own_team"), goalsOGIdx = headers.indexOf("own_goals_for_opponent");
    if ([pIdIdx, pNameIdx, pTeamIdIdx, goalsOwnIdx, goalsOGIdx].some(idx => idx === -1)) { console.error("goalscorers.csv missing columns."); return; }
    dataRows.forEach(rowStr => {
        const vals = rowStr.split(',').map(v => v.trim());
        const pId = vals[pIdIdx], pName = vals[pNameIdx], pTeamId = vals[pTeamIdIdx], gOwn = parseInt(vals[goalsOwnIdx],10), gOG = parseInt(vals[goalsOGIdx],10);
        if (!pId || !pName || !pTeamId) return;
        if (!isNaN(gOwn) && gOwn > 0) {
            let scoredFor = "";
            if (pTeamId === 'team1') { state.match.team1_score += gOwn; scoredFor = 'team1'; }
            else if (pTeamId === 'team2') { state.match.team2_score += gOwn; scoredFor = 'team2'; }
            if (scoredFor) state.match.allGoalEvents.push({ scorerPlayerId: pId, scorerName: pName, scoredForTeamId: scoredFor, isOwnGoal: false, count: gOwn });
        }
        if (!isNaN(gOG) && gOG > 0) {
            let scoredFor = "";
            if (pTeamId === 'team1') { state.match.team2_score += gOG; scoredFor = 'team2'; }
            else if (pTeamId === 'team2') { state.match.team1_score += gOG; scoredFor = 'team1'; }
            if (scoredFor) state.match.allGoalEvents.push({ scorerPlayerId: pId, scorerName: pName, scoredForTeamId: scoredFor, isOwnGoal: true, count: gOG });
        }
    });
}

async function parseAndSetupPlayersCSV(csvText, zip) {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) { console.warn("players.csv empty."); return; }
    const headers = lines[0].split(',').map(h => h.trim()); const dataRows = lines.slice(1);
    const pIdCol = headers.indexOf("player_id"), pNameCol = headers.indexOf("player_name"), teamIdCol = headers.indexOf("team_identifier"), vidFileCol = headers.indexOf("video_360_filename");
    if ([pIdCol, pNameCol, teamIdCol].some(idx => idx === -1)) { alert("players.csv missing columns."); return; }

    const promises = dataRows.map(async rowStr => {
        const vals = rowStr.split(',').map(v => v.trim());
        const csvPId = vals[pIdCol], pName = vals[pNameCol] || `P ${csvPId.slice(-3)}`, teamId = vals[teamIdCol], bareVidFile = vidFileCol !== -1 ? (vals[vidFileCol]||"") : "";
        if (!csvPId || !teamId) return;

        let vidSrc = "", thumbSrc = "", vidPathZip = bareVidFile ? `player_360_videos/${bareVidFile}` : "";
        if (vidPathZip && zip) {
            const vidFileInZip = zip.file(vidPathZip);
            if (vidFileInZip) {
                try { vidSrc = URL.createObjectURL(await vidFileInZip.async("blob")); mediaBlobUrls.set(vidPathZip, vidSrc); thumbSrc = await captureVideoFrame(vidSrc, 200).catch(e=>""); }
                catch (e) { console.error(`Err extracting ${vidPathZip}`, e); }
            } else console.warn(`Vid ${vidPathZip} not in ZIP for ${csvPId}`);
        }

        let targetTeam, targetCont, isOppo, intTeamId;
        if (teamId === "team1") { 
            targetTeam = state.teamA; 
            targetCont = teamAPlayerButtonsContainer; 
            isOppo = false; 
            intTeamId = 'teamA'; 
        }
        else if (teamId === "team2") { 
            targetTeam = state.teamB; 
            targetCont = teamBPlayerButtonsContainer; 
            isOppo = true; 
            intTeamId = 'teamB'; 
        }
        else return;

        targetTeam.push(csvPId);
        playerDetailsMap.set(csvPId, { 
            playerId: csvPId,  // Use original PID as the display PID
            original_player_id_from_csv: csvPId, 
            manualId: 'N/A', 
            jerseyId: 'N/A', 
            playerName: pName, 
            team: intTeamId, 
            video_360_filename: bareVidFile, 
            video_360_src: vidSrc, 
            video_360_thumbnail_src: thumbSrc 
        });
        
        const btn = createPlayerButton(csvPId, isOppo); 
        btn.addEventListener('click', () => handlePlayerSelection(csvPId)); 
        targetCont.appendChild(btn);
    });

    await Promise.all(promises);
    updateTeamPlayerCount('teamA'); 
    updateTeamPlayerCount('teamB');
}

function captureVideoFrame(videoSrc, desiredWidth = 320, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video'); video.style.cssText = 'position:fixed;opacity:0;left:-10000px;top:-10000px;';
        document.body.appendChild(video); video.preload = 'metadata'; video.muted = true; video.playsInline = true;
        let resolved = false; const cleanup = () => { video.removeEventListener('loadeddata', onLD); video.removeEventListener('seeked', onS); video.removeEventListener('error', onE); video.removeEventListener('stalled', onE); if (document.body.contains(video)) document.body.removeChild(video); };
        const onLD = () => { if (resolved) return; video.currentTime = 0.01; };
        const onS = () => { if (resolved) return; resolved = true; const cvs = document.createElement('canvas'); if (video.videoWidth === 0 || video.videoHeight === 0) { cleanup(); reject(new Error('Vid dims 0')); return; } const ar = video.videoWidth / video.videoHeight; cvs.width = desiredWidth; cvs.height = desiredWidth / ar; const ctx = cvs.getContext('2d'); if (!ctx) { cleanup(); reject(new Error('No ctx')); return; } ctx.drawImage(video, 0, 0, cvs.width, cvs.height); try { cleanup(); resolve(cvs.toDataURL('image/jpeg', quality)); } catch (e) { cleanup(); reject(new Error('DataURL fail: ' + e.message)); } };
        const onE = (ev) => { if (resolved) return; resolved = true; cleanup(); reject(new Error('Vid ' + ev.type + ' err for ' + videoSrc.substring(0,50))); };
        video.addEventListener('loadeddata', onLD); video.addEventListener('seeked', onS); video.addEventListener('error', onE); video.addEventListener('stalled', onE);
        video.src = videoSrc; video.load();
        setTimeout(() => { if (!resolved) { resolved = true; cleanup(); reject(new Error('Timeout for frame capture: ' + videoSrc.substring(0,50))); } }, 15000);
    });
}

function updateMatchDetailsDisplay() {
    if (!displayMatchSummaryText) return;
    const { type, date, duration, avg_age } = state.match;
    let summaryLines = []; let basicInfo = "";
    if (type || date || duration || avg_age) { basicInfo = `${type || 'Match'} on ${date || 'N/A'}. `; if (duration) basicInfo += `${duration} min. `; if (avg_age) basicInfo += `Avg age: ${avg_age}.`; }
    else { basicInfo = "Match details not yet loaded."; }
    if (basicInfo.trim() !== "") summaryLines.push(basicInfo.trim());
    displayMatchSummaryText.innerHTML = summaryLines.length > 0 ? summaryLines.join('<br>') : "Match details will appear here once a file is uploaded.";
    document.getElementById('team-a-name').innerText = state.match.teamA || "Team A";
    document.getElementById('team-b-name').innerText = state.match.teamB || "Team B";
}

function updateLiveScoreDisplay() {
    const scoreLineEl = document.getElementById('scoreLineDisplay'); const teamAScorersEl = document.getElementById('teamAScorersDisplay'); const teamBScorersEl = document.getElementById('teamBScorersDisplay');
    if (!scoreLineEl || !teamAScorersEl || !teamBScorersEl) { console.error("Score display elements not found."); return; }
    const tAName = state.match.teamA || "Team A"; const tBName = state.match.teamB || "Team B";
    scoreLineEl.textContent = `${tAName} ${state.match.team1_score} - ${state.match.team2_score} ${tBName}`;
    const aggregateScorers = (events) => { const agg = new Map(); events.forEach(ev => { const key = `${ev.scorerPlayerId}-${ev.isOwnGoal}`; if (agg.has(key)) agg.get(key).count += ev.count; else agg.set(key, { ...ev }); }); return Array.from(agg.values()); };
    const t1GE = state.match.allGoalEvents.filter(ev => ev.scoredForTeamId === 'team1'); const t2GE = state.match.allGoalEvents.filter(ev => ev.scoredForTeamId === 'team2');
    const aggT1S = aggregateScorers(t1GE); const aggT2S = aggregateScorers(t2GE);
    const formatScorers = (scorers) => scorers.length > 0 ? scorers.map(ev => `<span class="scorer-name">${ev.scorerName}</span>${ev.isOwnGoal ? ' <span class="og-tag">(OG)</span>':''}${ev.count > 1 ? ` (${ev.count})`:''}`).join(', ') : "";
    teamAScorersEl.innerHTML = `<p>${formatScorers(aggT1S)}</p>`; teamBScorersEl.innerHTML = `<p>${formatScorers(aggT2S)}</p>`;
}

function populatePlayer360RosterSelect() {
    if (!player360RosterSelect) return;
    const currentSelection = player360RosterSelect.value; player360RosterSelect.innerHTML = '<option value="">-- Select Player --</option>';
    const allPlayerMapKeys = Array.from(playerDetailsMap.keys());
    allPlayerMapKeys.forEach(mapKey => {
        const details = playerDetailsMap.get(mapKey); if (!details) return;
        const teamName = details.team === 'teamA' ? (state.match.teamA || 'Team A') : (state.match.teamB || 'Team B');
        const nameDisp = details.playerName && details.playerName !== 'N/A' ? details.playerName : details.playerId;
        let availTxt = details.video_360_src ? (details.video_360_thumbnail_src ? "" : " (No Thumb)") : (details.video_360_filename ? " (Vid N/A)" : " (No Vid/Thumb)");
        const option = document.createElement('option'); option.value = mapKey; option.textContent = `${nameDisp} (${teamName})${availTxt}`;
        if (!details.video_360_src && !details.video_360_thumbnail_src) { option.disabled = true; option.style.color = "#aaa"; }
        player360RosterSelect.appendChild(option);
    });
    if (allPlayerMapKeys.includes(currentSelection)) player360RosterSelect.value = currentSelection;
}

document.addEventListener('DOMContentLoaded', () => {
    updateMatchDetailsDisplay(); updateLiveScoreDisplay(); populatePlayer360RosterSelect();
    setupActionButtons();
    state.loggingMode = false;
    if (loggingModeToggle) loggingModeToggle.checked = false;
    updateActionButtonsState();
    if(player360ManualIdDisplay) player360ManualIdDisplay.textContent = ''; 
    const nameLayoutRadio = document.querySelector('input[name="layout"][value="name"]'); if (nameLayoutRadio) nameLayoutRadio.checked = true;
    const videoViewRadio = document.querySelector('input[name="player360ViewMode"][value="video"]'); if (videoViewRadio) videoViewRadio.checked = true;
    console.log("DOM Loaded. Initial state:", state);
});

// Add reset game log functionality
document.getElementById('resetGameLogButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the game log? This will clear all logged actions.')) {
        actionLog = [];
        gameLogTextBox.value = '';
        showGreenTick('Game log has been reset');
    }
});

// Add logging mode toggle functionality
const loggingModeToggle = document.getElementById('loggingModeToggle');
if (loggingModeToggle) {
    loggingModeToggle.addEventListener('change', (event) => {
        state.loggingMode = event.target.checked;
        // Deselect current player if any
        if (state.selectedPlayerId) {
            const selectedButton = document.querySelector(`.player-button[data-unique-id="${state.selectedPlayerId}"]`);
            if (selectedButton) {
                selectedButton.classList.remove('selected');
            }
            state.selectedPlayerId = null;
            player360VideoPlayerContainer.innerHTML = `<div class="video-placeholder-text">Player 360° view will appear here.</div>`;
            if (player360ManualIdDisplay) player360ManualIdDisplay.textContent = '';
        }
        updateActionButtonsState();
    });
}
function updateActionButtonsState() {
    const actionButtons = document.querySelectorAll('.action-panel .action-section button');
    actionButtons.forEach(button => {
        if (!state.loggingMode) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
            // Only enable buttons if a player is selected
            button.disabled = !state.selectedPlayerId;
        }
    });
}

function showGoalConfirmation(uniqueId, actionType) {
    const details = playerDetailsMap.get(uniqueId);
    if (!details) return;

    // Store the pending action
    pendingGoalAction = {
        uniqueId,
        actionType,
        timestamp: new Date().toISOString()
    };

    // Update popup title based on action type
    const popupTitle = document.querySelector('#goalConfirmationPopup h2');
    if (popupTitle) {
        popupTitle.textContent = `Confirm ${actionType === 'goal' ? 'Goal' : 'Own Goal'}`;
    }

    // Update player info with all details
    const playerInfo = document.getElementById('goalPlayerInfo');
    if (playerInfo) {
        playerInfo.innerHTML = `
            <div><strong>Player Name:</strong> ${details.playerName || 'N/A'}</div>
            <div><strong>Jersey Number:</strong> ${details.jerseyId || 'N/A'}</div>
            <div><strong>Manual ID:</strong> ${details.manualId || 'N/A'}</div>
            <div><strong>Player ID:</strong> ${details.playerId || 'N/A'}</div>
        `;
    }

    // Show player preview using thumbnail
    const previewContainer = document.getElementById('goalPlayerPreview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
        if (details.video_360_thumbnail_src) {
            const img = document.createElement('img');
            img.src = details.video_360_thumbnail_src;
            previewContainer.appendChild(img);
        }
    }

    // Show the popup
    const popup = document.getElementById('goalConfirmationPopup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

function confirmGoalAction() {
    if (!pendingGoalAction) return;

    const { uniqueId, actionType } = pendingGoalAction;
    const details = playerDetailsMap.get(uniqueId);
    if (!details) return;

    // Log the action directly instead of calling logActionFromButton
    const actionText = actionType === 'goal' ? 'Goal' : 'Own Goal';
    const timestamp = getVideoPlayerTimeStamp();
    const teamName = details.team === 'teamA' ? state.match.teamA : state.match.teamB;

    const logEntry = `Player (Name: ${details.playerName || 'N/A'}, PID: ${details.playerId || 'N/A'}, Jersey: ${details.jerseyId || 'N/A'}, Manual ID: ${details.manualId || 'N/A'}) | Team (${teamName}) | Action: ${actionText} | Timestamp: ${timestamp}`;
    actionLog.push(logEntry);
    gameLogTextBox.value += logEntry + '\n';

    showGreenTick(`Logged: ${actionText}`);
    copyToClipboard();

    // Close the popup
    const popup = document.getElementById('goalConfirmationPopup');
    if (popup) {
        popup.style.display = 'none';
    }

    // Clear the pending action
    pendingGoalAction = null;
}

function cancelGoalAction() {
    // Close the popup
    const popup = document.getElementById('goalConfirmationPopup');
    if (popup) {
        popup.style.display = 'none';
    }

    // Clear the pending action
    pendingGoalAction = null;
}

// Update the goal and own goal button click handlers to use confirmation
document.getElementById('goalBtn').onclick = () => {
    if (state.selectedPlayerId) {
        showGoalConfirmation(state.selectedPlayerId, 'goal');
    }
};

document.getElementById('ownGoalBtn').onclick = () => {
    if (state.selectedPlayerId) {
        showGoalConfirmation(state.selectedPlayerId, 'ownGoal');
    }
};

// Add event listener for the download analysis button
document.getElementById('downloadAnalysis').addEventListener('click', downloadAnalysis);

async function downloadAnalysis() {
    try {
        // Create a new zip file
        const zip = new JSZip();

        // Create updated players.csv content
        const playersCSV = createUpdatedPlayersCSV();
        zip.file("players.csv", playersCSV);

        // Add game log
        zip.file("game_log.txt", gameLogTextBox.value);
        zip.file("game_highlights.txt", gameHighlightsTextBox.value);

        // Create folders for player media
        const mediaFolder = zip.folder("player_360_videos");
        const thumbnailsFolder = zip.folder("player_360_thumbnails");

        // Add all player media files and thumbnails
        for (const [uniqueId, details] of playerDetailsMap.entries()) {
            // Add video if exists
            if (details.video_360_filename) {
                if (details.video_360_src && details.video_360_src.startsWith('blob:')) {
                    try {
                        const response = await fetch(details.video_360_src);
                        const blob = await response.blob();
                        mediaFolder.file(details.video_360_filename, blob);
                    } catch (error) {
                        console.error(`Error adding video for player ${uniqueId}:`, error);
                    }
                }
            }

            // Add thumbnail if exists
            if (details.video_360_thumbnail_src) {
                try {
                    let thumbnailBlob;
                    if (details.video_360_thumbnail_src.startsWith('blob:')) {
                        // If it's a blob URL, fetch it
                        const response = await fetch(details.video_360_thumbnail_src);
                        thumbnailBlob = await response.blob();
                    } else if (details.video_360_thumbnail_src.startsWith('data:')) {
                        // If it's a data URL, convert it to blob
                        const response = await fetch(details.video_360_thumbnail_src);
                        thumbnailBlob = await response.blob();
                    }

                    if (thumbnailBlob) {
                        // Generate thumbnail filename based on player ID
                        const thumbnailFilename = `${uniqueId}_thumbnail.jpg`;
                        thumbnailsFolder.file(thumbnailFilename, thumbnailBlob);
                    }
                } catch (error) {
                    console.error(`Error adding thumbnail for player ${uniqueId}:`, error);
                }
            }
        }

        // Generate and download the zip file
        const content = await zip.generateAsync({type: "blob"});
        const safeTeamA = (state.match.teamA||'TeamA').replace(/[^a-z0-9]/gi,'_');
        const safeTeamB = (state.match.teamB||'TeamB').replace(/[^a-z0-9]/gi,'_');
        const safeMatchId = (state.match.id||'Match').replace(/[^a-z0-9]/gi,'_');
        const fileName = `${safeMatchId}_${safeTeamA}_vs_${safeTeamB}_Analysis.zip`;
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        showGreenTick('Analysis downloaded successfully');
    } catch (error) {
        console.error('Error creating analysis download:', error);
        alert('Error creating analysis download. Please try again.');
    }
}

function createUpdatedPlayersCSV() {
    // Create headers
    const headers = ["player_id", "player_name", "team_identifier", "manual_id", "jersey_id", "video_360_filename", "thumbnail_filename"];
    
    // Create rows for each player
    const rows = Array.from(playerDetailsMap.entries()).map(([uniqueId, details]) => {
        return [
            uniqueId, // original player ID
            details.playerName || 'N/A',
            details.team === 'teamA' ? 'team1' : 'team2',
            details.manualId || 'N/A',
            details.jerseyId || 'N/A',
            details.video_360_filename || '',
            details.video_360_thumbnail_src ? `${uniqueId}_thumbnail.jpg` : '' // Add thumbnail filename
        ];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);

    if (event.key.toUpperCase() === 'H' && !isInputFocused) {
        event.preventDefault();
        startStopHighlights();
        return;
    }

    if (isInputFocused) {
        return;
    }

    let actionHotkeyPressed = false;
    if (state.selectedPlayerId) {
        for (const [buttonId, config] of actionButtonHotkeys.entries()) {
            const keyMatch = event.key.toUpperCase() === config.key.toUpperCase();
            const shiftStateMatch = config.shiftKey === event.shiftKey;

            if (keyMatch && shiftStateMatch) {
                const button = document.getElementById(buttonId);
                if (button && !button.disabled) {
                    event.preventDefault();
                    logActionFromButton(buttonId);
                    actionHotkeyPressed = true;
                    break;
                }
            }
        }
    }

    if (actionHotkeyPressed) {
        return;
    }

    const videoElement = matchVideoPlayer.querySelector('video');
    if (videoElement) {
        let preventDefaultForVideo = true;
        switch (event.key.toUpperCase()) {
            case ' ': case 'K':
                if (videoElement.paused) videoElement.play();
                else videoElement.pause();
                break;
            case 'ARROWLEFT':
                videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
                break;
            case 'ARROWRIGHT':
                videoElement.currentTime = videoElement.currentTime + 5;
                break;
            case 'ARROWUP':
                videoElement.volume = Math.min(1, videoElement.volume + 0.1);
                break;
            case 'ARROWDOWN':
                videoElement.volume = Math.max(0, videoElement.volume - 0.1);
                break;
            case 'M':
                videoElement.muted = !videoElement.muted;
                break;
            case 'J':
                const miscontrolConfig = actionButtonHotkeys.get('miscontrolBtn');
                if (miscontrolConfig && event.key.toUpperCase() === miscontrolConfig.key.toUpperCase() && state.selectedPlayerId && document.getElementById('miscontrolBtn') && !document.getElementById('miscontrolBtn').disabled) {
                    preventDefaultForVideo = false;
                } else {
                    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
                }
                break;
            case 'L':
                const longPassConfig = actionButtonHotkeys.get('longPassBtn');
                if (longPassConfig && event.key.toUpperCase() === longPassConfig.key.toUpperCase() && state.selectedPlayerId && document.getElementById('longPassBtn') && !document.getElementById('longPassBtn').disabled) {
                    preventDefaultForVideo = false;
                } else {
                    videoElement.currentTime = videoElement.currentTime + 10;
                }
                break;
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                let isActionNumberHotkey = false;
                for(const [btnId, cfg] of actionButtonHotkeys.entries()){
                    if(cfg.key === event.key && !cfg.shiftKey && state.selectedPlayerId && document.getElementById(btnId) && !document.getElementById(btnId).disabled){
                        isActionNumberHotkey = true;
                        break;
                    }
                }
                if(!isActionNumberHotkey && videoElement.duration) {
                    const percentage = parseInt(event.key);
                    videoElement.currentTime = videoElement.duration * (percentage / 10);
                } else {
                    preventDefaultForVideo = false;
                }
                break;
            default:
                preventDefaultForVideo = false;
                break;
        }
        if (preventDefaultForVideo) event.preventDefault();
    }
});

