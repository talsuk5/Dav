var express = require('express');
var router = express.Router();
var vehicles = require('../vehicles')

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  var vehicle = vehicles.Vehicles[req.params.id];
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
