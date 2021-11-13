/**
 * 2021/10/31
 * Call API foward to server form specified URL query parameters 
 * and reflect them to map after recieving GeoJSON array.
 * You only need mapbox api key to work this program.
 */

let center = [139.598507, 35.582339];  /* defalut */
const query = window.location.search;
if(query !== '')
{
    get_segments(query)
    .then(geojson_arr => {
        mapboxgl.accessToken = 'pk.eyJ1IjoiYXJhaS1rdW4iLCJhIjoiY2t2ZG1ycDVhNDhoNTJ1cTF1Zms4ZGR5bSJ9.w0CSkX2GQr21qW_DfEJ4ZA';
        let map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: center,
            zoom: 11
        });
        map.on('load', () => {
            let features = [];
            for(let i = 0; i < geojson_arr.length; i++)
            {
                features.push({
                    'type': 'Feature',
                    'geometry': geojson_arr[i]
                })
            }
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': features
                }
            });
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                'line-color': '#ff0000',
                'line-width': 3
                }
            });
        });

        /* In prod, get array of point to get spot data around from geojson_arr probably */
        let point_arr = [];
        point_arr.push(center);
        get_spots(query, point_arr)
            .then(spotjson_arr => {
                map.loadImage(encodeURI('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png'), (error, image) => {
                    if (error) throw error;
                    map.addImage('custom-marker', image);
                    let features = [];
                    for(let i = 0; i < spotjson_arr.length; i++ )
                    {
                        features.push(
                            {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': spotjson_arr[i]['point']
                                },
                                'properties': {
                                    'title': spotjson_arr[i]['name']
                                }
                            }
                        );
                    }
                    map.addSource('points', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': features
                        }
                    });
                    
                    // 暫定対応 route レイヤー後に実行
                    setTimeout(() => map.addLayer({
                        'id': 'points',
                        'type': 'symbol',
                        'source': 'points',
                        'layout': {
                            'icon-image': 'custom-marker',
                            'icon-size': 0.6,
                            'icon-allow-overlap': true,
                            // get the title name from the source's "title" property
                            'text-field': ['get', 'title'],
                            'text-offset': [0, 1.25],
                            'text-anchor': 'top',
                            'text-allow-overlap': false,
                            'text-size': 12
                        }
                    }), 5000); 
                });
            });
    })
    .catch(error =>{
        console.log(error);
    });
}

async function get_segments(bounds_params)
{
    const params = new URLSearchParams(bounds_params);
    let data = {};
    if(params.has('sw_lat') && params.has('sw_long') && params.has('ne_lat') && params.has('ne_long'))
    {
        data = {
            'sw_lat': params.get('sw_lat'),
            'sw_long': params.get('sw_long'),
            'ne_lat': params.get('ne_lat'),
            'ne_long': params.get('ne_long'),
            'activity_type': 'running'
        }

        /* Set center point */
        center[0] = (Number(data['sw_long']) + Number(data['ne_long'])) / 2;
        center[1] = (Number(data['sw_lat']) + Number(data['ne_lat'])) / 2;

        /* Call Strava API and Decode */
        const res = await fetch('/api', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
        });
        /* Recieve GeoJson Array */
        return res.json();
    }
}

/* point_arr = [[long, lat], ... ] */
async function get_spots(bounds_params, point_arr)
{
    const params = new URLSearchParams(bounds_params);
    let data = {};
    if(params.has('radius') && params.has('types') && params.has('keyword'))
    {
        data = {
            'config': {
                'radius': params.get('radius'),
                'types': params.get('types'),
                'keyword': params.get('keyword')
            },
            'points': point_arr
        }

        /* Call Google Place Find API */
        const res = await fetch('/api/spot', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
        });
        /* Recieve Spot Array */
        return res.json();
    }
}