var fs = require('fs');
var redis = require('redis');
var redisClient = redis.createClient();

var Vehicles = exports.Vehicles = {}

exports.init = function(path)
{
    var fs = require('fs');

    var data = fs.readFileSync(path, 'utf8');
    
    var arr = JSON.parse(data);
    arr.forEach(element => {
        Vehicles[element.vehicle_id] =  
            { 
                status : 'trvelling',
                time_to_dropoff: element.time_to_dropoff,
                pickup_lat : element.pickup_lat,
                pickup_long : element.pickup_long,
                dropoff_lat : element.dropoff_lat,
                dropoff_long : element.dropoff_long,
                current_lat : null,
                current_long : null,
                velocity : null,
                bearing : null,
                trip_dist : 0
            };

            initVehicle(Vehicles[element.vehicle_id]);
            redisClient.set(element.vehicle_id, Vehicles[element.vehicle_id], redis.print);
    });
}

function Deg2Rad( deg ) {
    return deg * Math.PI / 180;
 }

if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
}

function getDistance(lat1, lon1, lat2, lon2)
{       
    lat1 = Deg2Rad(lat1); 
    lat2 = Deg2Rad(lat2); 
    lon1 = Deg2Rad(lon1); 
    lon2 = Deg2Rad(lon2);
    latDiff = lat2-lat1;
    lonDiff = lon2-lon1;
    var R = 6371000; // metres
    var φ1 = lat1;
    var φ2 = lat2;
    var Δφ = latDiff;
    var Δλ = lonDiff;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;    
    return d;
}

function getBearing(lat1, lat2, lon1, lon2)
{
    var y = Math.sin(lon2-lon1) * Math.cos(lat1);
    var x = Math.cos(lat1)*Math.sin(lat2) -
        Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
    return Math.atan2(y, x).toDegrees();
}

function getNextPoint(lat, lon, bearing, distance)
{
    var radius = 6371e3; // (Mean) radius of earth

    var toRadians = function(v) { return v * Math.PI / 180; };
    var toDegrees = function(v) { return v * 180 / Math.PI; };

    var δ = distance / radius; // angular distance in radians
    var θ = toRadians(Number(bearing));

    var φ1 = toRadians(Number(lat));
    var λ1 = toRadians(Number(lon));

    var sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
    var sinδ = Math.sin(δ), cosδ = Math.cos(δ);
    var sinθ = Math.sin(θ), cosθ = Math.cos(θ);

    var sinφ2 = sinφ1*cosδ + cosφ1*sinδ*cosθ;
    var φ2 = Math.asin(sinφ2);
    var y = sinθ * sinδ * cosφ1;
    var x = cosδ - sinφ1 * sinφ2;
    var λ2 = λ1 + Math.atan2(y, x);

    return [toDegrees(φ2), (toDegrees(λ2)+540)%360-180]; // normalise to −180..+180°
}

function* entries(obj) {
    for (let key of Object.keys(obj)) {
      yield [key, obj[key]];
    }
 }

function initVehicle(vehicle)
{     
        vehicle.velocity = getDistance(
        vehicle.pickup_lat,
        vehicle.dropoff_lat,
        vehicle.pickup_long,
        vehicle.dropoff_long) / vehicle.time_to_dropoff;

        vehicle.bearing = getBearing(   
        vehicle.pickup_lat,
        vehicle.dropoff_lat,
        vehicle.pickup_long,
        vehicle.dropoff_long);
}

exports.updateLocation = function ()
{
    for (let [key, value] of entries(Vehicles)) {
        if (value.status === 'dropoff')
            continue;

        var current = getNextPoint(
            value.pickup_lat,
            value.pickup_long, 
            value.bearing,
            value.trip_dist);
        value.current_lat = current[0];
        value.current_long = current[1];

        value.time_to_dropoff -= 1;
        value.trip_dist += 1
        if(value.time_to_dropoff <= 0)
        {
            value.status = 'dropoff';
        }
    }  
}

