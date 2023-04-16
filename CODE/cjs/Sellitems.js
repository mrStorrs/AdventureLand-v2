var itemsToSell = ["wbreeches", "gloves1", "helmet1", "coat1", "pants1", "shoes1"]
async function sellJunk(){
    try{
        if (distance(character, find_npc("newupgrade")) < 200) {
            for(item of itemsToSell){
                itemIndex = locate_item(item);
                if(itemIndex >= 0){
                    if(character.items[itemIndex].p == undefined){
                        itemSellResult = await sell(itemIndex, 1);
                        if(itemSellResult.success){
                            game_log("action=sellItem " + "goldReceived=" + itemSellResult.gold + " itemSold=" + itemSellResult.name);
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