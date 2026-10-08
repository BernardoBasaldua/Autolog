/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9978087649402391, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "GET /api/ordenes/ (listado OT del taller)"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/ordenes/{id}/ (detalle OT creada)"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/ordenes/vehiculo/{id}/historial/"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/talleres/ (listado de talleres)"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/clientes/{id}/service/ (próximo mantenimiento)"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/clientes/{id}/historial/ (historial del vehículo)"], "isController": false}, {"data": [1.0, 500, 1500, "POST /api/token/ (login concurrente)"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/clientes/vehiculos/ (mis vehículos)"], "isController": false}, {"data": [1.0, 500, 1500, "POST /api/ordenes/ (crear OT)"], "isController": false}, {"data": [0.89, 500, 1500, "GET /api/talleres/{id}/vehiculos/"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/agendas/{id}/turnos-asignados/"], "isController": false}, {"data": [1.0, 500, 1500, "POST /api/token/ (login)"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 2510, 0, 0.0, 31.717928286852636, 2, 779, 7.0, 180.0, 193.44999999999982, 377.6699999999996, 11.00766150783035, 76.02941832485101, 5.042164571940112], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /api/ordenes/ (listado OT del taller)", 50, 0, 0.0, 30.980000000000004, 18, 77, 23.0, 60.29999999999999, 71.14999999999998, 77.0, 0.6258840612364965, 82.67075192928762, 0.2836037152477875], "isController": false}, {"data": ["GET /api/ordenes/{id}/ (detalle OT creada)", 50, 0, 0.0, 8.919999999999998, 4, 36, 8.0, 13.0, 15.899999999999991, 36.0, 0.6323670764405321, 0.44811605991045683, 0.289011515404462], "isController": false}, {"data": ["GET /api/ordenes/vehiculo/{id}/historial/", 50, 0, 0.0, 13.02, 5, 179, 9.0, 17.699999999999996, 20.699999999999974, 179.0, 0.6249140743147817, 0.9739627598080265, 0.2964802300621165], "isController": false}, {"data": ["GET /api/talleres/ (listado de talleres)", 500, 0, 0.0, 4.859999999999996, 2, 31, 4.0, 8.0, 9.0, 16.970000000000027, 6.537144052506341, 3.3132595344246005, 2.9795076876814055], "isController": false}, {"data": ["GET /api/clientes/{id}/service/ (próximo mantenimiento)", 500, 0, 0.0, 5.812, 3, 35, 5.0, 9.0, 11.0, 25.920000000000073, 6.579553379916572, 2.531585968444462, 3.1638399260458203], "isController": false}, {"data": ["GET /api/clientes/{id}/historial/ (historial del vehículo)", 500, 0, 0.0, 7.834000000000001, 4, 52, 6.0, 12.0, 15.0, 35.97000000000003, 6.592913936101478, 10.28063201733277, 3.1831412597739948], "isController": false}, {"data": ["POST /api/token/ (login concurrente)", 100, 0, 0.0, 185.61999999999995, 177, 217, 184.0, 191.9, 198.84999999999997, 216.99, 1.6781339150864238, 1.4041261117637187, 0.42444988672596073], "isController": false}, {"data": ["GET /api/clientes/vehiculos/ (mis vehículos)", 500, 0, 0.0, 10.02600000000001, 6, 60, 9.0, 15.0, 19.0, 28.980000000000018, 6.662313954882809, 12.533803435921863, 3.101619441964583], "isController": false}, {"data": ["POST /api/ordenes/ (crear OT)", 50, 0, 0.0, 27.839999999999993, 18, 89, 22.5, 49.29999999999999, 63.34999999999999, 89.0, 0.629580195925357, 0.4406077652421365, 0.4252371549900526], "isController": false}, {"data": ["GET /api/talleres/{id}/vehiculos/", 50, 0, 0.0, 389.98, 223, 779, 376.5, 662.1, 703.6999999999999, 779.0, 0.620262743298061, 102.04724987129548, 0.2889309849152101], "isController": false}, {"data": ["GET /api/agendas/{id}/turnos-asignados/", 50, 0, 0.0, 10.44, 5, 39, 8.5, 15.0, 30.449999999999996, 39.0, 0.629643621710112, 0.19983806353104144, 0.3074431746631407], "isController": false}, {"data": ["POST /api/token/ (login)", 110, 0, 0.0, 206.59090909090904, 177, 305, 198.0, 249.60000000000002, 260.45, 303.79, 0.8132906478969043, 0.6801417413107288, 0.2309040742164684], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 2510, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
