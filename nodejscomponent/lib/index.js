/**
 * Lib
 */

var _       = require("lodash");
var mysql   = require("mysql");
var numeral = require("numeraljs");

var utils   = require("./utils.js");

var conn_options = require("./rds-config.json");
var connection = mysql.createConnection(conn_options);

module.exports.getIncomeQuantiles = function(event, callback) {

  queryParams = _.pick(event, ["state", "race", "sex", "agegroup"]);

  utils.validateQueryParams(queryParams, function(err, validateCallback) {
    if(err) { return callback(err); }

    var sql = "SELECT QUANTILE, INCOME FROM PUMS_2014_Quantiles";
    sql = utils.appendWhereClause(sql, queryParams) + ";";

    connection.query(sql, function(err, results, fields){
      resultsObj = {};
      _.forEach(results, function(result) {
        resultsObj[result["QUANTILE"]] = result["INCOME"];
      })

      return callback(err, resultsObj);
  	});
  });

}

module.exports.getIncomeDistribution = function(event, callback) {

  queryParams = _.pick(event, ["state", "race", "sex", "agegroup"]);

  utils.validateQueryParams(queryParams, function(err, validateCallback) {
    if(err) { return callback(err); }

    var sql =
      "SELECT FLOOR((PERNP*ADJINC/1000000)/10000)*10000 AS BUCKET," +
      " COUNT(*) AS COUNT" +
      " FROM PUMS_2014_Persons";

    sql = utils.appendTranslatedWhereClause(sql, queryParams);
    sql += " GROUP BY BUCKET;";
    // return callback(null, sql);
    connection.query(sql, function(err, results, fields){
      resultsObj = {};
      total = _.sumBy(results, (function(result) {
        return result["COUNT"];
      }));
      _.forEach(results, function(result, i) {
        start = utils.formatIncome(results[i]["BUCKET"]);
        end = utils.formatIncome(results[i]["BUCKET"] + 10000);
        key = "" + start + "-" + end;
        // key = result["BUCKET"];
        resultsObj[key] = result["COUNT"]/total;
      })

      return callback(err, resultsObj);
  	});
  });

}
