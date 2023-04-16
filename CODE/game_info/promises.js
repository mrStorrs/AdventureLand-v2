//sell item
show_json {
    "gold": 9360,
        "item": {
        "name": "wbreeches",
            "level": 0
    },
    "success": true,
        "response": "gold_received",
            "place": "sell"
}

//exchange item success
show_json {
    "success": true,
    "reward": "pants1",
    "num": 8
}

//echange item failure
show_json {
    "response": "distance",
    "place": "exchange",
    "failed": true,
    "reason": "distance"
}