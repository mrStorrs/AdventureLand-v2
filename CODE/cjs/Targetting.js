//have a loop that is constantly going not just when called. 
//  this loop will create a targets array that can be pulled 
//  from anytime there is no target.
//  + there also needs to be a logic check to see if there is a 
//  + closer target when having to move 
//      - this could be done in the (!is_in_range) check. if not before moving we could
//        check for closer targets. (this would need to be only allowed for oneshot/spread tactics.)
//  + 50-100ms should be fine. 