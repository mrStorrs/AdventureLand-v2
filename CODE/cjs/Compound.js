//enter the items and desired level here, and rarity
// 1 = store bought. 2 = common. 3 =rare.
// 'nameOfItem' : [*level*, *rarity*]
var compound_item = {
    'ringsj': [4, 1],
    'intamulet': [3, 1],
    'stramulet': [3, 1],
    'dexamulet': [3, 1],
    'hpamulet': [3, 1],
    'intring': [4, 1],
    'dexring': [4, 1],
    'strring': [4, 1],
    'vitring': [4, 1],

}
var scroll_index = 2;

async function getCompoundInfo(upgradeItem, upgradeScroll, itemName) {
    try {
        const resultChance = await upgrade(upgradeItem, upgradeScroll, null, true); //getting the chance hence the true at the end
        const result = await upgrade(upgradeItem, upgradeScroll, null, false)
        game_log("character=" + character.name
            + " action=upgrade"
            + " upgradeItem=" + itemName
            + " upgradeItemLevel=" + result.level
            + " upgradeResult=" + result.success
            + " upgradeChance=" + resultChance.chance)
    } catch (e) {
        game_log("error=getCompoundInfo")
    }


    return;
}

//this will be the logic for the compounding
async function compound_items(index1, index2, index3, rarity) {
    try{

        if (distance(character, find_npc("newupgrade")) > 300) {
            if (!smart.moving) {
                await smart_move(merchant.resting_location); //move to upgrade loc
            }
        } else { //upgrade  
            itemName = character.items[index1];
            resultChance = await compound(index1, index2, index3, scroll_index, null, true);
            result = await compound(index1, index2, index3, scroll_index, null, false)
            game_log("character=" + character.name
                + " action=compound"
                + " compoundItem=" + resultChance.item.name
                + " compoundItemLevel=" + result.level
                + " compoundResult=" + result.success
                + " compoundChance=" + resultChance.chance)
    
            set_message("Bored!");
            merchant.status = "Bored!"
        }
    } catch (e){
        game_log("error=compound_items")
    }
    return null;
}

function go_compound() {
    items = character.items //set items (easier to type)

    //check if need basic compound scrolls
    if (numItems("cscroll0") < 10) {
        buy('cscroll0', 100);
    }

    if (numItems("cscroll1") < 10) {
        buy('cscroll1', 100);
    }
    //loop that creates a dictionary for 
    //each item in the list of items to compound.
    //this will hold each compoundable item by its level
    var c_items = {};
    for (key in compound_item) {
        c_items[key] = { 0: [0], 1: [0], 2: [0], 3: [0], 4: [0], 5: [0] }
    }

    for (i = 3; i < items.length; i++) {

        if (items[i] != null) { //check if item present in inv slot.
            //check if needs to be upgraded.
            if (items[i].name in compound_item &&
                //this may need to be refactored look into later
                //may have a problem with more than 1 item in list
                compound_item[items[i].name][0] > items[i].level) {
                //additem to dictionary using it's name and key as the key
                c_items[items[i].name][items[i].level].push(i);
            }

        }
    }

    //check each item dict to see if there is items that can be compounded.
    var compounding = false; 
    for (item in c_items) {
        for (i = 0; i <= 5; i++) {
            if (c_items[item][i].length > 3) {
                //last paremter needs to be modified to use 
                compounding = true; 
                game_log(c_items[item][i]);
                if (items[c_items[item][i][1]].level >= 3) {
                    scroll_index = 4;
                    game_log("upping scroll index");
                }

                if (character.q.compound == undefined){
                    compound_items(c_items[item][i][1]
                        , c_items[item][i][2]
                        , c_items[item][i][3], 0);
                }
            }
        }
    }
    if (compounding) {
        set_message("compounding");
        merchant.status = "compounding"
    } else {
        set_message("Bored!");
        merchant.status = "Bored!"
    }
}


