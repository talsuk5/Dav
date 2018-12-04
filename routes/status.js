var express = require('express');
var router = express.Router();
var vehicles = require('../vehicles')
var redis = require('redis');
var redisClient = redis.createClient();

var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


/* GET users listing. */
router.get('/:id', async function(req, res, next) {
  vehicle = null;
  var a = await redisClient.getAsync(req.params.id);
  
  if(vehicle == null)
  {
    res.status(404).send('Not found');
    return;
  }

  res.send({
    status : vehicle.status,
    current_lat : vehicle.current_lat,
    current_long : vehicle.current_long
  });  

});

module.exports = router;
