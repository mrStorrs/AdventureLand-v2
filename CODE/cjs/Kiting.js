// function runPathfinding(start, nodes, aiLocations, safeDistance, maxDistance, pathLength) {
function runPathfinding(start, aiLocations, safeDistance, maxDistance, pathLength) {
    startTime = new Date(); 
    // game_log(start.x)
    // game_log(start.y)
    // start = findClosestNode(start, nodes); //make me work biatch
    // // show_json(nodes); 

    // game_log(start.x)
    // game_log(start.y)
    // // game_log(nodes)
    // // game_log(aiLocations)
    // game_log(safeDistance)
    // game_log(maxDistance)
    // game_log(pathLength)

    // if(nodes.length < 2){
    //     return null; 
    // }
    // Find the safest node
    // let safestNode = null;
    // let lowestRisk = Infinity;


    // game_log(nodes)
    // for (let node of nodes) {
    //     if (getDistance(start, node) > maxDistance) {
    //         continue; // Skip nodes that are too far away
    //     }
    //     let risk = getRisk(node, aiLocations, safeDistance, pathLength);
    //     if (risk < lowestRisk) {
    //         safestNode = node;
    //         lowestRisk = risk;
    //     }
    // }

    // If no safe nodes are found, return null
    // if (!safestNode) {
    //     return null;
    // }

    // Find the path from start to safest node
    let path = findPath(start, aiLocations, safeDistance, maxDistance, pathLength);

    // game_log("12091301283091823")
    // show_json(path);
    // game_log(new Date () - startTime)
    return path;
}

async function getValidCoordinates(start, distance_to_calculate) {
    const valid_coordinates = [];
    const x_start = start[0];
    const y_start = start[1];

    for (let x = x_start - distance_to_calculate; x <= x_start + distance_to_calculate; x++) {
        for (let y = y_start - distance_to_calculate; y <= y_start + distance_to_calculate; y++) {
            const coordinates = [x | 0, y | 0];
            const distance = Math.abs(x - x_start) + Math.abs(y - y_start);
            // await new Promise((resolve) => setTimeout(resolve, 1)); // add a 2ms delay
            if (distance <= distance_to_calculate && can_move_to(coordinates)) {
                valid_coordinates.push(coordinates);
            }
        }
    }

    character.nodes = valid_coordinates;
    // game_log(character.nodes);
    // game_log(valid_coordinates);
    // game_log(new Date() - coorTimeStart);
    return valid_coordinates;
}




function findPath(start, aiLocations, safeDistance, pathLength, maxDistance) {
    let openList = [];
    let closedList = [];


    // let startNode = {
    //     x : start[0],
    //     y : start[1],
    // }
    // let endNode = {
    //     x : end[0],
    //     y : end[1]
    // }
    let startNode = start;
    // let endNode = end; 

    // let startNode = nodes.find(node => node.x === start[0] && node.y === start[1]);
    // let endNode = nodes.find(node => node.x === end[0] && node.y === end[1]);

    startNode.g = 0;
    startNode.h = 0;
    startNode.f = 0;

    openList.push(startNode);

    while (openList.length > 0) {



        // let currentNode = openList[0];
        // let currentIndex = 0;
        // for (let i = 1; i < openList.length; i++) {
        //     if (openList[i].f < currentNode.f) {
        //         currentNode = openList[i];
        //         currentIndex = i;
        //     }
        // }
        // openList.splice(currentIndex, 1);

        // Find the node with the lowest f-score
        const currentNode = openList.reduce((minNode, node) =>
            node.f < minNode.f ? node : minNode
        );

        openList.splice(openList.indexOf(currentNode), 1);
        closedList.push(currentNode);

        // game_log("#############")
        // game_log(currentNode.x)
        // game_log(endNode.x)
        // game_log(currentNode.y)
        // game_log(endNode.y)
        if (closedList.length >= pathLength) {
            // game_log("weeee maddde it")
            // show_json(closedList);
            return getPath(currentNode);
        }

        // currentNode.neighbors = getNeighbors(currentNode, nodes, aiLocations, safeDistance);
        neighbors = getNeighbors(currentNode, aiLocations, safeDistance);
        // game_log("boobs")

        for (neighbor of neighbors ) {
            // if (closedList.includes(neighbor)) {
            if (isInList(closedList, neighbor)) {
                continue;
            }

            //this may need some working. should have a cost factor
            let tentativeGScore = currentNode.g + getDistance(currentNode, neighbor);

            // if (!openList.includes(neighbor) || tentativeGScore < neighbor.g) {
            if (!isInList(openList, neighbor) || tentativeGScore < neighbor.g) {
                neighbor.parent = currentNode;
                neighbor.g = tentativeGScore;
                neighbor.h = heuristic(neighbor, currentNode);
                neighbor.f = neighbor.g + neighbor.h;
                // openList.push(neighbor);

                if (!isSafeDistance(neighbor, aiLocations, safeDistance)) {
                    neighbor.f += 5;
                } else if (isPastMaxDistance(neighbor, aiLocations, maxDistance)){
                    neighbor.f += 10; 
                }

                if(!isInList(openList, neighbor)){
                    openList.push(neighbor);
                }
            } 

            if (closedList.length >= pathLength ){
                return getPath(currentNode);
            }



            // If the neighbor is not in the open list, add it
            // if (!openList.includes(neighbor)) {
            //     openList.push(neighbor);
            // } else if (tentativeGScore >= neighbor.gScore) {
            //     // If the tentative g-score is higher than a previously calculated g-score, skip it
            //     continue;
            // }

            // neighbor.parent = currentNode;
            // neighbor.g = tentativeGScore;
            // neighbor.h = heuristic(neighbor, endNode);
            // neighbor.f = neighbor.g + neighbor.h;

            // if (!isSafeDistance(neighbor, aiLocations, safeDistance)) {
            //     neighbor.f += (safeDistance * 2);
            // } 
        }
        // if(neighbor == undefined){
        //     show_json(closedList);
        //     return closedList
        // } else {
        //     openList.push(neighbor);
        // }

    }

    // game_log("8888888888888")
    // show_json(openList)
    // game_log("999999999999")
    // show_json(closedList)
    // return getPath(currentNode); //this is diff than normal
    return null; 
}

function heuristic(current, goal) {
    // calculate Manhattan distance between current and goal nodes
    const dx = Math.abs(current.x - goal.x);
    const dy = Math.abs(current.y - goal.y);
    return dx + dy;
}

function getNeighbors(node, nodes, aiLocations, safeDistance) {
    let neighbors = [];

    // Define possible movements
    const directions = [
        [0, 20], // Up
        [20, 0], // Right
        [0, -20], // Down
        [-20, 0] // Left
    ];

    // Check all possible movements from the current node
    for (let direction of directions) {
        // Get the coordinates of the potential neighbor
        let neighborX = node.x + direction[0];
        let neighborY = node.y + direction[1];

        // let nNode = [neighborX, neighborY]
        // game_log(nNode)
        // game_log(nodes)

        //check if the neighbor is not a valid node
        //optimize l8r
        // validNode = false; 
        // for (node of nodes){
        //     if(node[0] == neighborX && node[1] == neighborY){
        //         // game_log("yay******************")
        //         validNode = true; 
        //         break; 
        //     }
        // }
        // game_log("yay******************")

        // if(!validNode){
            // game_log("nay******************")
        //     continue;
        // }

        // // Check if the neighbor is a valid node
        // if (nodes.includes(nNode)) {
        //     continue;
        // }

        // Check if the neighbor is safe from AI

        let neighborNode = {
            x: neighborX,
            y: neighborY,
            parent: node
        }

        // if (isSafeDistance(neighborNode, aiLocations, safeDistance)) {
            // neighbors.push(neighborNode);
        // }

        if(can_move_to(neighborX, neighborY)){
            neighbors.push(neighborNode); 
        }
    }

    return neighbors;
}

function isInList(list, node) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].x == node.x && list[i].y == node.y) {
            return true;
        }
    }
    return false;
}

function getPath(currentNode) {
    const path = [currentNode];
    while (currentNode.parent) {
        path.push(currentNode.parent);
        currentNode = currentNode.parent;
    }
    return path;//this was reverse but we actually want the path reversed so we can use the last then pop after.
}

// function getPath(node) {
//     const path = [node];
//     while (node.parent) {
//         node = node.parent;
//         path.unshift(node);
//     }
//     return path;
// }

function removeFromList(list, node) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].x === node.x && list[i].y === node.y) {
            list.splice(i, 1);
            return;
        }
    }
}

function getDistance(nodeA, nodeB) {
    // Diagonal distance (Euclidean distance)
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dy = Math.abs(nodeA.y - nodeB.y);
    return Math.sqrt(dx * dx + dy * dy);
}

// function getDistance(nodeA, nodeB) {
//     const dx = Math.abs(nodeA.x - nodeB.x);
//     const dy = Math.abs(nodeA.y - nodeB.y);

//     const diagonal = Math.sqrt(dx * dx + dy * dy);

//     // Manhattan distance
//     // const straight = Math.abs(dx - dy);

//     // Return diagonal distance as heuristic
//     // return straight;
//     return diagonal;
// }

function isSafeDistance(node, aiLocations, safeDistance) {
    for (let i = 0; i < aiLocations.length; i++) {
        if (getDistance(node, aiLocations[i]) < safeDistance) {
            return false;
        }
    }
    return true;
}

function isPastMaxDistance(node, aiLocations, maxDistance) {
    for (let i = 0; i < aiLocations.length; i++) {
        if (getDistance(node, aiLocations[i]) > maxDistance) {
            return true;
        }
    }
    return false;
}

function getRisk(node, aiLocations, safeDistance, pathLength) {
    let risk = 0;
    for (let ai of aiLocations) {
        let distance = getDistance(node, ai);
        if (distance < safeDistance) {
            risk += (safeDistance - distance) / pathLength;
        }
    }
    return risk;
}

function findClosestNode(start, nodes) {
    let closestNode = nodes[0];
    let closestDistance = getDistance(start, closestNode);

    for (let i = 1; i < nodes.length; i++) {
        game_log(nodes[i].x + " ," + nodes[i].y)
        let distance = getDistance(start, nodes[i]);
        if (distance < closestDistance) {
            closestNode = nodes[i];
            closestDistance = distance;
        }
    }
    return closestNode;
}