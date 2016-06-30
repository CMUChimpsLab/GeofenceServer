# Server for Managing Crowdsourcing Tasks

Simple server for managing location-based crowdsourcing tasks. This is the backend server for the [client app](https://github.com/CMUChimpsLab/GeofenceApp).

## How to Install

Clone the repository and run `npm install` inside the root directory.
Also, ask for the `gcm-config.json` configuration file if you do not have it.
The configuration file should be placed inside `config/` without any name change.

In case of any error when trying to send requests to the Google server, check if the `gcm-config.json` configuration file has the `api_key` field in the topmost layer.
The `api_key` field should have the correct API key value that was obtained while configurating GCM from [here](https://developers.google.com/cloud-messaging/android/start).

## How to Run

Start the server by running `npm start` inside the root directory.

## How to run tests

Run `npm test` inside the root directory. It will test everything in `test/test*.js`.
