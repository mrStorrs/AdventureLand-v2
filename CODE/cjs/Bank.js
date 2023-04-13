function go_check_bank(){
    var banksToCheck = ["items3", "items2", "items1"]

    items = character.items 
    if(character.map != "bank"){
        smart_move("bank"); 
        merchant.status = "banking";
        set_message("banking");
        return false; 
    } else {
        for(i = 0; i < character.isize; i++){
            item = items[i];
            if(item != null && item.name in merchant.items_to_bank){
                bank_store(i, merchant.items_to_bank[item.name], )
            }
        }
        merchant.bank_items = character.bank

        for(bank of banksToCheck){
            var c_items = {};
            for (key in compound_item) {
                c_items[key] = { 0: [0], 1: [0], 2: [0], 3: [0], 4: [0], 5: [0] }
            }
            items = character.bank[bank]
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
            for (item in c_items) {
                for (i = 0; i <= 5; i++) {
                    if (c_items[item][i].length > 3) {
                        //last paremter needs to be modified to use 
                        if(character.esize > 3){
                            bank_retrieve(bank, c_items[item][i][1])
                            bank_retrieve(bank, c_items[item][i][2])
                            bank_retrieve(bank, c_items[item][i][3])
                        }
                    }
                }
            }
        }

        merchant.bank_items = character.bank;
        set_message("Bored!")
        merchant.status = "Bored!"
        smart_move(merchant.resting_location); 
        return true; 
    }
}