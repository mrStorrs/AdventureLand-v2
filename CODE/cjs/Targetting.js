//ideas
//have a loop that is constantly going not just when called. 
//  this loop will create a targets array that can be pulled 
//  from anytime there is no target.
//  + there also needs to be a logic check to see if there is a 
//  + closer target when having to move 
//      - this could be done in the (!is_in_range) check. if not before moving we could
//        check for closer targets. (this would need to be only allowed for oneshot/spread tactics.)
//  + 50-100ms should be fine. 

/** Logic
 * + constantly building the target array. 
 * + when we need a new target grab from array. 
 *      - if no array then we will smart move to location.
 *      - potentially put in some kind of anchor in case we get
 *      - to far away from our targets. 
 *  + have a built in (can_move_to) to buildng the target array to avoid
 *  + grabbing targets that are too far away
 */

var safeMobs = ["snake", "osnake", "rat", "goo", "bee", "arcticbee"]
var lowHealth = .75
var timeToWait = 15
async function buildTargetsLoop(includeTargeted) {
    let timeout = 20; //we could set this up to run on different intervals based on who 
    //the c is to improve double targetting on oneshot enemies. 

    let entities = Object.values(parent.entities); //grab nearby entities
    let tempTargets = [] //holds all viable monster targets
    let tempFriendlyTargets = [] //holds targets nearby that are friends. 
    let tempNearbyPartyTargets = [] //holds explicityly party targets
    let tStrat = ""

    try {
        for (t of entities) {
            if (t.mtype == "wabbit") {
                continue; //don't target wabbit. its a waste of time. 
            }

            //target is attacking us so we know we want to fight. 
            if (t.target == character.name && t.type == "monster") {
                t.attacking++;
                tempTargets.push(t);
                continue;
            }

            //the target is included in our attack whitelist. 
            if (mobs_to_farm.includes(t.mtype)) {
                tStrat = bestiary[t.mtype].strategy;  //get the strat of the target mob

                //mob is dangerous overide strategy if not a safe strat. 
                // if (t.hp > 5000 && !safeMobs.includes(t.mtype)) {
                //     localStorage.setItem("dangerousTargetFound", new Date / 1000)
                //     localStorage.setItem("gCombatState", "tank")
                //     t.attacking++;
                //     tempTargets.push(t);
                //     continue;
                // }

                //define our mobpuller based on target combat strat. 
                tPuller = tStrat == "pull" ? mobPuller : "SliceNdice"

                if (localStorage.getItem("gCombatState") == "tank" || tStrat == "tank" || tStrat == "pull") {
                    if (all_fighters_names.includes(target.target)) {
                        t.attacking++;
                        tempTargets.push(t)
                        continue;
                    }

                    if (character.name == tPuller || t.hp < character.attack) {
                        //wait untill we are fully grouped up to create targets. 
                        dFromFurthestFighter = getLocLocalFighters();
                        if (dFromFurthestFighter < 250) {
                            tempTargets.push(t);
                        }

                    }
                //not in tanking mode make sure target is not being targetd. 
                } else if (includeTargeted || !is_targeted(t)) {
                    tempTargets.push(t);
                }
            } else if (t.name == merchant) {
                time_now = new Date() / 1000;
                if (time_now - last_send > 3) {
                    send_items(t);
                    last_send = new Date() / 1000;
                }
            } else if (all_fighters_names.includes(t.name) && t.hp < t.max_hp * lowHealth) {
                tempFriendlyTargets.push(t);
            }

            //check if we need to remove the dangerous state. 
            if ((new Date / 1000) - (parseInt(localStorage.getItem("dangerousTargetFound"))) > 30
                && localStorage.getItem("gCombatState") == "tank") {
                game_log("action=clearingTankCombatState");
                localStorage.setItem("gCombatState", "")
            }
        }

        //There was a bug where there was an invisible leftover mob i couldnt attack.
        //this should grab a new target if there is an uncleared mob. 
        //this could be dangeroud since it will switch targets when 
        //fighting mobs with lots of hp. it will only switch 
        if(tStrat == "spread" || tStrat == "oneshot"){
            timeToWait = 5; 
        } 

        //sort by distance from me
        tempTargets.sort(function (current, next) {

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

        tempFriendlyTargets.sort(function (current, next) {
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

        //set player values;
        player.targets = tempTargets;
        player.friendlyTargets = tempFriendlyTargets;
        target = get_targeted_monster();
        if(!target){
            //attmept to target a monster we can
            //actually move too. 
            for (t of tempTargets){
                if(can_move_to(t)){
                    target = t;
                    player.target = target;
                    change_target(target);
                    timeTargetAquired = new Date / 1000; 
                    break;
                } else {
                    tempTargets.shift();
                }
            }
            //no moveable targets found. shift to target
            //so smart move will kick in
            target = get_targeted_monster();
            if(!target){
                target = player.targets[0];
                player.target = target;
                change_target(target);
                timeTargetAquired = new Date / 1000;
            }
        }

        if (new Date / 1000 - timeTargetAquired > timeToWait) {
            // move_to_farming_loc();
            getNewtarget();
        }

    } catch (e) {
        game_log("error=buildTargetsLoop");
        show_json(e);
        game_log(e);
    }
    setTimeout(buildTargetsLoop, timeout)

}
setTimeout(buildTargetsLoop(), 10000)


/**
 * + need some kind of error check in case the array is wrong. 
 */
function getNewtarget() {
    //eventually this should be moved to top of file
    let tBeast = bestiary[mobs_to_farm[0]]

    //Does anyone need some healing?. 
    if (character.ctype == "priest") {
        if (player.friendlyTargets.length > 0) {
            //have a friendly target too. 
            player.target = player.friendlyTargets[0]
            change_target(player.target)
            return;
        }
    }

    if (player.targets.length > 0) {
        // game_log("you are here.")
        target = player.targets[0]
        player.target = target;
        change_target(target);
        player.targets.shift();
    } else if (character.map != tBeast.location.map || getDistance(character, tBeast.location) > 600) {
        move_to_farming_loc();
    }
}