/* ----------------------------------------------------------------
 * Restock Players
 * --------------------------------------------------------------*/

//get the merchant object from config script
merchant = get_current_player();
fighters = get_player_names().fighters;

function restock(fighter) {
    if (distance(character, fighter) < 400) {
        // game_log("fighter in range to restock");
        send_cm(fighter.name, "restock");
    } else {
        // game_log("fighter too far away to restock")
    }
    // game_log("restock started");
}

/* ----------------------------------------------------------------
 * On message from fighters for restock
 * --------------------------------------------------------------*/
character.on("cm", function (m) {
    if (fighters.includes(m.name)) {
        //send back the amount of gold currently held
        if (m.message == "mana") {
            send_item(m.name, locate_item("mpot1"), 2000);
        }
        if (m.message == "health") {
            send_item(m.name, locate_item("hpot1"), 2000);
        }
    }
})