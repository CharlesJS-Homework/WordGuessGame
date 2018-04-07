const initialGuessCount = 12;
const namePlaceholder = "Guess the Composer!";

let composers = [];
let notChosenYet = [];
let currentComposer;

let wins = 0;
let losses = 0;

let running = false;
let guesses = initialGuessCount;

let correctLetters = [];
let incorrectLetters = [];

let audioElement;

function Composer(data) {
    $.extend(this, data);
}

Composer.prototype.imgSrc = function() {
    return "assets/img/" + this.portrait;
}

Composer.prototype.lastName = function() {
    let names = this.name.split(" ");
    return names.pop();
}

$(document).ready(function() {
    $.ajax({
        url: "assets/json/composers.json", 
        beforeSend: function(xhr) {
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("application/json");
            }
        },
        dataType: "json",
        success: function (response) {
            $.each(response.composers, function(i, composerData) {
                composers.push(new Composer(composerData));
            });
            
            notChosenYet = composers.slice();
            restartGame();
        }
    });
});

$(document).on("keydown", function(event) {
    if (isHandled(event)) {
        event.preventDefault();
    }
});

$(document).on("keyup", function(event) {
    const key = event.key.toLowerCase();
    
    if (!isHandled(event)) {
        return;
    }
        
    if (!running) {
        restartGame();
        return;
    }
        
    if (correctLetters.includes(key) || incorrectLetters.includes(key)) {
        return;
    }
    
    const name = currentComposer.lastName();
    let found = false;
    
    for (let i = 0; i < name.length; i++) {
        const char = name.charAt(i).normalize("NFD")[0].toLowerCase();
        
        if (char === key) {
            found = true;
            break;
        }
    }
    
    if (found) {
        correctLetters.push(key);
        if (refreshGuessField()) {
            win();
        }
    } else {
        addIncorrectLetter(key);
        setGuessCount(guesses - 1);
        
        if (guesses === 0) {
            lose();
        }
    }
});

function isHandled(event) {
    const key = event.key;
    
    return (
        key.length == 1 &&
        key.charCodeAt(0) >= "a".charCodeAt(0) &&
        key.charCodeAt(0) <= "z".charCodeAt(0) &&
        !event.ctrlKey && !event.altKey && !event.metaKey
    )
}

function win() {
    $("#wins").text(++wins);
    
    finish();
}

function lose() {
    $("#losses").text(++losses);
    
    finish();
}

function finish() {
    running = false;
    
    $("#composer_name").text(currentComposer.name);
    $("#composer_img").attr("src", currentComposer.imgSrc());
    $("#composer_img").attr("alt", currentComposer.name);
    $("#music_title").text(currentComposer.music.title);
    $("#music_performers").text(currentComposer.music.performers);
    
    const license = currentComposer.music.license;
    
    if (license !== undefined) {
        const licenseName = currentComposer.music.license.name;
        const licenseURL = currentComposer.music.license.url;
        
        if (licenseURL !== undefined) {
            $("#music_license").text("License: ");
            
            const licenseLink = $("<a>");
            
            licenseLink.text(currentComposer.music.license.name);
            licenseLink.attr("href", currentComposer.music.license.url);
            $("#music_license").append(licenseLink);
        } else if (licenseName !== undefined) {
            $("#music_license").text("License: " + licenseName);
        }
    }
    
    audioElement = $("<audio>");
    audioElement.attr("src", currentComposer.music.url);
    audioElement.trigger("play");
}

function restartGame() {
    if (audioElement !== undefined) {
        audioElement.trigger("pause");
    }
    
    if (notChosenYet.length === 0) {
        notChosenYet = composers.slice();
    }
    
    let index = Math.floor(Math.random() * notChosenYet.length);
    currentComposer = notChosenYet[index];
    notChosenYet.splice(index, 1);
    
    correctLetters = [];
    incorrectLetters = [];

    running = true;
    $("#guessed_letters").html("&nbsp;");
    setGuessCount(initialGuessCount);
    refreshGuessField();

    $("#composer_name").text(namePlaceholder);
    $("#composer_img").attr("src", "assets/img/unknown.svg");
    $("#composer_img").attr("alt", "Unknown Composer");
    $("#music_title").text("");
    $("#music_performers").text("");
    $("#music_license").text("");
}

function addIncorrectLetter(letter) {
    incorrectLetters.push(letter);
    
    $("#guessed_letters").text(incorrectLetters.map(c => c.toUpperCase()).join(", "));
}

function setGuessCount(count) {
    guesses = count;
    $("#guesses_left").text(guesses);
}

// returns 'true' if the word is completely guessed
function refreshGuessField() {
    const name = currentComposer.lastName();
    
    let guess = "";
    let complete = true;
    
    for (let i = 0; i < name.length; i++) {
        const char = name.charAt(i);
        const simplified = char.normalize('NFD')[0].toLowerCase();
        
        if (correctLetters.includes(simplified)) {
            guess += char;
        } else {
            guess += "_";
            complete = false;
        }
    }
    
    $("#guess_field").text(guess);
    
    return complete;
}
