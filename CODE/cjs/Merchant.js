/* ----------------------------------------------------------------
 * Main Merchant Script and interval here.
 * --------------------------------------------------------------*/

//get the merchant object from config script
merchant = get_current_player();
fighters = get_player_names().fighters;

bored_spot = [-107, -50]
//load in fighters to run
for (var name of fighters) {
    start_character(name, "1");
};

function get_gold() {
    for (var name of fighters) {
        send_cm(name, "gold");
    }
};

merchant.status = "Bored!"
// function collect(name){
//     send_cm(name, "getLocation");

//     // if (mob_being_farmed == "snake") {
//     //     if (character.map != "halloween") {
//     //         smart_move("halloween")
//     //     } else {
//     //         smart_move(mob_being_farmed)
//     //     }
//     // } else {
//     //     smart_move(mob_being_farmed); //move to mob location.
//     // }
//     set_message("collecting");
//     merchant.status = "collecting"
// }

//set items to compound and upgrade.
items_to_upgrade = merchant.items_to_upgrade;
items_to_compound = merchant.items_to_compound;

//set keyboard snippet shortcuts currently broken
//parent.keymap["4"].code = "smart_move('arcticbee')"
//parent.keymap["5"].code = "change_server('EU', 'PVP')"
//parent.keymap["6"].code = "change_server('US', 'III')"

//set the time of last collection (used for getting items from fighters.)
last_collection  = new Date() / 1000 ; //can subtract time from here if we want to trigger immedietly. 
checked_bank = false; 
//get mob that is being farmed
mob_being_farmed = get_mob();

character.on("cm", function (m) {
    if (fighters.includes(m.name)) {
        //send back the amount of gold currently held
        if (m.message.action == "sendLocation") {
            if(merchant.status != "collecting" && merchant.status != "compounding" && character.esize > 4){
                set_message("collecting");
                merchant.status = "collecting"
                // set_merchant(merchant);
                game_log("error msg here");
                smart_move({map:m.message.map,x:m.message.x,y:m.message.y});
                last_collection = new Date() / 1000; //reset last collection time.
                checked_bank = false; 
            }
        }
    }
})

//main interval
setInterval(function () {
    //set the current time in seconds
    current_time = new Date() / 1000; //convert to seconds

    //check if need to heal!
    if (character.hp < character.max_hp - 100) {
        use('regen_hp');
    }
    //curently set to use the skill, not potions
    if (character.mp < character.max_mp - 100) {
        use('regen_mp');
    }

	//activate stand when not moving
    if (!character.stand && !smart.moving && !smart.pathing) {
        parent.open_merchant(3);
    } else if (character.stand != false && smart.moving || smart.pathing) {
        parent.close_merchant(3);
    }

    if (!smart.moving && !smart.pathing) {
        // set_message("Bored!");
        // merchant.status = "Bored!"
        // set_merchant(merchant); 

        if(merchant.status == "banking"){
            checked_bank = go_check_bank(); // run check banking  
        }
        if (character.q.compound == undefined && merchant.status != "upgrading" && merchant.status !=  "banking") {
            go_compound();
        } 
        if (character.q.upgrade == undefined && merchant.status != "compounding" && merchant.status != "banking") {
            go_upgrade();
        }

        if (distance(character, find_npc("newupgrade")) > 300) {
            if (numItems("mpot1") < 9000) {
                buy("mpot1", 9000 - numItems("mpot1"));
            }
            if (numItems("hpot1") < 9000) {
                buy("hpot1", 9000 - numItems("hpot1"));
            }
        }
        if (merchant.status == "Bored!"){
            if(!checked_bank){
                go_check_bank();
            } else if (character.x != -107 && character.y != -50){
                smart_move({ map: "main", x: -107, y: -50 })
            }
        }

    }

    // if (numItems("bow") < 1 && (distance(character, find_npc("newupgrade")) < 300) && character.gold > 100000000) {
    //     buy("bow", 1);
    // }

    //go to location of mob to collect items every 15 minutes
    if (current_time - last_collection > 900 && !smart.moving && !smart.pathing) {
        send_cm(fighters[0], {action : "getLocation"}); //send msg to get location to move too. 

        // if(mob_being_farmed == "snake"){
        //     if(character.map != "halloween"){
        //         smart_move("halloween")
        //     } else {
        //         smart_move(mob_being_farmed)
        //     }
        // } else {
        //     smart_move(mob_being_farmed); //move to mob location.
        // }

    }

    //return to mainland
    if (get_map().name != "Mainland" && !smart.moving) {
        game_log(get_map().name);
        smart_move(merchant.resting_location);
    }

    /* ----------------------------------------------------------------
    * Targeting Logic.
    *
    * --------------------------------------------------------------*/
    function filterMonsters(monster) {
        //target first monster in array (changing later)
        if (fighters.includes(monster.name)) {
            return true;
        } else {
            return false;
        }
    }
    //create an array holding the filtered monsters
    var monsters = Object.values(parent.entities).filter(filterMonsters);

    if (monsters.length > 0) {
        for (i = 0; i < monsters.length; i++) {
            if (monsters[i].s.mluck == undefined) {
                change_target(monsters[i]);
                use_skill("mluck", monsters[i]);
            } else if ((monsters[i].s.mluck.ms / 1000) < 50) {
                change_target(monsters[i]);
                use_skill("mluck", monsters[i]);
            }

            //check for restocks
            if (fighters.includes(monsters[i].name)) {
                restock(monsters[i]);
                // game_log("testing restock");
            }
        }

    }

}, 1000);