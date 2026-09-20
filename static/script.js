// ============================================================
// NETWORK PROTOCOL VISUALIZER
// script.js
// ============================================================


// ============================================================
// GLOBAL STATE
// ============================================================

let protocolEvents = [];
let visibleEvents = [];

let currentStep = 0;

let isPlaying = false;
let isLoading = false;

let playbackTimer = null;

let currentFilter = "ALL";
let selectedQuality = "720p";
let currentActivity = "browsing";


// ============================================================
// DOM ELEMENTS
// ============================================================

// Activity tabs
const tabButtons = document.querySelectorAll(".activity-tab");
const activitySections = document.querySelectorAll(".activity-form");

// Browsing
const urlInput = document.getElementById("websiteUrl");
const visitButton = document.getElementById("visitButton");

// Mail
const mailTo = document.getElementById("mailTo");
const mailSubject = document.getElementById("mailSubject");
const mailBody = document.getElementById("mailBody");
const sendMailButton = document.getElementById("sendMailButton");

// Streaming
const qualityButtons = document.querySelectorAll(".quality-button");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");

// Activity log
const activityLog = document.getElementById("activityLog");

// Protocol flow
const protocolFlow = document.getElementById("protocolFlow");
const protocolEmpty = document.getElementById("protocolEmpty");

// Protocol filters
const filterButtons = document.querySelectorAll(".protocol-filter");

// Playback controls
const previousButton = document.getElementById("previousButton");
const playbackButton = document.getElementById("playbackButton");
const nextButton = document.getElementById("nextButton");
const replayButton = document.getElementById("replayButton");

// Status
const simulationStatus = document.getElementById("statusText");
const stepCounter = document.getElementById("stepCounter");


// ============================================================
// INITIAL SETUP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    setupActivityTabs();
    setupQualityButtons();
    setupProtocolFilters();
    setupActivityButtons();
    setupPlaybackControls();
    setupKeyboardControls();

    updateStatus("Ready");
    updateStepCounter();

    addActivityLog(
        "System ready. Select an activity to begin.",
        "system"
    );

    updatePlaybackButtons();
});


// ============================================================
// ACTIVITY TABS
// ============================================================

function setupActivityTabs() {

    tabButtons.forEach(button => {

        button.addEventListener("click", () => {

            const activity = button.dataset.activity;

            if (!activity) {
                return;
            }

            currentActivity = activity;

            tabButtons.forEach(tab => {
                tab.classList.remove("active");
            });

            button.classList.add("active");

            activitySections.forEach(section => {

                section.classList.remove("active");

                if (section.id === `${activity}Form`) {
                    section.classList.add("active");
                }
            });

            resetVisualization();

            updateStatus("Ready");

            addActivityLog(
                `${capitalize(activity)} activity selected.`,
                "info"
            );
        });
    });
}


// ============================================================
// QUALITY BUTTONS
// ============================================================

function setupQualityButtons() {

    qualityButtons.forEach(button => {

        button.addEventListener("click", () => {

            selectedQuality =
                button.dataset.quality || "720p";

            qualityButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            addActivityLog(
                `Streaming quality selected: ${selectedQuality}`,
                "info"
            );
        });
    });
}


// ============================================================
// PROTOCOL FILTERS
// ============================================================

function setupProtocolFilters() {

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            currentFilter =
                button.dataset.filter
                    ? button.dataset.filter.toUpperCase()
                    : "ALL";

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            applyProtocolFilter();
        });
    });
}


// ============================================================
// ACTIVITY BUTTONS
// ============================================================

function setupActivityButtons() {

    // --------------------------------------------------------
    // BROWSING
    // --------------------------------------------------------

    if (visitButton) {

        visitButton.addEventListener("click", async () => {

            const url = urlInput.value.trim();

            if (!url) {

                addActivityLog(
                    "Please enter a website URL.",
                    "error"
                );

                urlInput.focus();

                return;
            }

            await startSimulation(
                "browsing",
                {
                    url: url
                },
                `Visiting ${url}`
            );
        });
    }


    // --------------------------------------------------------
    // MAIL
    // --------------------------------------------------------

    if (sendMailButton) {

        sendMailButton.addEventListener("click", async () => {

            const to = mailTo.value.trim();
            const subject = mailSubject.value.trim();
            const body = mailBody.value.trim();

            if (!to) {

                addActivityLog(
                    "Please enter a recipient email address.",
                    "error"
                );

                mailTo.focus();

                return;
            }

            await startSimulation(
                "mail",
                {
                    to: to,
                    subject: subject,
                    body: body
                },
                `Sending email to ${to}`
            );
        });
    }


    // --------------------------------------------------------
    // STREAMING
    // --------------------------------------------------------

    if (playButton) {

        playButton.addEventListener("click", async () => {

            if (
                protocolEvents.length === 0 ||
                currentActivity !== "streaming"
            ) {

                await startSimulation(
                    "streaming",
                    {
                        quality: selectedQuality
                    },
                    `Starting ${selectedQuality} streaming`
                );

                return;
            }

            if (!isPlaying) {
                playProtocol();
            }
        });
    }


    // --------------------------------------------------------
    // PAUSE
    // --------------------------------------------------------

    if (pauseButton) {

        pauseButton.addEventListener("click", () => {

            if (isPlaying) {
                pauseProtocol();
            } else {
                playProtocol();
            }
        });
    }
}


// ============================================================
// START SIMULATION
// ============================================================

async function startSimulation(type, data, logMessage) {

    if (isLoading) {
        return;
    }

    isLoading = true;

    stopPlayback();

    resetVisualization(false);

    updateStatus("Connecting...");

    addActivityLog(logMessage, "activity");

    setActivityButtonsDisabled(true);

    try {

        const response = await fetch("/api/simulate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                type: type,
                ...data
            })
        });


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Simulation failed."
            );
        }


        if (!result.events || !Array.isArray(result.events)) {

            throw new Error(
                "Server returned an invalid event list."
            );
        }


        // ----------------------------------------------------
        // STORE EVENTS
        // ----------------------------------------------------

        protocolEvents =
            result.events.map((event, index) => {

                return normalizeEvent(event, index);

            });


        // ----------------------------------------------------
        // RESET PLAYBACK
        // ----------------------------------------------------

        currentStep = 0;

        currentFilter = "ALL";

        filterButtons.forEach(button => {

            const filter =
                button.dataset.filter
                    ? button.dataset.filter.toUpperCase()
                    : "ALL";

            button.classList.toggle(
                "active",
                filter === "ALL"
            );
        });


        updateStatus("Simulation Ready");

        updateStepCounter();

        renderProtocolFlow();


        addActivityLog(
            `${protocolEvents.length} protocol messages loaded.`,
            "success"
        );


        // ----------------------------------------------------
        // AUTOMATIC PLAYBACK
        // ----------------------------------------------------

        setTimeout(() => {

            isLoading = false;

            setActivityButtonsDisabled(false);

            playProtocol();

        }, 350);


    } catch (error) {

        console.error("Simulation error:", error);

        isLoading = false;

        setActivityButtonsDisabled(false);

        updateStatus("Error");

        addActivityLog(
            error.message ||
            "Unable to start simulation.",
            "error"
        );

        createEmptyState(
            "Unable to load the protocol simulation."
        );
    }
}


// ============================================================
// NORMALIZE EVENT
// ============================================================

function normalizeEvent(event, index) {

    return {

        index: index,

        protocol:
            event.protocol ||
            event.type ||
            "HTTP",

        direction:
            event.direction ||
            "client-to-server",

        title:
            event.title ||
            event.name ||
            `Protocol Message ${index + 1}`,

        message:
            event.message ||
            event.content ||
            "",

        fields:
            Array.isArray(event.fields)
                ? event.fields
                : []
    };
}


// ============================================================
// RESET VISUALIZATION
// ============================================================

function resetVisualization(clearEvents = true) {

    stopPlayback();

    currentStep = 0;

    if (clearEvents) {

        protocolEvents = [];
        visibleEvents = [];
    }

    if (protocolFlow) {

        protocolFlow.innerHTML = "";

        if (protocolEmpty) {

            const emptyState =
                protocolEmpty.cloneNode(true);

            emptyState.style.display = "";

            protocolFlow.appendChild(emptyState);

        } else {

            createEmptyState(
                "Choose an activity to start the simulation."
            );
        }
    }

    updateStepCounter();
    updatePlaybackButtons();
}


// ============================================================
// EMPTY STATE
// ============================================================

function createEmptyState(message) {

    if (!protocolFlow) {
        return;
    }

    protocolFlow.innerHTML = "";

    const empty =
        document.createElement("div");

    empty.className = "protocol-empty";

    empty.innerHTML = `
        <div class="protocol-empty-icon">⇄</div>

        <h3>Ready to explore?</h3>

        <p>
            ${escapeHTML(message)}
        </p>
    `;

    protocolFlow.appendChild(empty);
}


// ============================================================
// RENDER PROTOCOL FLOW
// ============================================================

function renderProtocolFlow() {

    if (!protocolFlow) {
        return;
    }

    protocolFlow.innerHTML = "";

    visibleEvents = getFilteredEvents();


    if (visibleEvents.length === 0) {

        createEmptyState(
            "No protocol messages available."
        );

        return;
    }


    const eventsToShow =
        visibleEvents.slice(
            0,
            Math.min(
                currentStep,
                visibleEvents.length
            )
        );


    if (eventsToShow.length === 0) {

        createEmptyState(
            "Press Play to begin the protocol exchange."
        );

        updateStepCounter();
        updatePlaybackButtons();

        return;
    }


    eventsToShow.forEach((event, index) => {

        const card =
            createProtocolCard(
                event,
                index
            );

        protocolFlow.appendChild(card);
    });


    updateStepCounter();
    updatePlaybackButtons();
}


// ============================================================
// GET FILTERED EVENTS
// ============================================================

function getFilteredEvents() {

    if (currentFilter === "ALL") {

        return [...protocolEvents];
    }

    return protocolEvents.filter(event => {

        return String(event.protocol)
            .toUpperCase() === currentFilter;

    });
}


// ============================================================
// APPLY FILTER
// ============================================================

function applyProtocolFilter() {

    const previousStep = currentStep;

    visibleEvents = getFilteredEvents();

    currentStep = Math.min(
        previousStep,
        visibleEvents.length
    );

    renderProtocolFlow();

    updateStepCounter();
    updatePlaybackButtons();
}


// ============================================================
// CREATE PROTOCOL CARD
// ============================================================

function createProtocolCard(event, displayIndex) {

    const card =
        document.createElement("div");

    const direction =
        String(event.direction).toLowerCase();


    const isClientToServer =
        direction === "client-to-server" ||
        direction === "client → server" ||
        direction === "client";


    const directionClass =
        isClientToServer
            ? "client-to-server"
            : "server-to-client";


    card.className =
        `protocol-event ${directionClass}`;


    const protocol =
        String(event.protocol).toUpperCase();


    const fieldHTML =
        event.fields
            .map(field => {

                if (!Array.isArray(field)) {
                    return "";
                }

                const key =
                    escapeHTML(field[0] ?? "");

                const value =
                    escapeHTML(field[1] ?? "");

                return `
                    <div class="protocol-field">

                        <span>${key}</span>

                        <strong>${value}</strong>

                    </div>
                `;
            })
            .join("");


    const arrow =
        isClientToServer
            ? "→"
            : "←";


    card.innerHTML = `

        <div class="protocol-event-header">

            <div class="protocol-event-title">

                <span class="protocol-badge">
                    ${escapeHTML(protocol)}
                </span>

                <span>
                    ${escapeHTML(event.title)}
                </span>

            </div>

            <span class="protocol-step">
                STEP ${displayIndex + 1}
            </span>

        </div>


        <div class="protocol-direction">

            <span class="direction-label">

                ${
                    isClientToServer
                        ? "CLIENT → SERVER"
                        : "SERVER → CLIENT"
                }

            </span>

            <span class="direction-arrow">
                ${arrow}
            </span>

        </div>


        <div class="protocol-message">

            ${escapeHTML(event.message)}

        </div>


        ${
            fieldHTML
                ? `
                    <div class="protocol-fields">
                        ${fieldHTML}
                    </div>
                  `
                : ""
        }

    `;


    return card;
}


// ============================================================
// PLAY PROTOCOL
// ============================================================

function playProtocol() {

    if (isLoading) {
        return;
    }

    if (protocolEvents.length === 0) {

        if (currentActivity === "streaming") {

            startSimulation(
                "streaming",
                {
                    quality: selectedQuality
                },
                `Starting ${selectedQuality} streaming`
            );
        }

        return;
    }


    if (isPlaying) {
        return;
    }


    visibleEvents = getFilteredEvents();


    if (visibleEvents.length === 0) {
        return;
    }


    if (currentStep >= visibleEvents.length) {

        currentStep = 0;

        renderProtocolFlow();
    }


    isPlaying = true;

    updateStatus("Playing");

    updatePlaybackButtons();


    revealNextEvent();
}


// ============================================================
// REVEAL NEXT EVENT
// ============================================================

function revealNextEvent() {

    if (!isPlaying) {
        return;
    }


    visibleEvents = getFilteredEvents();


    if (currentStep >= visibleEvents.length) {

        finishPlayback();

        return;
    }


    currentStep++;

    renderProtocolFlow();


    const cards =
        protocolFlow.querySelectorAll(
            ".protocol-event"
        );


    const newestCard =
        cards[cards.length - 1];


    if (newestCard) {

        newestCard.classList.add("just-arrived");

        setTimeout(() => {

            scrollToCard(newestCard);

        }, 60);
    }


    updateStepCounter();


    const currentEvent =
        visibleEvents[currentStep - 1];


    let delay = 1300;


    if (currentEvent) {

        const protocol =
            String(
                currentEvent.protocol
            ).toUpperCase();


        if (protocol === "DNS") {

            delay = 1500;

        } else if (protocol === "SMTP") {

            delay = 1250;

        } else if (protocol === "HTTP") {

            delay = 1300;
        }
    }


    playbackTimer =
        setTimeout(
            revealNextEvent,
            delay
        );
}


// ============================================================
// FINISH PLAYBACK
// ============================================================

function finishPlayback() {

    stopPlayback();

    updateStatus("Completed");

    addActivityLog(
        "Protocol exchange completed.",
        "success"
    );

    updatePlaybackButtons();
}


// ============================================================
// PAUSE
// ============================================================

function pauseProtocol() {

    if (!isPlaying) {
        return;
    }

    isPlaying = false;

    clearTimeout(playbackTimer);

    playbackTimer = null;

    updateStatus("Paused");

    updatePlaybackButtons();
}


// ============================================================
// STOP PLAYBACK
// ============================================================

function stopPlayback() {

    isPlaying = false;

    clearTimeout(playbackTimer);

    playbackTimer = null;

    updatePlaybackButtons();
}


// ============================================================
// NEXT STEP
// ============================================================

function nextStep() {

    if (isLoading) {
        return;
    }

    stopPlayback();

    visibleEvents = getFilteredEvents();


    if (currentStep >= visibleEvents.length) {
        return;
    }


    currentStep++;

    renderProtocolFlow();


    const cards =
        protocolFlow.querySelectorAll(
            ".protocol-event"
        );


    const newestCard =
        cards[cards.length - 1];


    if (newestCard) {

        newestCard.classList.add("just-arrived");

        setTimeout(() => {

            scrollToCard(newestCard);

        }, 50);
    }


    updateStatus(
        currentStep >= visibleEvents.length
            ? "Completed"
            : "Step Forward"
    );

    updateStepCounter();
    updatePlaybackButtons();
}


// ============================================================
// PREVIOUS STEP
// ============================================================

function previousStep() {

    if (isLoading) {
        return;
    }

    stopPlayback();


    if (currentStep <= 0) {
        return;
    }


    currentStep--;

    renderProtocolFlow();


    updateStatus(
        currentStep === 0
            ? "Ready"
            : "Step Back"
    );


    updateStepCounter();
    updatePlaybackButtons();


    const cards =
        protocolFlow.querySelectorAll(
            ".protocol-event"
        );


    const lastCard =
        cards[cards.length - 1];


    if (lastCard) {

        setTimeout(() => {

            scrollToCard(lastCard);

        }, 50);
    }
}


// ============================================================
// REPLAY
// ============================================================

function replayProtocol() {

    if (
        isLoading ||
        protocolEvents.length === 0
    ) {
        return;
    }


    stopPlayback();

    currentStep = 0;

    renderProtocolFlow();

    updateStatus("Replaying");


    setTimeout(() => {

        playProtocol();

    }, 300);
}


// ============================================================
// SCROLL TO CARD
// ============================================================

function scrollToCard(card) {

    if (!protocolFlow || !card) {
        return;
    }


    const targetTop =
        card.offsetTop -
        protocolFlow.offsetTop -
        15;


    protocolFlow.scrollTo({

        top: Math.max(0, targetTop),

        behavior: "smooth"
    });
}


// ============================================================
// PLAYBACK CONTROLS
// ============================================================

function setupPlaybackControls() {

    if (previousButton) {

        previousButton.addEventListener(
            "click",
            previousStep
        );
    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            nextStep
        );
    }


    if (replayButton) {

        replayButton.addEventListener(
            "click",
            replayProtocol
        );
    }


    if (playbackButton) {

        playbackButton.addEventListener(
            "click",
            () => {

                if (isPlaying) {

                    pauseProtocol();

                } else {

                    playProtocol();
                }
            }
        );
    }
}


// ============================================================
// UPDATE PLAYBACK BUTTONS
// ============================================================

function updatePlaybackButtons() {

    visibleEvents = getFilteredEvents();


    if (previousButton) {

        previousButton.disabled =
            currentStep <= 0;
    }


    if (nextButton) {

        nextButton.disabled =
            protocolEvents.length === 0 ||
            currentStep >= visibleEvents.length;
    }


    if (replayButton) {

        replayButton.disabled =
            protocolEvents.length === 0;
    }


    if (playButton) {

        playButton.disabled =
            isLoading;

        playButton.classList.toggle(
            "playing",
            isPlaying
        );
    }


    if (pauseButton) {

        pauseButton.disabled =
            protocolEvents.length === 0;

        pauseButton.classList.toggle(
            "active",
            isPlaying
        );
    }


    if (playbackButton) {

        playbackButton.disabled =
            protocolEvents.length === 0;

        playbackButton.classList.toggle(
            "playing",
            isPlaying
        );
    }
}


// ============================================================
// DISABLE ACTIVITY BUTTONS WHILE LOADING
// ============================================================

function setActivityButtonsDisabled(disabled) {

    if (visitButton) {
        visitButton.disabled = disabled;
    }

    if (sendMailButton) {
        sendMailButton.disabled = disabled;
    }

    if (playButton) {
        playButton.disabled = disabled;
    }
}


// ============================================================
// STEP COUNTER
// ============================================================

function updateStepCounter() {

    if (!stepCounter) {
        return;
    }


    const total =
        getFilteredEvents().length;


    const step =
        Math.min(
            currentStep,
            total
        );


    stepCounter.textContent =
        `Step ${step} / ${total}`;
}


// ============================================================
// STATUS
// ============================================================

function updateStatus(status) {

    if (!simulationStatus) {
        return;
    }


    simulationStatus.textContent =
        status;


    const statusContainer =
        document.getElementById(
            "simulationStatus"
        );


    if (statusContainer) {

        statusContainer.classList.remove(
            "ready",
            "playing",
            "paused",
            "completed",
            "error",
            "loading"
        );


        const normalized =
            status.toLowerCase();


        if (normalized.includes("play")) {

            statusContainer.classList.add(
                "playing"
            );

        } else if (normalized.includes("pause")) {

            statusContainer.classList.add(
                "paused"
            );

        } else if (
            normalized.includes("complete")
        ) {

            statusContainer.classList.add(
                "completed"
            );

        } else if (
            normalized.includes("error")
        ) {

            statusContainer.classList.add(
                "error"
            );

        } else if (
            normalized.includes("connect") ||
            normalized.includes("load")
        ) {

            statusContainer.classList.add(
                "loading"
            );

        } else {

            statusContainer.classList.add(
                "ready"
            );
        }
    }
}


// ============================================================
// ACTIVITY LOG
// ============================================================

function addActivityLog(
    message,
    type = "info"
) {

    if (!activityLog) {
        return;
    }


    const item =
        document.createElement("div");


    item.className =
        `activity-log-item ${type}`;


    const time =
        new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    item.innerHTML = `

        <span class="log-time">
            ${time}
        </span>

        <span class="log-message">
            ${escapeHTML(message)}
        </span>

    `;


    activityLog.appendChild(item);


    activityLog.scrollTop =
        activityLog.scrollHeight;
}


// ============================================================
// KEYBOARD CONTROLS
// ============================================================

function setupKeyboardControls() {

    document.addEventListener(
        "keydown",
        event => {

            const tag =
                document.activeElement
                    ?.tagName
                    ?.toLowerCase();


            if (
                tag === "input" ||
                tag === "textarea"
            ) {
                return;
            }


            // Space = Play / Pause
            if (event.code === "Space") {

                event.preventDefault();

                if (isPlaying) {

                    pauseProtocol();

                } else {

                    playProtocol();
                }
            }


            // Right arrow = Next
            if (event.key === "ArrowRight") {

                event.preventDefault();

                nextStep();
            }


            // Left arrow = Previous
            if (event.key === "ArrowLeft") {

                event.preventDefault();

                previousStep();
            }


            // R = Replay
            if (
                event.key.toLowerCase() === "r"
            ) {

                event.preventDefault();

                replayProtocol();
            }
        }
    );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// CAPITALIZE
// ============================================================

function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase()
        + value.slice(1);
}
