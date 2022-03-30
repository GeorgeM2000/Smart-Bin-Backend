const fetch = require("node-fetch");


// Function to get the distance matrix from mapbox service
async function fetchJSON(api_coordinates_string, approaches) {
    return await fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${api_coordinates_string}${approaches}&access_token=pk.eyJ1IjoiZ2VvcmdlbTIwMDAiLCJhIjoiY2wwb2J2bWp2MGdjNDNpcGt4NGJmZXBpZiJ9.P74ZJhBAzDTQVQGo6-Joiw`)
        .then((res) => {return res.json()})
        .then((data) => {
            return data["durations"];
        });
  }

  


class Functions {
    constructor() {}


    // Parse JSON data from MySQL query
    parseSignUpQuery(request, queryResult, response) {

        let entryValidation = (validEntry, indexString) => {
            if(validEntry) { 
                response[indexString] = validEntry; 
                return true;
            }
            return false;
        }

        // Check if there is another user with at least one identical field
        for (const [key] of Object.entries(queryResult)) {
            if(entryValidation((queryResult[key]["username"] === request["username"]), "username")
                || entryValidation((queryResult[key]["password"] === request["password"]), "password")
                || entryValidation((queryResult[key]["email"] === request["email"]), "email")
                || entryValidation((queryResult[key]["fullName"] === request["fullName"]), "fullName")) {
                return true;
            }
        }
        return false;
    }


    // Permutations
    permutations(array, r) {                                                  
        var n = array.length;                                                          
        if (r === undefined) {                                                         
            r = n;                                                                     
        }                                                                              
        if (r > n) {                                                                   
            return;                                                                    
        }                                                                              
        var indices = [];                                                              
        for (var i = 0; i < n; i++) {                                                  
            indices.push(i);                                                           
        }                                                                              
        var cycles = [];                                                               
        for (var i = n; i > n - r; i-- ) {                                             
            cycles.push(i);                                                            
        }                                                                              
        var results = [];                                                              
        var res = [];                                                                  
        for (var k = 0; k < r; k++) {                                                  
            res.push(array[indices[k]]);                                               
        }                                                                              
        results.push(res);                                                             
                                                                                       
        var broken = false;                                                            
        while (n > 0) {                                                                
            for (var i = r - 1; i >= 0; i--) {                                         
                cycles[i]--;                                                           
                if (cycles[i] === 0) {                                                 
                    indices = indices.slice(0, i).concat(                              
                        indices.slice(i+1).concat(
                            indices.slice(i, i+1)));             
                    cycles[i] = n - i;                                                 
                    broken = false;                                                    
                } else {                                                               
                    var j = cycles[i];                                                 
                    var x = indices[i];                                                
                    indices[i] = indices[n - j];                          
                    indices[n - j] = x;                                   
                    var res = [];
                    for (var k = 0; k < r; k++) {                        
                        res.push(array[indices[k]]);                                   
                    }                                                                  
                    results.push(res);                                                 
                    broken = true;                                                     
                    break;                                                             
                }                                                                      
            }                                                                          
            if (broken === false) {                                                    
                break;                                                                 
            }                                                                          
        }                                                                              
        return results;                                                                
    } 
    
    // TTP(Traveling Salesman Problem). Get optimal path from source to all rubbish bins
    TTP(graph, s, V) {
        let vertex = [];
        for(let i=0; i<V; i++) {
            if(i !== s) {
                vertex.push(i);
            }
        }
        

        let route_path = {};
        let min_path = 9223372036854775807n;
        let next_permutation = this.permutations(vertex);
        
        next_permutation.forEach(i => {
            let current_pathweight = 0;
            let current_path = [];
    
            let k = s;
            i.forEach(j => {
                current_path.push(j);
                current_pathweight += graph[k][j];
                k = j;
            });
    
            current_pathweight += graph[k][s];

            if(current_pathweight < min_path) {
                min_path = current_pathweight;
                route_path[min_path] = current_path;
            }

        });

        return route_path[min_path];
    }

    // Distance between two points
    distance(lat1, lat2, lon1, lon2) {
        // The math module contains a function
        // named toRadians which converts from
        // degrees to radians.
        lon1 =  lon1 * Math.PI / 180;
        lon2 = lon2 * Math.PI / 180;
        lat1 = lat1 * Math.PI / 180;
        lat2 = lat2 * Math.PI / 180;

        // Haversine formula
        let dlon = lon2 - lon1;
        let dlat = lat2 - lat1;
        let a = Math.pow(Math.sin(dlat / 2), 2)
            + Math.cos(lat1) * Math.cos(lat2)
            * Math.pow(Math.sin(dlon / 2),2);
        
        let c = 2 * Math.asin(Math.sqrt(a));

        // Radius of earth in kilometers. Use 3956
        // for miles
        let r = 6371;

        // calculate the result
        return(c * r);
    }


    // Distance matrix among all the points in the map including the user's location
    async distanceMatrix(coordinates) {

        // Geographic distance solution ------------------------

        /*let graph = [];
        for(let i=0; i<coordinates.length; i++) {
            graph.push([]);
            for(let j=0; j<coordinates.length; j++) {
                graph[i].push(this.distance(coordinates[i][0], coordinates[j][0], coordinates[i][1], coordinates[j][1]));
            }
        }
        console.log(graph);
        return graph;*/

        // Real duration and travel distance solution ---------

        // Initialize API coordinates string
        let api_coordinates_string = `${coordinates[0][0]},${coordinates[0][1]}`;

        // Initialize API approaches string
        let approaches = "?approaches=unrestricted";

        // Set API approaches and coordinates strings
        for(let i=1; i<coordinates.length; i++) {
            api_coordinates_string += `;${coordinates[i][0]},${coordinates[i][1]}`;
            approaches += ";unrestricted";
        }

        
        return await fetchJSON(api_coordinates_string, approaches);
        
    }


    // Optimal path 
    async optimal_path(result, coordinates, identifications) {
        // Get rubbish bin location coordinates
        for(const key in result) {
            coordinates.push([result[key]["latitude"], result[key]["longitude"]]);
            identifications.push(result[key]["name"]);
        }

        // Initialize route path
        let route_path = [];
        
        // Get distance matrix graph
        let graph = await this.distanceMatrix(coordinates);
        if(graph === undefined) return route_path;
    
        // Get best route path and cost 
        let optimal_path = this.TTP(graph, 0, coordinates.length);

        // Map the route path to the coordinates
        for(let i=0; i<coordinates.length-1; i++) {
            route_path[i] = {
                name: identifications[optimal_path[i]],
                coordinates: coordinates[optimal_path[i]]
            }
        }
        return route_path;
    }

}

module.exports = Functions;

