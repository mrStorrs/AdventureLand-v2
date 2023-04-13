var merchant_name; //will be set in send_items function
var slot_to_start = 4;

function send_items(merchant) {
    merchant_name = merchant.name;

    if (distance(character, merchant) < 350) {
        if (character.esize < 36 && character.esize != 40) {
            send_to_merchant(slot_to_start, merchant_name);
        }
    } else {
    }
}

//send everything starting at the index given
function send_to_merchant(index, merchant_name) {
    for (i = index; i <= character.isize; i++) {
        if (character.items[i] != null) { //make sure slot is not empty.
            send_item(merchant_name, i, 999);
            //send gold
            send_gold(merchant_name, character.gold - 100000);
        }
    }
}

