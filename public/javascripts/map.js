/**
 * 2021/10/31
 * Call API foward to server form specified URL query parameters 
 * and reflect them to map after recieving GeoJSON array.
 * You only need mapbox api key to work this program.
 */

const query = window.location.search;
if(query !== '')
{
    get_segments(query)
    .then(geojson_arr => {
        mapboxgl.accessToken = 'pk.eyJ1IjoiYXJhaS1rdW4iLCJhIjoiY2t2ZG1ycDVhNDhoNTJ1cTF1Zms4ZGR5bSJ9.w0CSkX2GQr21qW_DfEJ4ZA';
        let map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: geojson_arr[0]['coordinates'][0],
            zoom: 11
        });
        map.on('load', () => {
        for(let i = 0; i < geojson_arr.length; i++)
            {
                map.addSource(`route${i}`, {
                    'type': 'geojson',
                    'data': geojson_arr[i]
                });
                map.addLayer({
                    'id': `route${i}`,
                    'type': 'line',
                    'source': `route${i}`,
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                    'line-color': '#ff0000',
                    'line-width': 4
                    }
                });
            }
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
        /* Call Strava API anf Decode */
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