var Vehicles = exports.Vehicles =
{
    '0x11' : { 
        vehicle_id : '0x11',
        status : 'trvelling',
        time_to_dropoff: 60.5,
        pickup_lat : 32.05060870,
        pickup_long : 34.76701480,
        dropoff_lat : 32.08745000,
        dropoff_long : 34.78923800,
        current_lat : null,
        current_long : null,
        velocity : null,
        bearing : null,
        trip_dist : 0
    }
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

exports.initDistances = function ()
{     
    for (let [key, value] of entries(Vehicles)) {
        value.velocity = getDistance(
        value.pickup_lat,
        value.dropoff_lat,
        value.pickup_long,
        value.dropoff_long) / value.time_to_dropoff;
    
        value.bearing = getBearing(   
        value.pickup_lat,
        value.dropoff_lat,
        value.pickup_long,
        value.dropoff_long);
     }  
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

