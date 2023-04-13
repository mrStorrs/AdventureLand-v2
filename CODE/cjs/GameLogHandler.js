function overrideGameLog(){
    var old_log = parent.add_log;
    //todo improvements:
    // + make this so it colates all the messages
    //to be sent in a block every 60 seconds instead of having a million
    //timers. Items found would need to be an array all else is easy. 
    //todo make this account for item upgrades and compounds including item name (this)
    //may need to be done in the right files. we could set the item name/level in that file
    //then pass it to this one use local storage. 
    parent.add_log = function (message, color) {
        var addLog = true;
        var colorFound = true;
    
        // if (color != "gray"
        //         && color != "gold") {
        // }
        if (color == "gold") {
            if (message.includes("gold")) {
                gold = parseInt(message.split(" ")[0]);
                character.goldCount += gold;
                recentDate = new Date() / 1000;
                if (recentDate - character.lastGoldDate > 60) {
                    game_log("character=" + character.name + " goldCount=" + character.goldCount)
                    character.lastGoldDate = new Date() / 1000;
                    character.goldCount = 0;
                }
                addLog = false;
            } else {
                message = "\x1b[33m " + message + "\x1b[0m";
            }
        } else if (color == "red") {
            message = "\x1b[31m " + message + "\x1b[0m";
        } else if (color == "gray") {
            if (message.includes("killed")) {
                messageArray = message.split(" ")
                characterName = messageArray[0]
                if (character.name == characterName || characterName == "You") {
                    character.killCount++;
                    recentDate = new Date() / 1000;
    
                    if (recentDate - character.lastKillDate > 60) {
                        game_log("character=" + character.name + " killcount=" + character.killCount + " mob=" + messageArray[messageArray.length - 1])
                        character.lastKillDate = new Date() / 1000;
                        character.killCount = 0;
                    }
                }
                addLog = false;
            }
            message = "\x1b[90m " + message + "\x1b[0m";
        } else if (color == "white") {
            message = "\x1b[97m " + message + "\x1b[0m";
        } else if (color == "green") {
            message = "\x1b[32m " + message + "\x1b[0m";
        } else if (color == "#6DCC9E") {
            message = "\x1b[32m " + message + "\x1b[0m";
        } else if (color == "#4BAEAA") {
            if (message.includes("ound a")) {
                messageArray = message.split(" ");
                characterName = messageArray[0]
                if (characterName == "Found") {
                    itemFound = messageArray.slice(2).join("")
                } else {
                    itemFound = messageArray.slice(3).join("")
                }
                //todo: change this huge logic chain into a function that retains a boolean
                if (characterName == character.name || characterName == "You" || characterName == "Found") {
                    game_log("character=" + character.name + " itemFound=" + itemFound)
                }
                addLog = false;
            }
            message = "\x1b[36m " + message + "\x1b[0m";
        } else if (color == "#51D2E1") {
            if (message.includes("Received a code message from:")) {
                addLog = false;
            }
            message = "\x1b[96m " + message + "\x1b[0m";
        } else if (message.includes("Not logged")) {
            addLog = false;
        } else {
            old_log.apply(old_log, arguments);
        }
    
        if (addLog) {
            // old_log.apply(old_log, [message, ""]);
            old_log.apply(old_log, arguments);
        }
    
    }

}