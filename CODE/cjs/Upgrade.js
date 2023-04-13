
/* ----------------------------------------------------------------
 * @todo -  move item check/ search to main "Merchant" script and only
 *          leave the actual functions to do the combining/upgrading here
 * @todo -  modify the scripts to be state dependendent so that it is not 
 *          just spamming upgrade/compound. 
 * @todo -  Improve the locate_item command with something more efficient. 
 *          Maybe a sliding window technique
 * --------------------------------------------------------------*/


//method to upgrade items
function upgrade_item(item_index, cur_lev, rarity, itemName) {
    if (distance(character, find_npc("newupgrade")) > 200) {
        if (!smart.moving) {
            // game_log('test');
            smart_move(merchant.resting_location); //move to upgrade loc
        }
    } else { //upgrade

        //check if need basic scrolls
        if (numItems("scroll0") < 10) {
            buy('scroll0', 1);
        }
        if (numItems("scroll1") < 10) {
            buy('scroll1', 1);
        }
        if (numItems("scroll2") < 10 && character.gold > 100000000) {
            buy('scroll2', 1);
        }

        if (!is_on_cooldown("massproduction") && character.mp > 50){
            use("massproduction")
        }
        //check if rarity and level matches
        if (rarity == 1){
            if(cur_lev > 8){
                getUpgradeChance(item_index, locate_item("scroll2"), itemName);
                // upgrade(item_index, locate_item("scroll2"));
            }
            if(cur_lev > 6){ //max level for first scroll is 6
                getUpgradeChance(item_index, locate_item("scroll1"), itemName);
                // upgrade(item_index, locate_item("scroll1"));
            } else {
                getUpgradeChance(item_index, locate_item("scroll0"), itemName);
                // upgrade(item_index, locate_item("scroll0"));
            }
        }

        if (rarity == 2) {
            if(cur_lev > 4){
                getUpgradeChance(item_index, locate_item("scroll1"), itemName);

                // upgrade(item_index, locate_item("scroll1"));
            } else {
                // upgrade(item_index, locate_item("scroll0"));
                getUpgradeChance(item_index, locate_item("scroll0"), itemName);

            }
        }

        if (rarity == 3) {
            if (cur_lev > 7) {
                // upgrade(item_index, locate_item("scroll2"));
                getUpgradeChance(item_index, locate_item("scroll2"), itemName);

            } else {
                // upgrade(item_index, locate_item("scroll1"));
                getUpgradeChance(item_index, locate_item("scroll1"), itemName);

            }
        }
        // } else if (rarity == 3) {
        //     upgrade(item_index, 1);
        // } else {
        //     upgrade(item_index, 0);
        // }
    }
    return null;
}

function go_upgrade() {

    items = character.items; //set items (easier to type)

    //check if any items in inventory need upgrading
    //starts at 1 because I keep scrolls from 0-1. change as needed.
    var upgrading = false; 
    for (i = 1; i < items.length; i++) {

        if (items[i] != null) { //check if item present in inv slot.

            //check if needs to be upgraded.
            if (items[i].name in items_to_upgrade
                && items_to_upgrade[items[i].name][0] > items[i].level) {

                var upgrading = true; 
                //call upgrade item function
                upgrade_item(i, items[i].level,
                    items_to_upgrade[items[i].name][1]); //upgrade

                break; //end  when item found
            } else {

            }
        }
    }
    if(upgrading){
        // game_log("upgrading")
        set_message("upgrading");
        merchant.status = "upgrading"
    } else {
        set_message("Bored!");
        merchant.status = "Bored!"
    }
}

//can be implemented to send back chance. 
async function getUpgradeChance(upgradeItem, upgradeScroll, itemName) {
    try{

        const resultChance = await upgrade(upgradeItem, upgradeScroll, null, true); //getting the chance hence the true at the end
        const result = await upgrade(upgradeItem, upgradeScroll, null, false)
        game_log("character=" + character.name 
                + " action=upgrade" 
                + " upgradeItem=" + resultChance.item.name
                + " upgradeItemLevel=" + result.level
                + " upgradeResult=" + result.success
                + " upgradeChance=" + resultChance.chance
                + " upgradeScroll=" + resultChance.scroll)
    } catch (e) {
        game_log("error=getUpgradeChance")
    }

    return;
}