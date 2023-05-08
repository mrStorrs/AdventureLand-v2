var itemsToSell = ["wbreeches", "gloves1", "helmet1", "coat1", "pants1", "shoes1"]
async function sellJunk(){
    try{
        if (distance(character, find_npc("newupgrade")) < 200) {
            for(i = 0; i < character.isize; i++){
                let item = character.items[i];
                if(item != null && item != undefined && itemsToSell.includes(item.name)){
                    if(item.p == undefined){
                        itemSellResult = await sell(i, 1);
                        if(itemSellResult.success){
                            game_log("action=sellItem " + "goldReceived=" + itemSellResult.gold + " itemSold=" + itemSellResult.item.name);
                        } else {
                            game_log("action=sellItem " + "itemSellFailed=" + itemSellResult.reason);
                        }
                    }
                }
            }
        }
    } catch(e){
        game_log("error=sellJunk")
    }
}