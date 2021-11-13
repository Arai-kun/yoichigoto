/**
 * 2021/11/11
 * As test at first, hardcording kinds of auth information.
 */

var express = require('express');
var router = express.Router();
var request = require('request');
var polyline = require('@mapbox/polyline');

/* Global */
let geojson_arr = [];
let latlong_arr = [];   /* [[{x: , y: }, {x: , y: }],... ] */
let access_token = '';
let spot_arr = [];

/* Constant */
const REFRESH_TOKEN = '6b91ab4184d266b1ca5edd84aded51f1d020de3b';
const EARTH_RADIUS = 6378.137;  /* km */
const MIN_UNIT = 2;  /* km */
const API_KEY = 'AIzaSyBhKyzhcL7PmTGDKdCvhF-j1OqAmoVzBcM';

/* POST api for finding spot nearby the points */
router.post('/spot', function(req, res, next){
  getAllSpots(req.body)
    .then(() => {
      res.json(spot_arr);
    })
    .catch(error => {
      console.log(error);
      res.sendStatus(500);
    })
    .finally(() => spot_arr = []);
});

/* POST api for retreiving segments. */
router.post('/', function(req, res, next) {
  let latlong = [
    {x: parseFloat(req.body['sw_long']), y: parseFloat(req.body['sw_lat'])},
    {x: parseFloat(req.body['ne_long']), y: parseFloat(req.body['ne_lat'])}
  ];
  latlong_arr.push(latlong);
  refreshToken()
    .then(() => {
      let divCount = 0;
      while((calDistance(latlong_arr[latlong_arr.length - 1]) / Math.sqrt(2)) > MIN_UNIT)
      {
        for(let i = 0; i < 4 ** divCount; i++)
        {
          divArea(latlong_arr[i + (((4 ** divCount) - 1) / 3)]);
        }
        divCount++;
      }
      console.log("Number of area: " + latlong_arr.length);
      getAllSegments(req.body['activity_type'])
        .then(() => {
          res.json(geojson_arr);
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        })
        .finally(() => destroy());
    })
    .catch(error => {
      console.log(error);
      res.sendStatus(500);
    });
});

/* point = [long, lat] */
async function getSpot(point, url)
{
  const options = {
    method: 'GET',
    url: encodeURI(`${url}&location=${point[1]},${point[0]}`)
  }
  console.log(options);
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if(error)
      {
        reject(error);
      }

      let data = [];
      try
      {
        data = JSON.parse(body)['results'];
        console.log(data);
      }
      catch(e)
      {
        console.log(e);
        resolve();
        return;
      }

      if(data.length !== 0)
      {
        for (let i= 0; i < data.length; i++)
        {
          spot_arr.push({
            name: data[i]['name'],
            point: [data[i]['geometry']['location']['lng'], data[i]['geometry']['location']['lat']]
          });
        }
      }

      resolve();
    });
  });
}

function getAllSpots(post_data)
{
  let url ='';
  let task = [];
  url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json' + 
  `?radius=${post_data['config']['radius']}&types=${post_data['config']['types']}&key=${API_KEY}&keyword=${post_data['config']['keyword']}`;
  post_data['points'].forEach(point => {
    task.push(getSpot(point, url))
  });
  return Promise.all(task);
}


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
      'refresh_token': REFRESH_TOKEN
    })
  }
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if(error)
      {
        reject(error);
      }
      access_token = JSON.parse(body)['access_token'];
      resolve();
    });
  });
}

async function getSegments(longlat, type)
{
  const url = 'https://www.strava.com/api/v3/segments/explore' + 
    `?bounds=${longlat[0].y},${longlat[0].x},${longlat[1].y},${longlat[1].x}&activity_type=${type}`;
  const options = {
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    method: 'GET'
  }
  console.log(options);
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if(error)
      {
        reject(error);
      }

      let data = [];
      try
      {
        if('segments' in JSON.parse(body))
        {
          data = JSON.parse(body)['segments'];
          console.log(data);
        }
      }
      catch(e)
      {
        console.log(e);
        resolve();
        return;
      }

      if(data.length !== 0)
      {
        for (let i= 0; i < data.length; i++)
        {
          geojson_arr.push(polyline.toGeoJSON(data[i]['points']));
        }
      }

      resolve();
    });
  });
}

function getAllSegments(type)
{
  let task = [];
  latlong_arr.forEach(latlong => {
    task.push(getSegments(latlong, type))
  });
  return Promise.all(task);
}

/**
 * Calculate a distance between two points
 * @param {Array} latlongs [{lat:x1, long:y1}, {lat:x2, long:y2}]
 * @returns distance(km)
 */
function calDistance(latlong)
{
  return EARTH_RADIUS * Math.acos(Math.sin(latlong[0].y * (Math.PI / 180))
   * Math.sin(latlong[1].y * (Math.PI / 180)) + Math.cos(latlong[0].y * (Math.PI / 180))
   * Math.cos(latlong[1].y * (Math.PI / 180)) * Math.cos((latlong[1].x - latlong[0].x) * (Math.PI / 180)));
}

/**
 * Divide one area to four ones.
 */
function divArea(latlong)
{
  let buf_x = (latlong[1].x + latlong[0].x) / 2;
  let buf_y = (latlong[1].y + latlong[0].y) / 2;
  
  latlong_arr.push([
    {x: latlong[0].x, y: buf_y},
    {x: buf_x, y: latlong[1].y}
  ]);

  latlong_arr.push([
    {x: buf_x, y: buf_y},
    {x: latlong[1].x, y: latlong[1].y}
  ]);

  latlong_arr.push([
    {x: buf_x, y: latlong[0].y},
    {x: latlong[1].x, y: buf_y}
  ]);

  latlong_arr.push([
    {x: latlong[0].x, y: latlong[0].y},
    {x: buf_x, y: buf_y}
  ]);
}

function destroy()
{
  geojson_arr = [];
  latlong_arr = [];
  access_token = '';
}

module.exports = router;
