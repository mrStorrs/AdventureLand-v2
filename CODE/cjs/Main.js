/* ----------------------------------------------------------------
 * WORK IN PROGRESS!
 * This will become the main script that all characters run. I am creating this
 * because it will be much easier to run all characters off one single script
 * instead of havig to switch between each character and changing their
 * individual scripts.
 * 
 * When completed:
 *  + Everything will be state dependent(moving, attacking, upgrading, etc..)
 *  + Will have config for all the 4 characters you can run at one time
 *  + This will include options for choosing Main Tank / Pulling
 *  + Will have skill sets depending on what class the character is
 *  + This particular file will not run an interval. The code blocks that the
 *      character loads will be what contains the intervals.
 * --------------------------------------------------------------*/
// parent.caracAL.load_scripts([
//     "cjs/enhance_comm.js",
//     // "cjs/Senditems.js",
// ]).then(x => console.log("loaded script ", globalThis.carac_message));
var player; //used to hold the current characters object information
character.killCount = 0; 
character.goldCount = 0;
character.lastKillDate = new Date() / 1000;
character.lastGoldDate = new Date() / 1000;
var display_gold_idx = 0; 
var messageArray = [];

//smart_move({map:"main", x:1, y:1})

// function game_log_handler(event) {
//     let color;
//     let message = event;
//     if (event && typeof (event) === "object" && "color" in event && "message" in event) {
//         message = event.message;
//         color = event.color;
//     }

//     // If event is about gold income from loot
//     if (color === "gold") {
//         try {
//             mesage = null; 
//             // const gold_received = Number(message.replace(" gold", "").replace(/,/g, ""));
//             // [Code to add to gold log]
//         } catch (e) {
//             console.log("Error porsing number from gold game_log event");
//         }
//     }

//     // If event is about item drops from loot
//     else if (color === "#4BAEAA") {
//         try {
//             // Example message: "Bjarne found an Amulet of HP" / "Bjarne found a Vitality Scroll"

//             let looter;
//             let item;
//             if (character.party) {
//                 let splitted = message.split(" found a ");
//                 if (splitted.length === 1) {
//                     splitted = message.split(" found an ");
//                 }
//                 looter = splitted[0];
//                 item = splitted[1];
//             } else {
//                 let splitted = message.split("Found a ");
//                 if (splitted.length === 1) {
//                     splitted = message.split("Found an ");
//                 }
//                 looter = character.name;
//                 item = splitted[1];
//             }
//             if (!looter || !item) throw "error";

//             // [Code to add to loot log]
//         } catch (e) {
//             console.log("Error detecting loot in game_log event handler")
//         }
//     }
// }

// parent.socket.on("game_log", game_log_handler);

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
    if (color == "gold"){
        if(message.includes("gold")){
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
    } else if (color == "red"){
        message = "\x1b[31m " + message + "\x1b[0m";
    } else if (color == "gray"){
        if (message.includes("killed")) {
            messageArray = message.split(" ")
            characterName = messageArray[0]
            if (character.name == characterName || characterName == "You"){
                character.killCount++;
                recentDate = new Date() / 1000;

                if(recentDate - character.lastKillDate > 60){
                    game_log("character=" + character.name + " killcount=" + character.killCount + " mob=" + messageArray[messageArray.length-1])
                    character.lastKillDate = new Date() / 1000; 
                    character.killCount = 0; 
                }
            }
            addLog = false;
        }
        message = "\x1b[90m " + message + "\x1b[0m";
    } else if (color == "white"){
        message = "\x1b[97m " + message + "\x1b[0m";
    } else if (color == "green") {
        message = "\x1b[32m " + message + "\x1b[0m";
    } else if (color == "#6DCC9E") {
        message = "\x1b[32m " + message + "\x1b[0m";
    } else if (color == "#4BAEAA") {
        if(message.includes("ound a")){
            messageArray = message.split(" ");
            characterName = messageArray[0]
            if (characterName == "Found"){
                itemFound = messageArray.slice(2).join("")
            } else {
                itemFound = messageArray.slice(3).join("")
            }
            //todo: change this huge logic chain into a function that retains a boolean
            if (characterName == character.name || characterName == "You" || characterName == "Found"){
                game_log("character=" + character.name + " itemFound=" + itemFound)
            }
            addLog = false; 
        }
        message = "\x1b[36m " + message + "\x1b[0m";
    } else if (color == "#51D2E1") {
        if (message.includes("Received a code message from:")){
            addLog=false; 
        }
        message = "\x1b[96m " + message + "\x1b[0m";
    } else if (message.includes ("Not logged")) {
        addLog = false; 
    } else {
        old_log.apply(old_log, arguments);
    }

    if(addLog){
        // old_log.apply(old_log, [message, ""]);
        old_log.apply(old_log, arguments);
    }

}

 
//Fighter objects
function Fighter(name) {
    this.name = name;
    //will the character attempt to kite the mob.
    this.is_kiteing = false;
    /* determines what the character will do in a pvp situation. Options:
     *   "aggresive" = will attack others on sight.
     *   "scared"    = will switch server on sight.
     *   "bravish"   = will switch server when attacked. */
    this.pvp = false;
    //scripts to load.
    //this.activities = ["Combat"]
    this.activities = ["Combat", "SendItems"]

    //this will set the fighter to try to grab aggro or pull targets.
    this.is_tank = false;
    //mobs to farm go here. order is priority.
    //todoonce i have locations on each one i will be able to 
    //check if we are not in mob[o] territory and smart move
    //if needed.
    this.mobs_to_farm = ["rat", "snake", "osnake", "greenjr"]
}

//array creating and holding all fighter objects.
all_fighters = [
    fighter_1 = new Fighter("MoyaTesh"),
    fighter_2 = new Fighter("Bandyaid"),
    fighter_3 = new Fighter("SliceNdice")
]

/* ----------------------------------------------------------------
 *Modify your fighters to do differant things here. You may change
 * whether they are tank, range, what activities they have, what order
 * those activities come in, and anything else here
 *  * --------------------------------------------------------------*/
//fighter_1.activities = ["Follow", "SendItems"]

//fighter_2.activities = ["Follow", "SendItems"]

// fighter_2.mobs_to_farm = ["goo"];
// fighter_3.is_tank = true; 

/* ----------------------------------------------------------------
 * Configure your merchant here.
 * --------------------------------------------------------------*/
merchant = {
    name: "NickyNickel",
    status: "", 
    activities: ["Merchant", "Upgrade", "CompoundNew", "Gold", "Restock"],
    upgrade_spot: { map: "main", x: -270, y: -162 },
    //Items to upgrade go here. 1st param is desired level. 2nd is rarity
    items_to_upgrade: {
        'wshoes': [8, 2],
        'wcap': [8, 2],
        'cclaw': [8, 2],
        'wgloves': [8, 2],
        'wbreeches': [8, 2],
        'mushroomstaff': [9, 2],
        'wattire': [8, 2],
        'frostbow': [7, 2],
        'phelmet': [7, 3],
        'gphelmet': [7, 2],
        'blade': [7, 1],
        'bow': [10, 1],
        'stinger': [8, 2],
        'glolipop': [8, 2],
        'slimestaff': [8, 2],
        'hbow': [8, 2],
        'throwingstars': [8, 2],
        'coat1': [6, 3],
        'gloves1': [6, 3],
        'pants1': [6, 3],
        'shoes1': [6, 3],
        'helmet1': [6, 3],
        // 'wbook0': [8, 2],
    },
    items_to_compound: {
        'ringsj': [4, 1],
        'intamulet': [4, 1],
        'stramulet': [4, 1],
        'dexamulet': [4, 1],
        'hpamulet': [4, 1],
        'intring': [4, 1],
        'dexring': [4, 1],
        'strring': [4, 1],
        'vitring': [4, 1],
    }, 
    resting_location: { map: "main", x: - 107, y: -50},
    bank_items : [], 
    items_to_bank: {
        "intamulet": "items3",
        "stramulet": "items3",
        "dexamulet": "items3",
        "hpamulet": "items3",
        "intring": "items2",
        "dexring": "items2",
        "strring": "items2",
        "vitring": "items2",
        "ringsj": "items2",
        "hpbelt": "items1",
        "dexbelt": "items1",
        "intbelt": "items1",
        "strbelt": "items1",
        "spores": "items0",
        "seashell": "items0",
        "candy0": "items0",
        "crabclaw": "items0",
        "gem0": "items0",
        "gum": "items0",
        "candy1": "items0",
        "pumpkinspice": "items0",
        "whiteegg": "items0",
        "snakefang": "items0",
        "pvptoken": "items0",
        "gslime": "items0",
        "essenceoffrost": "items0",
        "beefur": "items0",
        "mistletoe": "items0",
        "gem1": "items0",
        "spidersilk": "items0",
        "snakeoil": "items0",
        "dstones": "items0",
    }
}

/* ----------------------------------------------------------------
 * Logic for fighters deciding which scripts to load goes here.
 * --------------------------------------------------------------*/
//find the currently loaded character/player
if (character.name == merchant.name) {
    player = merchant;
    game_log("Merchant:" + player.name + " is ready for merchanting!")
    // for caracAL only
    parent.caracAL.load_scripts([
        "cjs/Merchant.js",
        "cjs/Upgrade.js",
        "cjs/Compound.js",
        "cjs/Restock.js",
        "cjs/Bank.js",
        "cjs/Sellitems.js",
    ]).then(x => console.log("loaded script ", globalThis.carac_message));
} else {
    // for(i = 0; i < all_fighters.length; i++){
    //     if (character.name == all_fighters[i].name) {
    //         player = all_fighters[i];
    //         game_log("Fighter:" + player.name + " is ready for battle!")
    //         //for caracAL only
    //         parent.caracAL.load_scripts([
    //             "cjs/Combat.js",
    //             "cjs/Senditems.js",
    //         ]).then(x => console.log("loaded script ", globalThis.carac_message));
    //     }
    // }
    for (current_fighter of all_fighters) {
        if (character.name == current_fighter.name) {
            player = current_fighter;
            game_log("Fighter:" + player.name + " is ready for battle!")
            //for caracAL only
            parent.caracAL.load_scripts([
                "cjs/Combat.js",
                "cjs/Senditems.js",
                "cjs/Kiting.js",
                "cjs/Priest.js",
            ]).then(x => console.log("loaded script ", globalThis.carac_message));
        }
    }
}

//load scripts not used in charAL
// for (activity of player.activities) {
//     load_code(activity);
// }

//get player info (used inside other scripts)
function get_current_player() {
    return player;
}

function get_player_names() {
    player_names = {
        fighters: [fighter_1.name, fighter_2.name, fighter_3.name],
        merchant: merchant.name
    }
    return player_names
}

function get_mob() {
    return fighter_1.mobs_to_farm[0]
}

function get_mobs_to_farm() {
    return fighter_1.mobs_to_farm
}

//check item quantaty in inventory
function numItems(item) {
    var itemCount = character.items.filter(i => i != null && i.name == item)
        .reduce(function (a, b) { return a + (b["q"] || 1); }, 0);
    return itemCount;
}

function get_fighters(){
    return all_fighters; 
}

function set_merchant(merchant){
    this.merchant = merchant; 
}

let map = []; // start at [0,0]
async function buildMap(maxX, maxY, minX, minY, nodeD) {
    for (let x = minX; x <= maxX; x+=nodeD) {
            for (let y = minY; y <= maxY; y+=nodeD) {
                await new Promise(resolve => setTimeout(resolve, 1)); // wait for 10ms before continuing
                game_log(x + "," + y);
                if (can_move_to(x, y)) {
                    localStorage.setItem("map_halloween", localStorage.getItem("map_halloween") + x + "," + y +"%")
                    // map.push([x, y]); // add the point to the map if it's valid
                }
            }
    }
    return map;
}

// if(character.name == "NickyNickel"){
//     game_log("testing***************************")
//     g = parent.G.geometry.main
//     game_log(g.max_x)
//     game_log(g.max_y)
//     game_log(g.min_x)
//     game_log(g.min_x)
//     map = buildMap(g.max_x, g.max_y, g.min_x, g.min_y);
//     game_log(map);
// }

// async function buildMap(maxX, maxY, minX, minY) {
//     let map = [[0, 0]]; // start at [0,0]
//     let queue = [[0, 0]]; // start with [0,0] in the queue

//     while (queue.length > 0) {
//         // get the first point from the queue
//         let [x, y] = queue.shift();

//         // check if the point is valid and not already in the map
//         if (
//             x >= minX &&
//             x <= maxX &&
//             y >= minY &&
//             y <= maxY &&
//             await can_move_to(x, y) &&
//             !map.some(([mx, my]) => mx === x && my === y)
//         ) {
//             map.push([x, y]); // add the point to the map

//             // add neighboring points to the queue
//             queue.push([x + 1, y]);
//             queue.push([x - 1, y]);
//             queue.push([x, y + 1]);
//             queue.push([x, y - 1]);
//         }
//         game_log(map)
//     }

//     return map;
// }

// if(character.name == "NickyNickel"){
//     game_log("testing***************************")
//     // localStorage.setItem("map_halloween", "");
//     g = parent.G.geometry.main
//     game_log(g.max_x)
//     game_log(g.max_y)
//     game_log(g.min_x)
//     game_log(g.min_x)
//     buildMap(g.max_x, g.max_y, g.min_x, g.min_y, 20)
//     // coorTimeStart = new Date()
//     // getValidNodes({ x:character.x | 0, y:character.y | 0}, 3)

// }

// async function getValidNodes(startNode, radius) {
//     const validNodes = [];
//     const queue = [startNode];
//     const visited = [startNode];

//     while (queue.length > 0) {
//         const currentNode = queue.shift();
//         validNodes.push(currentNode);

//         // Get all neighbors of current node within radius
//         const neighbors = getNeighbors(currentNode, radius);

//         // Filter neighbors to only include those that haven't been visited and can be moved to
//         await new Promise((resolve) => setTimeout(resolve, 2)); // add a 2ms delay


//         const validNeighbors = neighbors.filter(node => {
//             for(nodeV in visited){
//                 if (nodeV.x == node.x && nodeV.y == node.y){
//                     return false; 
//                 }
//             }
//             if (can_move_to(node)){
//                 return true; 
//             } 
//             return false; 
//             // !visited.includes(node) && can_move_to(node);
//         })
//         // Add valid neighbors to the queue and visited set
//         validNeighbors.forEach(node => {
//             queue.push(node);
//             visited.push(node);
//         });
//     }

//     // show_json(validNodes)
//     return validNodes;
// }

// function getNeighbors(node, radius) {
//     // Get all nodes within the given radius of the starting node
//     // (Assuming here that nodes have x and y coordinates)
//     const neighbors = [];
//     for (let x = node.x - radius; x <= node.x + radius; x++) {
//         for (let y = node.y - radius; y <= node.y + radius; y++) {
//             const dist = getDistance(node, {x:x, y:y})
//             if (dist <= radius) {
//                 newNode = {x:x, y:y}
//                 // show_json(newNode)
//                 neighbors.push(newNode);
//             }
//         }
//     }
//     return neighbors;
// }

// function getDistance(nodeA, nodeB) {
//     // Diagonal distance (Euclidean distance)
//     const dx = Math.abs(nodeA.x - nodeB.x);
//     const dy = Math.abs(nodeA.y - nodeB.y);
//     return Math.sqrt(dx * dx + dy * dy);
// }





