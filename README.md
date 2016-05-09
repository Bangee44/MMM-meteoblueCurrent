# Module: Meteoblue Current
This module displays the current weather, including the windspeed, the sunset or sunrise time, the temperature and an icon to display the current conditions.
The weather's APIBase ist www.meteoblue.com

You'll have to get an apikey from meteoblue.com.
https://content.meteoblue.com/en/products/meteoblue-api
Order the Free JSON feed.

API
https://content.meteoblue.com/en/help/technical-documentation/meteoblue-api

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: 'MMM-meteoblueCurrent',
    position: 'top_right',
    config: {
      apikey: '123456789', // private; don't share!
      city: 'Oberrieden',
      lat: '47.2744',
      lon: '8.5784',
      asl: '464'
		}
	},
]
````

## Configuration options
See https://github.com/MichMich/MagicMirror/tree/v2-beta/modules/default/currentweather
