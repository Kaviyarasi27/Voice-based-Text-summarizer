// ============================================================
// Voice-Based Text Summarizer
// NLP + Speech Recognition + Text-to-Speech
// ============================================================

// -------------------------
// DOM Elements
// -------------------------

const languageSelect = document.getElementById("language");
const summaryLengthSelect = document.getElementById("summaryLength");

const input = document.getElementById("input");
const inputCounter = document.getElementById("inputCounter");

const speakBtn = document.getElementById("speakBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const readBtn = document.getElementById("readBtn");

const status = document.getElementById("status");
const output = document.getElementById("output");

const originalWords = document.getElementById("originalWords");
const summaryWords = document.getElementById("summaryWords");
const reduction = document.getElementById("reduction");


// ============================================================
// Stop Words
// ============================================================

const stopWords = {
    "en-US": new Set([
        "a", "an", "the", "and", "or", "but", "if", "then",
        "is", "are", "was", "were", "be", "been", "being",
        "to", "of", "in", "on", "at", "for", "from", "with",
        "by", "about", "as", "into", "through", "during",
        "before", "after", "above", "below", "between",
        "this", "that", "these", "those", "it", "its",
        "he", "she", "they", "them", "his", "her", "their",
        "we", "you", "your", "our", "i", "me", "my",
        "was", "were", "has", "have", "had", "do", "does",
        "did", "will", "would", "can", "could", "should",
        "may", "might", "must", "not"
    ]),

    "ta-IN": new Set([
        "ஒரு", "இந்த", "அந்த", "இது", "அது", "மற்றும்",
        "ஆனால்", "என்று", "என", "உள்ள", "உள்ளது",
        "இருந்து", "மூலம்", "மேலும்", "அவர்", "அவர்கள்",
        "அது", "இவை", "அவை"
    ]),

    "hi-IN": new Set([
        "एक", "और", "या", "लेकिन", "यह", "वह", "इस",
        "उस", "के", "की", "का", "को", "से", "में", "पर",
        "और", "है", "हैं", "था", "थे", "थी", "हो",
        "के लिए", "द्वारा", "उन", "वे", "हम", "आप"
    ])
};


// ============================================================
// Utility Functions
// ============================================================

function countWords(text) {
    if (!text.trim()) return 0;

    const words = text.trim().match(/[\p{L}\p{N}]+/gu);

    return words ? words.length : 0;
}


function updateInputCounter() {
    const count = countWords(input.value);

    inputCounter.textContent = `${count} words`;
    originalWords.textContent = count;

    if (count === 0) {
        summaryWords.textContent = "0";
        reduction.textContent = "0%";
    }
}


function updateStatus(message, type = "") {
    status.textContent = message;

    status.className = "status";

    if (type) {
        status.classList.add(type);
    }
}


// ============================================================
// Sentence Processing
// ============================================================

function splitSentences(text) {
    return text
        .replace(/\s+/g, " ")
        .trim()
        .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)
        ?.map(sentence => sentence.trim())
        .filter(sentence => countWords(sentence) >= 3) || [];
}


function tokenize(text) {
    return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}


// ============================================================
// Extractive Summarization
// ============================================================

function extractiveSummarize(text, maxSentences = 3, language = "en-US") {

    const sentences = splitSentences(text);

    if (sentences.length === 0) {
        return "";
    }

    if (sentences.length <= maxSentences) {
        return sentences.join(" ");
    }

    const words = tokenize(text);

    const ignoredWords = stopWords[language] || stopWords["en-US"];

    // -----------------------------------------
    // Calculate word frequency
    // -----------------------------------------

    const frequency = {};

    words.forEach(word => {

        if (
            word.length > 2 &&
            !ignoredWords.has(word)
        ) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });


    // -----------------------------------------
    // Normalize frequency
    // -----------------------------------------

    const maxFrequency = Math.max(
        ...Object.values(frequency),
        1
    );

    Object.keys(frequency).forEach(word => {
        frequency[word] =
            frequency[word] / maxFrequency;
    });


    // -----------------------------------------
    // Score each sentence
    // -----------------------------------------

    const scoredSentences = sentences.map((sentence, index) => {

        const sentenceWords = tokenize(sentence);

        let score = 0;

        sentenceWords.forEach(word => {

            if (frequency[word]) {
                score += frequency[word];
            }

        });


        // Give slightly higher importance
        // to earlier sentences.

        const positionBonus =
            (sentences.length - index) /
            sentences.length *
            0.2;

        score += positionBonus;


        // Avoid extremely short sentences
        // dominating the summary.

        const wordCount = sentenceWords.length;

        if (wordCount >= 8) {
            score += 0.1;
        }


        return {
            sentence,
            index,
            score
        };

    });


    // -----------------------------------------
    // Select highest scoring sentences
    // -----------------------------------------

    const selected = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences);


    // -----------------------------------------
    // Restore original document order
    // -----------------------------------------

    selected.sort((a, b) => a.index - b.index);


    return selected
        .map(item => item.sentence)
        .join(" ");
}


// ============================================================
// Summary Statistics
// ============================================================

function updateSummaryStats(originalText, summaryText) {

    const originalCount = countWords(originalText);
    const summaryCount = countWords(summaryText);

    originalWords.textContent = originalCount;
    summaryWords.textContent = summaryCount;

    if (originalCount === 0) {
        reduction.textContent = "0%";
        return;
    }

    const reductionPercentage =
        Math.max(
            0,
            Math.round(
                ((originalCount - summaryCount) /
                    originalCount) * 100
            )
        );

    reduction.textContent =
        `${reductionPercentage}%`;
}


// ============================================================
// Summarize Button
// ============================================================

summarizeBtn.addEventListener("click", () => {

    const text = input.value.trim();

    if (!text) {

        output.textContent =
            "Please enter or speak some text first.";

        updateStatus(
            "Nothing to summarize.",
            "error"
        );

        return;
    }


    const selectedLength =
        parseInt(summaryLengthSelect.value, 10);

    const language =
        languageSelect.value;


    updateStatus(
        "Generating summary...",
        "processing"
    );


    // Small delay gives the interface
    // time to display processing state.

    setTimeout(() => {

        const summary =
            extractiveSummarize(
                text,
                selectedLength,
                language
            );


        if (!summary) {

            output.textContent =
                "Unable to generate a summary.";

            updateStatus(
                "Could not process the text.",
                "error"
            );

            return;
        }


        output.textContent =
            summary;


        updateSummaryStats(
            text,
            summary
        );


        readBtn.disabled = false;


        updateStatus(
            "Summary generated successfully.",
            "success"
        );

    }, 150);

});


// ============================================================
// Clear Button
// ============================================================

clearBtn.addEventListener("click", () => {

    input.value = "";

    output.textContent =
        "Your summary will appear here.";

    readBtn.disabled = true;

    originalWords.textContent = "0";
    summaryWords.textContent = "0";
    reduction.textContent = "0%";

    inputCounter.textContent =
        "0 words";

    updateStatus(
        "Ready for your next text."
    );

});


// ============================================================
// Input Counter
// ============================================================

input.addEventListener("input", updateInputCounter);


// ============================================================
// Speech Recognition
// ============================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;


if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageSelect.value;


    // -----------------------------------------
    // Voice Recognition Started
    // -----------------------------------------

    recognition.onstart = () => {

        isListening = true;

        speakBtn.textContent =
            "⏹ Stop Listening";

        updateStatus(
            "Listening... speak clearly.",
            "listening"
        );
    };


    // -----------------------------------------
    // Voice Result
    // -----------------------------------------

    recognition.onresult = event => {

        const transcript =
            event.results[0][0].transcript.trim();


        if (!transcript) return;


        if (input.value.trim()) {

            input.value +=
                " " + transcript;

        } else {

            input.value =
                transcript;

        }


        updateInputCounter();


        updateStatus(
            "Voice input received.",
            "success"
        );
    };


    // -----------------------------------------
    // Recognition Error
    // -----------------------------------------

    recognition.onerror = event => {

        let message =
            "Voice recognition error.";

        switch (event.error) {

            case "not-allowed":
                message =
                    "Microphone permission was denied.";
                break;

            case "no-speech":
                message =
                    "No speech detected. Try again.";
                break;

            case "audio-capture":
                message =
                    "No microphone was detected.";
                break;

            case "network":
                message =
                    "Speech recognition requires network access in this browser.";
                break;

            default:
                message =
                    `Voice error: ${event.error}`;
        }


        updateStatus(
            message,
            "error"
        );
    };


    // -----------------------------------------
    // Recognition Ended
    // -----------------------------------------

    recognition.onend = () => {

        isListening = false;

        speakBtn.textContent =
            "🎙 Start Speaking";
    };


    // -----------------------------------------
    // Start / Stop Listening
    // -----------------------------------------

    speakBtn.addEventListener("click", () => {

        if (isListening) {

            recognition.stop();

            return;
        }


        recognition.lang =
            languageSelect.value;


        try {

            recognition.start();

        } catch (error) {

            updateStatus(
                "Unable to start voice recognition. Try again.",
                "error"
            );

        }

    });

} else {

    speakBtn.disabled = true;

    speakBtn.textContent =
        "❌ Voice Not Supported";

    updateStatus(
        "Speech recognition is not supported in this browser.",
        "error"
    );
}


// ============================================================
// Language Change
// ============================================================

languageSelect.addEventListener("change", () => {

    if (recognition) {

        recognition.lang =
            languageSelect.value;
    }

    updateStatus(
        `Language changed to ${languageSelect.options[languageSelect.selectedIndex].text}.`
    );
});


// ============================================================
// Read Summary — Text to Speech
// ============================================================

readBtn.addEventListener("click", () => {

    const summary =
        output.textContent.trim();


    if (!summary ||
        summary === "Your summary will appear here.") {

        return;
    }


    if (!("speechSynthesis" in window)) {

        updateStatus(
            "Text-to-speech is not supported in this browser.",
            "error"
        );

        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(summary);


    utterance.lang =
        languageSelect.value;

    utterance.rate = 0.95;
    utterance.pitch = 1;


    utterance.onstart = () => {

        updateStatus(
            "Reading summary...",
            "processing"
        );
    };


    utterance.onend = () => {

        updateStatus(
            "Finished reading the summary.",
            "success"
        );
    };


    utterance.onerror = () => {

        updateStatus(
            "Unable to read the summary.",
            "error"
        );
    };


    speechSynthesis.speak(utterance);

});
