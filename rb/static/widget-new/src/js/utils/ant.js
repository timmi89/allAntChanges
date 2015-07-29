
// TODO: Temporary repository for global variables used by old bits of code from engage_full.js. Everything that goes
//       in here is suspect.

var ANT_offline = require('./offline.js');

module.exports = {
    ANT_baseUrl: ( ANT_offline ) ? window.location.protocol + "//local.antenna.is:8081":window.location.protocol + "//www.antenna.is",
    session: {
        receiveMessage: function(somekindofobject, somekindoffunction) {

        }
    }
};