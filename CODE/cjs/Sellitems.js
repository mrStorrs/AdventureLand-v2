var itemsToSell = ["wbreeches"]
async function sellJunk(){
    try{
        if (distance(character, find_npc("newupgrade")) < 200) {
            for(item of itemsToSell){
                itemIndex = locate_item(item);
                if(itemIndex >= 0){
                    if(character.items[itemIndex].p == undefined){
                        itemSellResult = await sell(itemIndex, 1);
                        game_log("action=sellItem " + itemSellResult);
                        show_json(itemSellResult)
                    }
                }
            }
        }
    } catch(e){
        game_log("error=sellJunk")
    }
}