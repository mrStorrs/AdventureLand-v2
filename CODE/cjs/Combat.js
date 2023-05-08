
//load_code("goldmeter");
//load_code("SendItems");

var monsterHuntMobs = ["snake", "osnake", "arcticbee", "bee", "crab", "goo", "minimush", "rat"]
var agitateZones = ["mansion"]
var attack_mode = true
var friendlyTargets = [];
var partyTargets = [];
var huntFound = false; 
var lastAgitate = new Date() / 1000; 
var moveAttempts = 0; 

//get the player obj from config script
var player = get_current_player();
player.friendlyTargets = [];
player.targets = []; 
player.target = {};

//get merchant
merchant = get_player_names().merchant
//set targets to farm
var mobs_to_farm = player.mobs_to_farm;
var saved_mobs_to_farm = player.mobs_to_farm;

//restock timer
var restock_timer = 0;

var all_fighters = get_fighters(); //get all the fighter objects. 
var all_fighters_names = get_player_names().fighters; //get all the fighter objects. 
var mobPuller = "MoyaTesh";

var deathIndex = 0;
var target = get_targeted_monster();
var booster_index = 2
var timeTargetAquired = new Date() / 1000;
var groupedIndex = 0; 
var mainTarget = mobs_to_farm[0]; 


last_collection = new Date() / 1000 - 120;
last_send = new Date() / 1000;

// switch 
targetIndex = 0;

//need a boss with a trim strat which will attack a boss with main but keep adds off

var bestiary = {
    "snake" : {
        "strategy" : "oneshot",
        "location": { map: "halloween", x: -392, y: -327 }

    },
    "osnake": {
        "strategy": "oneshot",
        "location": { map: "halloween", x: -392, y: -327 }
    },
    "minimush": {
        "strategy": "oneshot",
        "location": { map: "halloween", x: -8, y: 603 }
    },
    "arcticbee": {
        "strategy": "oneshot",
        "location": {map:"winterland", x:740, y:-897}
    },
    "goo": {
        "strategy": "oneshot",
        "location": {map:"main", x:-52, y:-761}
    },
    "crab": {
        "strategy": "oneshot",
        "location": {map:"main", x:-1100, y:36}
    },
    "bbpompom": {
        "strategy": "tank"
    },
    "rat": {
        "strategy": "spread",
        "location": { map: "mansion", x: -290, y: -424},
        "location1": { map: "mansion", x: 247, y: -424},
        "location2": { map: "mansion", x: 0, y: -162},
    }, 
    "bee": {
        "strategy": "oneshot",
        "location": {map:"main", x:613, y:663}
    },
    "stoneworm": {
        "strategy": "pull",
        "location": {map:"spookytown", x:402, y:19}
    },
    "croc": {
        "strategy": "tank",
        "location": {map:"main", x:662, y:1652}
    },
    //safe path through halloween > spookytown
    "mummy": {
        "strategy": "pull",
        "location": { map: "level3", x: -126, y: -25 }
    },
    //safe path through halloween > spookytown
    "cgoo": {
        "strategy": "pull",
        "location": { map: "level2s", x: -135, y: 506 }
    },
    "bat": {
        "strategy": "tank"
    }
}

var states = {
    combat : "default",
    moving : "default",
    pathing : "default",
    targeting : "default",
    // {app="caracAL"} |= "action=get"    : "default" this group state will be held in local storage to make it easier to pull / read.
    // gTargetState : "default" this group state will be held in local storage to make it easier to pull / read.
    // gCombatState : "default" this group state will be held in local storage to make it easier to pull / read.
}



//check for tank
all_fighters.forEach(fighter => {
    if (fighter.is_tank) {
        tank = fighter.name
    }
});

/* ----------------------------------------------------------------
 * Invitations too party and accepting said invitatioins below.
 * --------------------------------------------------------------*/
//todo: adjust this to make it so that it doesn't invite if the person
//is not online. 
// function party() {
//     send_party_invite("Bandyaid", false);
//     send_party_invite("MoyaTesh", false);
//     send_party_invite("NickeyNickel", false);
// }

//accept request from party members
// function on_party_request(name) {
//     if (name == 'Bandyaid' || name == 'MoyaTesh') {
//         accept_party_request(name);
//     }
// }
//used to automatically accept from leader. 
function on_party_invite(name) {
    if (name == "SliceNdice") {
        accept_party_invite(name);
    }
}
//automatically request an invite to party
// send_party_request('MoyaTesh');

/* ----------------------------------------------------------------
 * On message from commander (merchant)
 * --------------------------------------------------------------*/
character.on("cm", function (m) {
    if (m.name == merchant || m.name == "Bandyaid" || m.name == "MoyaTesh") {
        //send back the amount of gold currently held
        if (m.message == "gold") {
            send_cm(merchant, character.gold);
        }
        else if (m.message.action == "getLocation") {
            locationResponse = {
                action: "sendLocation",
                map: character.map,
                x: character.x,
                y: character.y
            }
            send_cm(m.name, locationResponse);
        }
        else if (m.message == "restock") {
            if (restock_timer == 0) {
                if (numItems("mpot1") < 6000) send_cm(m.name, "mana");
                if (numItems("hpot1") < 6000) send_cm(m.name, "health");
            } else if (restock_timer == 12) {
                restock_timer = 0;
            } else {
                restock_timer++;
            }
        }
    }

    // if (m.name == tank) {
    //     change_target(m.message);
    //     game_log(character.name + " attacking tanks target")
    // }

    if (m.name == "SliceNdice" && m.message.action == "sendLocation") {
        smart_move({ map: m.map, x: m.x, y: m.y });
    }



})

/* ----------------------------------------------------------------
 * Main combat interval
 * --------------------------------------------------------------*/
setInterval(function () {



    current_time = new Date() / 1000; //convert to seconds

    //check if slots are getting full. if they are call in the merchant. every 2 minutes to avoid over doing it. 
    if (current_time - last_collection > 10 && character.isize - character.esize > 15) {
        locationResponse = {
            action: "sendLocation",
            map: character.map,
            x: character.x,
            y: character.y
        }
        send_cm(merchant, locationResponse);
        last_collection = new Date() / 1000;
    }

    //check if need to heal!



    // if (character.hp < character.max_hp * 0.30 ) {
    //     use("use_town");
    // }

    if (character.rip) {
        if (deathIndex >= 100) {
            localStorage.setItem(character.name + "Location", "main" + "," + character.x + "," + character.y)
            respawn();
            deathIndex = 0;
        } else {
            deathIndex++;
        }
    }
    //get LOOOOTZ!

    if (!attack_mode || character.rip || is_moving(character)) return;



    //check inventory and then do stuff.
    // if (numItems("hpot1") < 10 || numItems("mpot1") < 10) {
    //     if (character.gold > 600000000000000000) {
    //         //deposit_gold();
    //     } else {
    //         if (character.map == "bank") {
    //             move(0, -30); //move to base of bank
    //             transport("main", 3); //leave bank
    //         } else {
    //             buy_potions();
    //         }

    //     }
    // }

    /* ----------------------------------------------------------------
     * Targeting Logic. 
     * 
     * @todo: change pvp logic (change server etc.) to be dependent on
     *        player obj information.
     * @todo: fix target checking to loop through array of targets,
     *        prioritizing by index.
     * --------------------------------------------------------------*/





    // if (!target) {

    //     targets = find_target();
    //     target = targets[0];
    //     setTarget(player.target);

    //     if (player.target && character.name == tank) {
    //         parent.party_list.forEach(fighter => {
    //             send_cm(fighter, target);
    //         })
    //     }

    //     if (player.target) {
    //         //check if mob has a target.
    //         try {
    //             var name = get_target_of(player.target).name;
    //             //game_log("targeting " + name);
    //         } catch (err) {
    //             change_target(player.target);
    //         }
    //     }
    //     else {
    //         //can't find monster so move to area
    //         if (mobs_to_farm[0] == "cgoo") {
    //             smart_move("arena");
    //             set_message("Moving");
    //             return;
    //         } else {
    //             move_to_farming_loc();
    //             set_message("Moving");
    //             return;
    //         }

    //     }
    // }



    /* ----------------------------------------------------------------
     * Combat / attack
     * --------------------------------------------------------------*/
    //check if in range then attack.
    // if (!is_in_range(player.target) && character.name == "SliceNdice") {
    //     move_to_target(player.target);
    //     // updateCharacterPosition(player.targets);
    // }

    // if(character.name != "SliceNdice" && targets.length > 0){
    // } else {
    //     move_to_target(player.target); 
    // }


    //run away. This actually just stops the character in placew long enough to die
    // else if (character.hp < character.max_hp / 2) {
    //     smart_move(find_npc("fancypots"));
    // }
    //attack
    if (can_attack(player.target)) {
        set_message("Attacking");


        // if (character.name == "SliceNdice") {
        //     move_to_target(player.target);
        // } 
        
        // else {
        //     // targetLocations = []; 
        //     // pathTargets = find_target(true);
        //     // for(player.target of pathTargets){
        //     //     targetLocations.push([target.x, target.y]);
        //     // }
        //     // getValidCoordinates([character.x, character.y], 10)
        //     // if(character.nodes != undefined && character.nodes.length > 2){
        //     //     path = runPathfinding([character.x, character.y], 
        //     //         character.nodes,
        //     //         targetLocations,
        //     //         target.range + 2,
        //     //         character.range,
        //     //         6)
        //     //     game_log(path);
        //     // }

        //     updateCharacterPosition(player.targets);
        // }

        //too weak
        if (character.ctype == "ranger") {
            // if(!is_on_cooldown("3shot")){
            //     var can_3shot = 0
            //     for(i=0; i < 3; i++){
            //         if(can_attack(player.targets[i])) can_3shot++; 
            //     }
            //     if (can_3shot == 3) {
            //         use("3shot");
            //     }
            // } else {
            // attackplayer.target;
            // }
        }

        if (character.ctype == "warrior") {
            // if(!is_on_cooldown("taunt") && character.mp > 60 && target.target != character.name){
            //     use("taunt");
            // }
            // else if (!is_on_cooldown("charge") && character.mp > 200) {
            //     change_target(character);
            //     use("charge");
            //     change_target(player.target)
            // }
            // else if (!is_on_cooldown("agitate") && character.mp == character.max_mp ){
            //     use("agitate");
            //     game_log("using agitate");
            // } 
        }

        if (character.ctype == "mage") {
            // if (!is_on_cooldown("energize") && character.mp > 200 && distance(character, get_entity("MoyaTesh") < 320)){
            //     change_target(get_entity("MoyaTesh"))
            //     use("energize")
            //     game_log("using energize")
            //     change_target(player.target);
            // } else {
            // attack(player.target)

            // }
        }

        if (character.ctype == "priest") {
            // if (!is_on_cooldown("energize") && character.mp > 200 && distance(character, get_entity("MoyaTesh") < 320)){
            //     change_target(get_entity("MoyaTesh"))
            //     use("energize")
            //     game_log("using energize")
            //     change_target(player.target);
            // } else {
            // attack(player.target)

            // }
        }


        // else {
        //     updateCharacterPosition(player.targets);
        // }
        // if(can_attack(player.target)){
        //     attack(player.target);
        // }

    }
    // else {
    //     move_to_target(player.target);
    // }

    // Define constants for the character and target speed, attack range, and safe distance


    // Define variables for the character and target positions
    // let characterX = 100;
    // let characterY = 100;

    // Define a function to calculate the distance between two points


}, 100); // Loops every 1/20 seconds.

function buildNodeDict(validNodesStringArray){
    validNodes = []
    for(node of validNodesStringArray){
        splitNode = node.split(",")
        validNodes.push( {
            x: parseInt(splitNode[0]),
            y: parseInt(splitNode[1])
        })
    }
    return validNodes;
}

async function slowLoop() {
    try {
        if (parent.party_list.length < 3 && character.name == "SliceNdice") {
            for (c of parent.X.characters) {
                if (c.online > 0 && c.type != merchant && !parent.party_list.includes(c.name) && c.name != character.name ) {
                    game_log(c.name);
                    await send_party_invite(c.name, false);
                }
            }
        }

    } catch (e) {
        game_log("error=slowLoopParty " + e)
    }

    try {
        var earringIndex = locate_item("lostearring")
        if (earringIndex >= 0){
            if (getDistance(character, find_npc("pwincess")) > 150) {
                await smart_move("pwincess")
            }
            game_log("action=exchangingEarring " + "character=" + character.name);
            result = await exchange(earringIndex);
            if(result.success){
                game_log("action=exchangingEarring " + "character=" + character.name + " itemExchangeReward=" + result.reward);
            } else {
                game_log("action=exchangingEarring " + "character=" + character.name + " itemExchangeFailed=" + result.reason);
            }
        }

    } catch (e) {
        game_log("error=slowLoopLostEaringExchange")
        show_json(e)
    }

    //check if we are not on the right map for farming. added to avoid getting stuck in 
    //allready finished monsterhunts. or Stuck in various other ways. may
    try {
        if(character.map != bestiary[mobs_to_farm[0]].location.map  && !isSmartMoving()){
            move_to_farming_loc(); 
        }
    } catch (e) {
        game_log("error=slowLoopMoveToFarming")
    }
    setTimeout(slowLoop, 10000);
}
setTimeout(slowLoop(), 30000)

async function mHuntLoop() {
    // If we have no monster hunt, go get a monster hunt
    // If we have completed our monster hunt, go turn it in
    // todo: add a monsterhunt.id checker to display in the get/turning

    //see if we need to go get new monster hunts
    try {
        //maybe put a if mobstofarm includes monsterarry
        if (!character.s.monsterhunt || character.s.monsterhunt.c == 0 || character.s.monsterhunt == undefined) {
            if ( !smart.moving && !smart.pathing && character.s.monsterhunt != undefined && character.s.monsterhunt.c == 0) {
                game_log("character=" + character.name + " action=turnHuntIn" + " huntMob=" + character.s.monsterhunt.id);
                await smart_move("monsterhunter")
                parent.socket.emit("monsterhunt")
                if(!character.s.monsterhunt || character.s.monsterhunt == undefined){
                    parent.socket.emit("monsterhunt")
                };
                move_to_farming_loc();
                // game_log("character=" + character.name + " action=getHunt" + " huntMob=" + character.s.monsterhunt.id)
            //we dont want to get a new hunt in the middle of a hunt.
            } else if (mobs_to_farm[0] == saved_mobs_to_farm[0] && !smart.moving && !smart.pathing){
                game_log("character=" + character.name + " action=getHunt")
                await smart_move("monsterhunter")
                parent.socket.emit("monsterhunt")
                if (!character.s.monsterhunt || character.s.monsterhunt == undefined) {
                    parent.socket.emit("monsterhunt")
                };
                move_to_farming_loc();
            }
        }
    } catch (e) {
        game_log("error=mHuntLoop " + e)
    }
 
    try{
        if (character.s.monsterhunt){
            if (character.name == all_fighters_names[0]) {
                localStorage.setItem("hunt0task", character.s.monsterhunt.id)
                localStorage.setItem("hunt0c", character.s.monsterhunt.c)

            } else if (character.name == all_fighters_names[1]) {
                localStorage.setItem("hunt1task", character.s.monsterhunt.id)
                localStorage.setItem("hunt1c", character.s.monsterhunt.c)

            } else if (character.name == all_fighters_names[2]) {
                localStorage.setItem("hunt2task", character.s.monsterhunt.id)
                localStorage.setItem("hunt2c", character.s.monsterhunt.c)

            }
        }
        if (character.s.monsterhunt && monsterHuntMobs.includes(character.s.monsterhunt.id)) {
            if (character.s.monsterhunt.c > 0){
                if (character.name == all_fighters_names[0]) {
                    localStorage.setItem("hunt0", character.s.monsterhunt.id)
                    localStorage.setItem("hunt0time", character.s.monsterhunt.ms)
                } else if (character.name == all_fighters_names[1]) {
                    localStorage.setItem("hunt1", character.s.monsterhunt.id)
                    localStorage.setItem("hunt1time", character.s.monsterhunt.ms)
                } else if (character.name == all_fighters_names[2]) {
                    localStorage.setItem("hunt2", character.s.monsterhunt.id)
                    localStorage.setItem("hunt2time", character.s.monsterhunt.ms)
                } 
            } else {
                if (character.name == all_fighters_names[0]) {
                    localStorage.setItem("hunt0", "")
                } else if (character.name == all_fighters_names[1]) {
                    localStorage.setItem("hunt1", "")
                } else if (character.name == all_fighters_names[2]) {
                    localStorage.setItem("hunt2", "")
                }
            }
        } else {
            if (character.name == all_fighters_names[0]) {
                localStorage.setItem("hunt0", "")
            } else if (character.name == all_fighters_names[1]) {
                localStorage.setItem("hunt1", "")
            } else if (character.name == all_fighters_names[2]) {
                localStorage.setItem("hunt2", "")
            }
        }
        var huntArray = [localStorage.getItem("hunt0"), localStorage.getItem("hunt1"), localStorage.getItem("hunt2")]
        var huntFound = false; 
        localStorage.setItem("huntFound", "false")
        for (mob of monsterHuntMobs) {
            if (huntArray.includes(mob)) {
                localStorage.setItem("huntFound", "true")
                huntFound = true;
                if(!huntArray.includes(mobs_to_farm[0])){
                    timeLeft = localStorage.getItem("hunt"+huntArray.indexOf(mob)+"time");
                    if(timeLeft > 600000){
                        // localStorage.setItem("gMoveState", "groupUp")
                        game_log("setting monster hunt mob")
                        mobs_to_farm[0] = mob;
                        game_log("action=mHunt "+ mobs_to_farm)
                        move_to_farming_loc();
                    }
                }
                break;
            }
        }
    } catch (e) {
        game_log("error=mHuntLoop2")
    }

    if(!huntFound){
        mobs_to_farm[0] = mainTarget;
        localStorage.setItem("mobsToFarm", mobs_to_farm)
    }
    setTimeout(mHuntLoop, 2000);
}
// setTimeout(mHuntLoop(), 10000)

//notes for optomizing grid!!! do not check nodes that allready exist inside the array! 
//build as the char moves around and then store. before checking can move test if it is in the
//array allready. may have to do this by converting to strings. 

// validNodes = buildNodeDict(localStorage.getItem("map_halloween").split("%"));
async function pathLoop() {
    // graph = getValidNodes({x:character.x | 0, y:character.y | 0},  5); 

        try{
            // graph = getValidNodes({x:character.x, y:character.y},  5); 
            targetLocations = []; 
            // show_json(validNodes);
            pathTargets = find_target(true);
            for(player.target of pathTargets){
                targetLocations.push({x:target.x | 0, y:target.y | 0});
            }
            // getValidCoordinates([character.x | 0, character.y | 0], 5)
            // game_log(character.x, )
            character.path = runPathfinding({x:character.x | 0, y:character.y | 0}, 
                // validNodes,
                targetLocations,
                target.range + 5,
                character.range - 5,
                10) //this results in about 5 path nodes.
            // show_json(character.path);

        } catch (e){
            game_log("error=pathLoop")
            // game_log(e); 
        // updateCharacterPosition(player.targets);
    }
    setTimeout(pathLoop, 1000); 
}
// setTimeout(pathLoop(), 10000)
//todo: 
// + have a set place in the middle of dangerous zones that the
//   will act as an anchor for them to not get to far away from . 
// + to make this better we could save off locatiopn in local storage
//   then use it to allow the ppl to follow the others. 
async function moveLoop() {
    let b = bestiary[mobs_to_farm[0]]
    if (bestiary[mobs_to_farm[0]] != undefined) {
        strat = bestiary[mobs_to_farm[0]].strategy
    } else {
        strat = "oneshot"
    }

    if (localStorage.getItem("gCombatState") == "tank" && mobs_to_farm[0] != "snake" && mobs_to_farm[0] != "osnake" && strat != "pull") {
        strat = "tank";
    }

    //doing this here since its a relativly slow loop
    localStorage.setItem(character.name + ".hp", character.max_hp - character.hp);
    // if(character.ctype == "priest" && strat != "spread"){
    //     if (parseInt(localStorage.getItem("SliceNdice.hp")) > 500){
    //         let sEntity = Object.values(get_entity("SliceNdice"));
    //         if(getDistance(sEntity < 300)){
    //             getNewtarget(); //we want new targets with SliceNdice in it. 
    //         }
    //     } else if (parseInt(localStorage.getItem("MoyaTesh.hp")) > 500){
    //         let sEntity = Object.values(get_entity("SliceNdice"));
    //         if(getDistance(sEntity < 300)){
    //             getNewtarget(); //we want new targets with SliceNdice in it. 
    //         }
    //     }
    // }

    sNdLoc = localStorage.getItem("SliceNdiceLocation").split(",")
    sNdLoc = {map:sNdLoc[0],
        x:parseInt(sNdLoc[1]),
        y:parseInt(sNdLoc[2])}

    currBestiary = bestiary[mobs_to_farm[0]];
    // if(!smart.moving && !smart.pathing){
    //     //we are not even on the same map. 
    //     if (character.map != currBestiary.location.map) {
    //         move_to_farming_loc();
    //     }
    // }



    if (!smart.moving && !smart.pathing ){

        //set our locations
        localStorage.setItem(character.name + "Location", character.map + "," + character.x + "," + character.y)
        try {

            // if(character.ctype == "priest" && distance(character, target) > character.range){
            //     move_to_target(target);
            // }

            if(strat == "kite"){
                if (character.name == "SliceNdice") { move_to_target(target) }
                // else if (!is_in_range(get_nearest_hostile())) { move_to_target(target) }
                else if (character.path != undefined && character.path.length > 0 && character.name != "SliceNdice") {
                    // game_log("mobing")
                    node = character.path[character.path.length - 1]
                    move(
                        node.x,
                        node.y
                    );
                    character.path.pop();
                }
            } else if (strat == "oneshot"){
                // if (character.name == "SliceNdice") {move_to_target(target)}
                if(!is_in_range(target)){
                    move_to_target(target);
                }
            } else if (strat == "tank"){
                if (character.name == "SliceNdice" && !is_in_range(target)) { 
                    move_to_target(target)
                // } else if (character.name == "SliceNdice" && !is_in_range(target)){
                //     move_to_target(target)
                } else if (getDistance(sNdLoc, {x:character.x, y:character.y}) > 40) {
                    move_to_target(sNdLoc);
                }
            } else if (strat == "pull") {
                mobPullerLoc = getLocLocal(mobPuller);
                if (character.name == "SliceNdice" && !is_in_range(target) && get_targeted_monster(target)) {
                    move_to_target(target)
                    // } else if (character.name == "SliceNdice" && !is_in_range(target)){
                    //     move_to_target(target)
                } else if (getDistance(mobPullerLoc, character) > 50) {
                    move_to_target(mobPullerLoc);
                }

            } else if (strat == "spread") {
                if (character.name == all_fighters_names[0]) {
                    let d = getDistance(character, b.location)
                    if (d > 200 && !isSmartMoving()) {
                        smart_move(b.location);
                    } else if (!is_in_range(target)){
                        move_to_target(target);
                    }
                } else if (character.name == all_fighters_names[1]) {
                    let d = getDistance(character, b.location1)
                    if (d > 200 && !isSmartMoving()) {
                        smart_move(b.location1);
                    } else if (!is_in_range(target)){
                        move_to_target(target);
                    }
                } else if (character.name == all_fighters_names[2]) {
                    move_to_target(target);
                }
            } else {
                if(!is_in_range(target)){
                    move_to_target(target);
                }
            }
        } catch (e) {
            game_log("error=moveLoop")
        }
    }
    setTimeout(moveLoop, 200)
}
setTimeout(moveLoop(), 10000)

async function attackLoop() {
    let target = get_targeted_monster();
    try {
        if (!target) {
            getNewtarget();
        } else if (can_attack(target) && character.mp > 40 ) {
            // if(!is_targeted(player.target)){
            await attack(target)
            // reduce_cooldown("attack", Math.min(...parent.pings))
            // } else {
            // get_new_target(); 
            // }
            /** NOTE: We're now reducing the cooldown based on the ping */
        }
    } catch (e) {
        game_log("error=attackLoop")
        // console.error(e)
    }
    setTimeout(attackLoop, Math.max(1, ms_to_next_skill("attack")))
}

async function warriorAttackLoop() {
    let target = get_targeted_monster(); 
    //create a check if you are moving and there is 
    //a closer enemy to target it. 
    try {
        if (!target) {
            getNewtarget(); 
        } else if (can_attack(target)) {
            if (ms_to_next_skill("taunt") == 0 && character.mp > 60 && all_fighters_names.includes(target.target) && character.name != target.target) {
                await use("taunt");
            }
            else if (ms_to_next_skill("charge") == 0 && character.mp > 200) {
                change_target(character);
                await use("charge");
                change_target(target)
            }
            else if (ms_to_next_skill("agitate") == 0 && character.mp > 1000 && new Date() / 1000 - lastAgitate > 30 
                    && target.mtype != "wabbit" && agitateZones.includes(character.map)){
                lastAgitate = new Date() / 1000; 
                await use("agitate");
            }
             
            if (character.mp > 100){
                await attack(target);
            }
            // if(!is_targeted(player.target)){
            // reduce_cooldown("attack", Math.min(...parent.pings))
            // } else {
            // get_new_target(); 
            // }
            /** NOTE: We're now reducing the cooldown based on the ping */
        } else {
            // getNewtarget();
        }
    } catch (e) {
        game_log("error=attackLoop")
        console.error(e)
    }
    setTimeout(warriorAttackLoop, Math.max(1, ms_to_next_skill("attack")))
}

if(character.ctype == "priest"){
    setTimeout(priestAttackLoop(), 10000)
}else if(character.ctype == "warrior"){
    setTimeout(warriorAttackLoop(), 10000)
}else {
    setTimeout(attackLoop(), 10000)
}

async function lootLoop() {
    try {
        if (character.name == "SliceNdice" || character.name == "MoyaTesh") {
            await shift(booster_index, "goldbooster")
            await loot();
            await shift(booster_index, "luckbooster")
        } 
    } catch (e) {
        game_log("error=lootLoop")
        // console.error(e)
    }
    setTimeout(lootLoop, 1000);
}
setTimeout(lootLoop(), 20000)

function ms_to_next_skill(skill) {
    const next_skill = parent.next_skill[skill]
    if (next_skill == undefined) return 0
    const ms = parent.next_skill[skill].getTime() - Date.now()
    return ms < 0 ? 0 : ms
}

function setTarget(target) {
    this.target = target
}
//todo: make it so that the tank does not get retargetted on mobs
async function targetLoop() {
    var timeout = 1; 
    if(localStorage.getItem("gCombatState") != "tank"){
        if (character.name == all_fighters[0].name && Date.now() % 15 == 0) {
            try {
                var target = get_targeted_monster();
                if (!target) {
                    get_new_target();
                } 
                // else if (is_targeted(player.target)) {
                //     get_new_target();// prolly don
                // }
            } catch (e) {
                game_log("error=targetLoop")
            }
        }
        else if (character.name == all_fighters[1].name && Date.now() % 15 == 5) {
            try {
                var target = get_targeted_monster();
                if (!target) {
                    get_new_target();
                } else if (is_targeted(player.target))   {
                    // get_new_target();
                } 
            } catch (e) {
                game_log("error=targetLoop")
            }
        }
        else if (character.name == all_fighters[2].name && Date.now() % 15 == 10) {
            try {
                var target = get_targeted_monster();
                if (!target) {
                    get_new_target();
                } else if (is_targeted(player.target)) {
                    // get_new_target();
                } 
            } catch (e) {
                game_log("error=targetLoop")
            }
        }
    } else {
        try {
            timeout = 100; 
            var target = get_targeted_monster();
            if (!target || target.mtype == "wabbit") {
                if(character.name != "SliceNdice"){
                    get_new_target();
                }
            } else if (is_targeted(player.target)) {
                // get_new_target();
            }
        } catch (e) {
            game_log("error=targetLoop")
            // game_log(e)
        }
    }

    //There was a bug where there was an invisible leftover mob i couldnt attack.
    //this should grab a new target if there is an uncleared mob. 
    if(new Date / 1000 - timeTargetAquired > 15){
        // move_to_farming_loc();
        get_new_target(); 
    }
    setTimeout(player.targetLoop, timeout)
}
// setTimeout(player.targetLoop(), 10000)

function get_new_target() {
    targets = find_target(false);
    targetBestiary = bestiary[mobs_to_farm[0]]

    if (bestiary[mobs_to_farm[0]] != undefined) {
        strat = bestiary[mobs_to_farm[0]].strategy
    } else {
        strat = "oneshot"
    }

    if (localStorage.getItem("gCombatState") == "tank"){
        strat = "tank"; 
    }

    //use this for one shot not kite monsters
    if(strat == "oneshot"){
        if(player.targets.length > 1 && character.name == "MoyaTesh"){
            target = targets[1];
        } else if (player.targets.length > 2 && character.name == "Bandyaid"){
            target = targets[2]
        } else {
            target = targets[0];
        }
    } else {
        //use this for kiteable monsters;
        target = targets[0];
    }

    if (player.target) {
        //check if mob has a target.
        // setTarget(player.target);
        timeTargetAquired = new Date / 1000; 
        change_target(player.target);
    } else {
        if (strat != "tank"){
            move_to_farming_loc();
        } 
        // else if (character.map != targetBestiary.location.map){
        //     move_to_farming_loc();
        // }
        set_message("Moving");
    }
}

//need to make this better....
async function regenLoop() {
    try {
        var doMP = false; 
        var regenCD = 0;
        //curently set to use the skill, not potions

        if(character.max_hp - character.hp > character.max_hp * .75 
                && character.max_mp - character.mp < character.max_mp * .60){
            doMP = true;
        }  

        if (character.hp < character.max_hp - 400 && !doMP) {
            await use('use_hp');
            regenCD = 2050;
        }
        else if (character.hp < character.max_hp - 200 && !doMP) {
            await use('regen_hp');
            regenCD = 2025*2;
        }else if (character.mp < character.max_mp - 500) {
            await use('use_mp');
            regenCD = 2050;
        }
        else if (character.mp < character.max_mp - 100) {
            await use('regen_mp');
            regenCD = 2025*2;
        }

    } catch (e) {
        game_log("error=lootLoop")
        // console.error(e)
    }

    setTimeout(regenLoop, Math.max(50, regenCD));
}
setTimeout(regenLoop(), 20000)

//function for finding neaerest target
function find_target(includeTargeted) {
    var entities;
    entities = Object.values(parent.entities)
    var targets = [];
    var friendlyTargets = [];    
    var nearbyParty = [];   

    for (player.target of entities) {
        // var targetStrat = bestiary[target.name];
        if(player.target.mtype == "wabbit" && character.name == "SliceNdice"){
            // localStorage.setItem("dangerousTargetFound", new Date / 1000)
            // localStorage.setItem("gCombatState", "tank")
            // target.attacking++; 
            // targets.push(player.target);
            continue; 
        } else if (player.target.mtype == "wabbit"){
            continue; 
        }

        //create an array to hold all nearby party members. 
        if(all_fighters_names.includes(player.target.name)){
            nearbyParty.push(player.target); 
        }
        setPartyTargets(nearbyParty)

        //its killing us! get it off our backs. may need to disable this if
        //farming single shot mobs. 
        if(player.target.target == character.name && target.type == "monster"){
            target.attacking++;
            targets.push(player.target);
        }

        if (mobs_to_farm.includes(player.target.mtype)) {
            var targetStrat = bestiary[target.mtype].strategy;
            //found a dangerous monster. lets group up. 


            if(player.targetStrat == "pull"){
                var targetPuller = mobPuller;
            } else {
                var targetPuller = "SliceNdice"
            }

            if (localStorage.getItem("gCombatState") == "tank" || targetStrat == "pull" || targetStrat == "tank") {
                //target if the monster is allready targetting one of us. 
                if(all_fighters_names.includes(player.target.target) ){
                    target.attacking++; 
                    targets.push(player.target);
                }
                //if we are the tank leader or its a one shotter we can target. 
                if (character.name == targetPuller || target.hp < character.attack){
                    // healerLoc = localStorage.getItem("BandyaidLocation").split(",")
                    // healerLoc = {
                    //     map: healerLoc[0],
                    //     x: parseInt(healerLoc[1]),
                    //     y: parseInt(healerLoc[2])
                    // }
                    // distToTarg = getDistance(character, healerLoc);
                    dFromFurthestFighter = getLocLocalFighters();
                    // game_log(dFromFurthestFighter)
                    if (dFromFurthestFighter < 250){
                        targets.push(player.target);
                    }
                } 
            }
            //not in tank mode 
            else if (includeTargeted || !is_targeted(player.target) ) {
                targets.push(player.target); // found a mob to farm lets add it to the targets array
            } 
        } else if (player.target.name == merchant) {
            //check if monster is actually our merchant
            time_now = new Date() / 1000;
            if (time_now - last_send > 3) {
                send_items(t);
                last_send = new Date() / 1000;
            }
        }

        if (player.targetStrat){
            if (all_fighters_names.includes(player.target.name) && target.hp < target.max_hp - 500){
                friendlyTargets.push(player.target);
            }
        }

        // game_log(localStorage.getItem("gCombatState"));
        if((new Date / 1000) - (parseInt(localStorage.getItem("dangerousTargetFound"))) > 30
                && localStorage.getItem("gCombatState") == "tank"){
            game_log("action=clearingTankCombatState");
            localStorage.setItem("gCombatState", "")
        }
        // if(player.target.mtype == "greenjr"){
        //     callForHelp();
        // }
    }

    //sort by distance from me
    targets.sort(function (current, next) {

        if (current.attacking > next.attacking) {
            return -1;
        }
        var d_curr = getDistance(character, current);
        var d_next = getDistance(character, next);

        if (d_curr < d_next) {
            return -1;
        } else if (d_curr > d_next) {
            return 1;
        } else {
            return 0;
        }
    });

    friendlyTargets.sort(function (current, next) {
        var d_curr = current.max_hp - current.hp;
        var d_next = next.max_hp - next.hp;
        // var d_curr = distance({x1:character.x, y1:current, });
        // var d_next = distance(character, next);
        if (d_curr > d_next) {
            return -1;
        } else if (d_curr < d_next) {
            return 1;
        } else {
            return 0;
        }
    });

    if(character.ctype == "priest"){
        setFriendlyTargets(friendlyTargets); 
    }




    return targets;
}

function is_targeted(monster) {
    parent.party_list.forEach(fighter => {
        if (fighter.length > 0
            && fighter != character.name) {
            var fEntity = get_entity(fighter);
            if (fEntity != undefined) {
                if (fEntity.target == monster.id) {
                    return true;
                }
            }
        }
    })
    return false;
}


/* ----------------------------------------------------------------
 * Check inventory for potions and then buy more if needed. 
 * Will eventually be moving this to it's own script.
 * --------------------------------------------------------------*/

//deposit gold in bank
function deposit_gold() {
    if (character.map != "bank") {
        smart_move(find_npc("goldnpc"));
    } else {
        bank_deposit(character.gold - 50000); //deposit all but
        move(0, -30); //move to base of bank
        transport("main", 3); // leave bank
    }
}

//buy potions
function buy_potions() {
    buy("hpot1", 2000 - numItems("hpot1"));
    buy("mpot1", 2000 - numItems("mpot1"));
    if (!smart.moving) {
        smart_move(find_npc("fancypots"));
    }
}

async function move_to_farming_loc() {
    // game_log(getDistance(character, bestiary[mobs_to_farm[0]].location))
    let b = bestiary[mobs_to_farm[0]]

    if(bestiary[mobs_to_farm[0]].location.map == character.map && getDistance(character,bestiary[mobs_to_farm[0]].location) < 100){
        return; 
    }

    //check location 
    if(b.strategy == "spread"){
        if(character.name == all_fighters_names[0]){
            let d = getDistance(character,b.location)
            if(d < 100){
                return; 
            } 
        } else if (character.name == all_fighters_names[1]){
            let d = getDistance(character, b.location1)
            if (d < 100) {
                return;
            } 
        } else if (character.name == all_fighters_names[2]) {
            let d = getDistance(character, b.location2) //todo: make this better so that it detects melee users. 
            if (d < 500) {
                return;
            } 
        }
    }

    if (!smart.moving && !smart.pathing ) {
        // game_log(mobs_to_farm[0]);
        if (mobs_to_farm[0] == "snake") {
            if (character.map != "halloween") {
                await smart_move("halloween")
            } else {
                if(character.name == "MoyaTesh" || character.name == "BandyAid"){
                    await smart_move({ map: "halloween", x: -392, y: -327 })
                } else {
                    await smart_move({ map: "halloween", x: 327, y: -736 })
                }
            }
        } else if (mobs_to_farm[0] == "bbpompom" && character.map== "wintercave"){
            await smart_move({ map: "wintercave", x: 4, y: -45 })
        } else if (mobs_to_farm[0] == "stoneworm" && (character.map != "halloween" && character.map != "spookytown")){
            await smart_move("halloween")
        } else if (mobs_to_farm[0] == "rat" && character.map == "mansion") {
            if (character.name == "MoyaTesh") {
                await smart_move({ x: -290, y: -424 })
            } else if (character.name == "Bandyaid") {
                await smart_move({x: 247, y: -424 })
            } else {
                await smart_move({x: 0, y: -162 })
            }
        } else {
            await smart_move(bestiary[mobs_to_farm[0]].location);
        }
        getNewtarget(); 

    }
}
/* ----------------------------------------------------------------
 * Movement
 * --------------------------------------------------------------*/
//used to move towareds target
function move_to_target(target) {
    if (target) {
        if (!smart.moving && !smart.pathing && target != null && can_move_to(target.x, target.y) && getDistance(character, target) > character.range) {
            moveAttempts = 0; 
            move(
                character.x + (player.target.x - character.x) / 2,
                character.y + (player.target.y - character.y) / 2
            );
        } else {
            if (!smart.moving && !smart.pathing) {
                //implement a conditional to move to smart move to the target
                //based on certain conditions. 
                if(all_fighters_names.includes(target.name)){
                    smart_move(target); 
                } else {
                    move_to_farming_loc();
                }
                // 
                // if(getDistance(character, target) < 400  && character.map == target.map || all_fighters_names.includes(player.target.name)){
                //     smart_move({ x: target.x, y: target.y })
                // } else {
                //     if (moveAttempts > 2 || all_fighters_names.includes(player.target.name)){
                //         if (character.map == target.map) {
                //             smart_move({ x: target.x, y: target.y })
                //             moveAttempts = 0; 
                //         }
                //     } else {
                //         moveAttempts++;
                //         move_to_farming_loc();
                //         // getNewtarget();
                //     }

                // }  if (character.map != tBeast.location.map || getDistance(character, tBeast.location) > 600) {
                // getNewtarget(); 
                // }
                // }
            }
        }
    }

}

function setFriendlyTargets(friendlyTargets){
    this.friendlyTargets = friendlyTargets;
}

function setPartyTargets(pTargets){
    this.partyTargets = pTargets;
}

//todo: create cm's that will call for others to help. 
async function priestAttackLoop() {
    let target = get_targeted_monster();
    let cd = 1; 
    skill="attack"
    try {
        if(!target){
            // game_log("test")
            getNewtarget(); 
        } else {
            if (can_attack(target)) {
                if (player.friendlyTargets.length > 0) {
                    // setTarget(friendlyTargets[0])
                    if(!all_fighters_names.includes(target.name)){
                        target = player.friendlyTargets[0]
                        change_target(target);
                    }

                    if (getDistance(character, target) > character.range) {
                        // game_log (distance(character, target)); 
                        // game_log("character=" + character.name + "friendly target not in-range");
                        move_to_target(target); //move to the target to heal. 
                    } else {
                        try {
                            if (!is_on_cooldown("heal")) {
                                if (target.max_hp - target.hp < 500) {
                                    getNewtarget();
                                }
                                cd = character.attack;
                                skill = "heal"
                                await use("heal");

                                // reduce_cooldown("heal", Math.min(...parent.pings))
                            }
                        } catch (e) {
                            game_log("error=priestAttackLoopInner")
                        }

                    }

                }
                else if (character.mp > 40) {
                    await attack(target)
                    reduce_cooldown("attack", Math.min(...parent.pings))
                }
            }
        }

    } catch (e) {
        game_log("error=priestAttackLoop")
    }
    setTimeout(priestAttackLoop, Math.max(cd, ms_to_next_skill(skill)))
}



function setMobsToFarm(mobs){
    this.mobs_to_farm = mobs;
}

function getLocLocal(c){
    c = localStorage.getItem(c + "Location").split(",")
    c = {
        map: c[0],
        x: parseInt(c[1]),
        y: parseInt(c[2])
    }
    return c; 
}

//returns the distance from all 
function getLocLocalFighters() {
    dArray = []

    for(f of all_fighters_names){
        localF = getLocLocal(f)
        if(localF.map != character.map){
            dArray.push(1000)
        } else {
            dArray.push(getDistance(character, getLocLocal(f)));
        }
    }
    return (Math.max.apply(null, dArray));
}

function isSmartMoving(){
    if(smart.moving || smart.pathing){
        return true;
    }
    return false;
}





