/**
 * Lib
 */

var _       = require("lodash");
var pg      = require("pg");
var numeral = require("numeraljs");

var utils   = require("./utils.js");

var conn_options = require("./redshift-config.json");

/* --------------------------------------------------------
   income / median
   -------------------------------------------------------- */


/* --------------------------------------------------------
   income / quantiles
   -------------------------------------------------------- */


/* --------------------------------------------------------
   income / distribution
   -------------------------------------------------------- */

module.exports.getIncomeDistribution = function(event, callback) {

  var queryParams = _.pick(event, ["state", "race", "sex", "agegroup"]);

  utils.validateQueryParams(queryParams, function(err, validateCallback) {
    if(err) { return callback(err); }

    var sql =
      "SELECT FLOOR(PERNP/10000)*10000 AS BUCKET," +
      " SUM(PWGTP) AS COUNT" +
      " FROM PUMS_2014_Persons";

    sql = utils.appendTranslatedWhereClause(sql, queryParams);
    sql += " GROUP BY BUCKET;";
    // return callback(null, sql);

    pg.connect(conn_options, function(err, client, done) {
      if(err) { return callback(err); }

      client.query(sql, function(err, response) {
        done();
        if(err) { return callback(err); }

        var results = response.rows;
        resultsObj = {};
        total = _.sumBy(results, (function(result) {
          return parseInt(result["count"]);
        }));
        _.forEach(results, function(result, i) {
          var bucket = parseInt(results[i]["bucket"]);
          var start = utils.formatIncome(bucket);
          var end = utils.formatIncome(bucket + 10000);
          var key = "" + start + "-" + end;
          // key = result["bucket"];
          resultsObj[key] = parseInt(result["count"])/total;
        })

        return callback(err, resultsObj);
      });
    });
  });

}
