const debug = require("debug")("app:helpers:gcm");
const gcmConfig = require("../../config/gcm-config.json");
const request = require("request");

module.exports = class GCM {

  constructor() {
    this.options = {
      url: "https://gcm-http.googleapis.com/gcm/send",
      method: "POST",
      json: true, // this automatically adds "Content-Type": "application/json" to header
      headers: {
        "Authorization": "key=" + gcmConfig["api_key"]
      }
    };
  }

  /**
   * Sends a request to Google's GCM server to send notifications to devices.
   *
   * @param obj data to be sent to the users' devices
   * @param to channel to use
   * @param cb callback with params (error)
   */
  sendMessage(obj, to, cb) {
    this.options.body = {
      to: to || "/topics/global",
      data: obj
    };

    debug("Sending GCM request with body:", this.options.body);
    request(this.options, (error, response, body) => {
      if (error) {
        debug(error);
        return cb(error);
      }

      debug("GCM request finished with response:", body);
      // body example:
      // { multicast_id: 6984045616502393000,
      //   success: 1,
      //   failure: 0,
      //   canonical_ids: 0,
      //   results: [ { message_id: '0:1467402692743936%7f6d17daf9fd7ecd' } ] }

      cb(null);
    });
  }
};
