//Dependencies
var sqlite3 = require('sqlite3').verbose();

//Export Function
module.exports.sqlToJSON = sqlToJSON;

function sqlToJSON(sqlFilePath, callback) {
    //Initialize Database access
    var db = new sqlite3.Database(sqlFilePath);
    //Construction Initial Building Data Object
    var building = {
        "general": {},
        "windowWallRatio": {},
        "skylightRoofRatio": {},
        "zoneSummary": {},
        "elecConsumption": {},
        "ngConsumtion": {},
        "energyIntensity": {
            "total": {},
            "site": {},
            "source": {}
        },
        "area": {},
        "tariffs": {},
        "comfortSetpointSummary":{},
        "siteToSourceConversion": {
            "Electricity": 3.167,
            "Natural Gas": 1.084,
            "District Cooling": 1.056,
            "District Heating": 3.613,
            "Steam": 0.300,
            "Gasoline": 1.050,
            "Diesel": 1.050,
            "Coal": 1.050,
            "Fuel Oil #1": 1.050,
            "Fuel Oil #2": 1.050,
            "Propane": 1.050,
            "Other Fuel 1": 1.000,
            "Other Fuel 2": 1.000
        }
    };
    //SQL Commands for SQLite3 Database
    //Monthly SQL Commands
    var monthlyElSql = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'END USE ENERGY CONSUMPTION ELECTRICITY MONTHLY'";
    var monthlyNGSql = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'END USE ENERGY CONSUMPTION NATURAL GAS MONTHLY'";
    //Energy Intensity SQL
    var eISql = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'AnnualBuildingUtilityPerformanceSummary'";
    var sourceSQL = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'SourceEnergyEndUseComponentsSummary'";
    //Tariff SQL
    var tariffSQL = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'Tariff Report' AND TableName Like 'Categories'";
    //General Data SQL
    var summarySQL = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'InputVerificationandResultsSummary'";
    //SQL for Comfort and Setpoints
    var setpointSql = "Select Distinct * From TabularDataWithStrings Where ReportName Like 'AnnualBuildingUtilityPerformanceSummary' and TableName Like 'Comfort and Setpoint Not Met Summary'";
    //Object Constuctors
    function month(energyType, value, units) {
        this.energyType = energyType;
        this.value = value;
        this.units = units;
    };

    function siteSource(type, value, units) {
        this.type = type;
        this.value = value;
        this.units = units;
    };

    function tariffs(type, value) {
        this.type = type;
        this.value = value;
        this.units = "$";
    };

    function generalData(value, units) {
        if (isNaN(value)) {
            this.value = value;
        } else {
            this.value = parseInt(value);
        };

        this.units = units;
    }

    function wwRatioData(type, value, units) {
        this.type = type;
        if (isNaN(value)) {
            this.value = value;
        } else {
            this.value = parseInt(value);
        };
        this.units = units;
    }

    function skyRatioData(value, units) {
        if (isNaN(value)) {
            this.value = value;
        } else {
            this.value = parseInt(value);
        };
        this.units = units;
    }

    function zoneSumData(type, value, units) {
        this.type = type;
        if (isNaN(value)) {
            this.value = value;
        } else {
            this.value = parseInt(value);
        };
        this.units = units;
    }

    function setpoint(value, units) {
        if (isNaN(value)) {
            this.value = value;
        } else {
            this.value = parseInt(value);
        };
        this.units = units;
    }
    //DB Read for general data
    db.all(summarySQL, function (err, rows) {
        rows.forEach(function (row) {
            if (row.TableName == "General") {
                building.general[row.RowName] = new generalData(row.Value, row.Units);
            }
            if (row.TableName == "Window-Wall Ratio") {
                if (building.windowWallRatio[row.RowName]) {
                    building.windowWallRatio[row.RowName].push(new wwRatioData(row.ColumnName, row.Value, row.Units));
                } else {
                    building.windowWallRatio[row.RowName] = [];
                    building.windowWallRatio[row.RowName].push(new wwRatioData(row.ColumnName, row.Value, row.Units));
                };

            }
            if (row.TableName == "Skylight-Roof Ratio") {
                building.skylightRoofRatio[row.RowName] = new skyRatioData(row.Value, row.Units);
            }
            if (row.TableName == "Zone Summary") {
                if (building.zoneSummary[row.RowName]) {
                    building.zoneSummary[row.RowName].push(new zoneSumData(row.ColumnName, row.Value, row.Units));
                } else {
                    building.zoneSummary[row.RowName] = [];
                    building.zoneSummary[row.RowName].push(new zoneSumData(row.ColumnName, row.Value, row.Units));
                };

            }
        });

    });
    //Monthly Consumption DB queries
    //Electricity
    db.all(monthlyElSql, function (err, rows) {
        rows.forEach(function (row) {
            delete row.ReportName;
            delete row.TableName;
            delete row.ReportForString;
            delete row.RowId;
            row.Value = parseInt(row.Value);
            row.ColumnName = row.ColumnName.substring(0, row.ColumnName.search(":"));
            var curMonth = row.RowName.substring(0, 3).toLowerCase();
            if (building.elecConsumption[curMonth]) {
                building.elecConsumption[curMonth].push(new month(row.ColumnName, row.Value, row.Units));
            } else {
                building.elecConsumption[curMonth] = [];
                building.elecConsumption[curMonth].push(new month(row.ColumnName, row.Value, row.Units));
            }
        });
    });
    //Natural Gas
    db.all(monthlyNGSql, function (err, rows) {
        rows.forEach(function (row) {
            delete row.ReportName;
            delete row.TableName;
            delete row.ReportForString;
            delete row.RowId;
            var value = parseInt(row.Value);
            row.Value = value;
            row.ColumnName = row.ColumnName.substring(0, row.ColumnName.search(":"));
            var curMonth = row.RowName.substring(0, 3).toLowerCase();
            if (building.ngConsumtion[curMonth]) {
                building.ngConsumtion[curMonth].push(new month(row.ColumnName, row.Value, row.Units));
            } else {
                building.ngConsumtion[curMonth] = [];
                building.ngConsumtion[curMonth].push(new month(row.ColumnName, row.Value, row.Units));
            }
        });
    });

    //Energy Intensity DB Queries
    db.all(eISql, function (err, rows) {
        rows.forEach(function (row) {
            delete row.ReportName;
            delete row.ReportForString;
            delete row.RowId;
            if (row.TableName == "Site and Source Energy") {
                row.Value = parseInt(row.Value);
                var rowName = row.RowName;
                if (building.energyIntensity.total[rowName]) {
                    building.energyIntensity.total[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
                } else {
                    row.Value = parseInt(row.Value);
                    var rowName = row.RowName;
                    building.energyIntensity.total[rowName] = [];
                    building.energyIntensity.total[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
                }
            };
            if (row.TableName == "End Uses") {
                var rowName = row.RowName;
                if (building.energyIntensity.site[rowName]) {
                    row.Value = parseInt(row.Value);
                    var rowName = row.RowName;
                    building.energyIntensity.site[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
                } else {
                    row.Value = parseInt(row.Value);
                    var rowName = row.RowName;
                    building.energyIntensity.site[rowName] = [];
                    building.energyIntensity.site[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
                }

            };
            if (row.TableName == "Building Area") {
                var rowName = row.RowName;
                row.Value = parseInt(row.Value);
                var rowName = row.RowName;
                building.area[rowName] = new siteSource(row.ColumnName, row.Value, row.Units);
            };
        });
    });
    //Source DB read
    db.all(sourceSQL, function (err, rows) {
        rows.forEach(function (row) {
            delete row.ReportName;
            //delete row.TableName;
            delete row.ReportForString;
            delete row.RowId;
            var value = parseInt(row.Value);
            row.Value = value;
            var rowName = row.RowName;
            if (building.energyIntensity.source[rowName]) {
                building.energyIntensity.source[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
            } else {
                building.energyIntensity.source[rowName] = [];
                building.energyIntensity.source[rowName].push(new siteSource(row.ColumnName, row.Value, row.Units));
            }
        });
    });
    //Comfort and Setpoint DB read
    db.all(setpointSql, function (err, rows) {
        rows.forEach(function (row) {
            building.comfortSetpointSummary[row.RowName] = new setpoint(row.Value, row.Units);
        });
    });
    //Tariff DB read
    db.all(tariffSQL, function (err, rows) {
        rows.forEach(function (row) {
            delete row.ReportName;
            delete row.TableName;
            delete row.ReportForString;
            delete row.RowId;
            row.Value = parseInt(row.Value);
            delete row.Units
            row.RowName = row.RowName.substring(0, row.RowName.search(" "));
            if (building.tariffs[row.RowName]) {
                building.tariffs[row.RowName].push(new tariffs(row.ColumnName, row.Value));
            } else {
                building.tariffs[row.RowName] = [];
                building.tariffs[row.RowName].push(new tariffs(row.ColumnName, row.Value));
            }
        })
        callback(building);
    });
    db.close();

};
