/**
 * 2021/10/31
 * As test at first, hardcording kinds of auth information.
 */

var express = require('express');
var router = express.Router();
var request = require('request');
var polyline = require('@mapbox/polyline');
let geojson_arr = [];
let access_token = '';
const refresh_token = '6b91ab4184d266b1ca5edd84aded51f1d020de3b';
const earth_radius = 6378.137;   /* km */

/* GET api listing. */
router.post('/', function(req, res, next) {
  refreshToken()
  .then(() => {
    getSegments(req.body)
    .then(() => {
      res.json(geojson_arr);
    })
    .catch(error => {
      console.log(error);
      res.sendStatus(500);
    });
  })
  .catch(error => {
    console.log(error);
    res.sendStatus(500);
  });
});

module.exports = router;

async function refreshToken()
{
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    url: 'https://www.strava.com/api/v3/oauth/token',
    body: JSON.stringify({
      'client_id': 71712,
      'client_secret': 'ab05751c172e2ba2b20e670d40b415f035425d12',
      'grant_type': 'refresh_token',
      'refresh_token': refresh_token
    })
  }
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      access_token = JSON.parse(body)['access_token'];
      resolve();
      if(error)
      {
        reject(error);
      }
    });
  });
}

async function getSegments(query_json)
{
  const url = 'https://www.strava.com/api/v3/segments/explore' + 
    `?bounds=${query_json['sw_lat']},${query_json['sw_long']},${query_json['ne_lat']},${query_json['ne_long']}&activity_type=${query_json['activity_type']}`;
  const options = {
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    method: 'GET'
  }
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      let data = [];
      data = JSON.parse(body)['segments'];
      for (let i= 0; i < data.length; i++)
      {
        geojson_arr.push(polyline.toGeoJSON(data[i]['points']));
      }
      resolve();
      if(error)
      {
        reject(error);
      }
    });
  });
}

/**
 * Calculate a distance between two points
 * @param {Array} latlongs [[x1, y1], [x2, y2]]
 * @returns distance
 */
function calDistance(latlongs)
{
  return earth_radius * Math.acos(Math.sin(latlongs[0][1]) * Math.sin(latlongs[1][1]) + Math.cos(latlongs[0][1]) * Math.cos(latlongs[1][1]) * Math.cos((latlongs[1][0] - latlongs[0][0])));
}
