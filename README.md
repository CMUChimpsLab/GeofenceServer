# Server for Managing Geofences

Simple server for managing geofences. This is the server that sends geofences to the [client app](https://github.com/CMUChimpsLab/GeofenceApp).

## How to Install

Clone the repository and run `npm install` inside the root directory.
Also, ask for the `gcm-config.json` configuration file if you do not have it.
The configuration file should be located inside `config/` without any name change.

In case of any error when trying to send requests to the Google server, check if the `gcm-config.json` configuration file has the `api_key` field in the topmost layer.
The `api_key` field should have the correct API key value that was obtained while configurating GCM from [here](https://developers.google.com/cloud-messaging/android/start).

## How to Run

Start the server by running `gulp` or `npm start` inside the root directory. (if you need `gulp`, install it like so: `npm install --global gulp-cli`

## How to run tests

Run `gulp mocha` inside the root directory. It will test everything in `test/test*.js`.

## Features

- Lets you manage geofences (e.g. adding, deleting) and push changes to all connected client apps.

.babelrc is because of [this error](http://stackoverflow.com/questions/33440405/babel-file-is-copied-without-being-transformed)
