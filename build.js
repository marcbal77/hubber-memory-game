// Dependencies
var GitHub = require("gh.js")
  , SameTime = require("same-time")
  , Logger = require("bug-killer")
  , Fs = require("fs")
  ;

// A token is almost mandatory!
if (!process.argv[2]) {
    Logger.log("Usage: node build.js <token>", "warn");
    Logger.log("If a token is not provided, this script will fail due to the API rate limit.", "warn");
}

// Initialize the gh.js instance
var gh = new GitHub({ token: process.argv[2] });

// Fetch GitHub members
Logger.log("Fetching the GitHub members.");
gh.get("orgs/github/members", { all: true }, function (err, data) {
    if (err) {
        return Logger.log(err, "error");
    }

    // Get names
    Logger.log("Fetching the names.");
    SameTime(data.map(function (c) {
        return function (next) {
            gh.get("users/" + c.login, function (err, data) {
                if (data.name) {
                    Logger.log("Fetched name: " + data.name + " (@" + data.login + ")");
                }
                next(err, data);
            });
        };
    }), function (err, data) {
        if (err) {
            return Logger.log(err, "error");
        }

        // Keep only the data we need
        data = data.map(function (c) {
            return {
                login: c.login
              , name: c.name
              , avatar_url: c.avatar_url
            };
        });

        // Write to file
        Fs.writeFile("js/Hubbers.js", "var Hubbers = " + JSON.stringify(data), function (err) {
            if (err) {
                return Logger.log(err, "error");
            }
            Logger.log("Saved js/Hubbers.js");
        });
    });
});
