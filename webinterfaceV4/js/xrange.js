class XRangePlot extends Chart {
    draw(xValues, yValues, yErr) {
        var self = this;
        var yTitle = this.series[0].yTitle;

        if (this.chart_obj !== null) {
            this.chart_obj.destroy();
        }

        this.update_runs_data(xValues);
        var min_y = Math.min(...yValues.map(x => Math.min(...x)));
        var max_y = Math.max(...yValues.map(x => Math.max(...x)));
        var dist = Math.abs(max_y - min_y);
        
        min_y -= 0.4 * dist;
        max_y += 0.05 * dist;

        var options = {
            credits: {
                enabled: false
            },
            chart: {
                renderTo: (this.el_id),
                zoomType: 'xy',
                height: "470"
            },
            title: {
                text: this.name
            },
            xAxis: {
                title: {
                    text: 'Run No.',
                },
                type: 'linear',
                labels: {
                    rotation: -45,
                },
            },
            yAxis: [
                {
                    title: {
                        text: yTitle,
                    },
                    min: min_y,
                    max: max_y,
                },
                {
                    zoomEnabled: false,
                    title: {
                        text: "Run Duration [sec]",
                    },
                    opposite: true,
                    visible: this.filters.durations && this.durations !== undefined && false,
                }
            ],
            plotOptions: {
                xrange: {
                    grouping: false,
                }
            },
            series: (this.filters.fills && false) ?
                [{ // "Fills" legend item
                    name: "Fills",
                    color: "#e6eaf2",
                    type: "area",
                    legendIndex: 100
                }]
                :
                []
        };

        this.chart_obj = new Highcharts.Chart(options);

        var show_dur = (this.filters.durations && this.durations);

        for (var i = 0; i < this.files.length; i++) {
            var tooltip = '<span style="color:{series.color}"></span><b>{point.series.name}</b><br> <b>Run No:</b> {point.run}<br/><b>'
                + yTitle + ': </b>{point.y}<br><b>Fill No:</b> {point.fill}<br><b>Error:</b> {point.err}';
            var raw = [];
            if (show_dur) {

                raw = yValues[i].map((y, k) => ({ y: y, fill: this.fills[k], dur: this.durations[k] }));
                tooltip += "<br><b>Duration:</b> {point.dur}";
            }
            else {
                raw = yValues[i].map((y, k) => ({ y: y, fill: this.fills[k], dur: 1 }))
            }
            var fileName = this.get_file_label(i);
            
            var data = [];
            var ticks = [];
            for (var j = 0; j < raw.length; j++) {
                var prev_x2 = get_prev_x2(j, data);
                data.push({ 
                        x: prev_x2, 
                        x2: prev_x2 + raw[j].dur, 
                        y: raw[j].y, run: xValues[0][j], 
                        dur: raw[j].dur, 
                        fill: raw[j].fill,
                        err: yErr[i][j][1] - yErr[i][j][0]
                    });
                ticks.push(prev_x2 + (raw[j].dur / 2));
                
                function get_prev_x2(index, arr) {
                    return index === 0 ? 0 : arr[index - 1].x2;
                }
            }

            this.chart_obj.xAxis[0].update({ tickPositions: ticks });

            this.chart_obj.xAxis[0].update({
                labels: {
                    enabled: true,
                    formatter: function () {
                        var index = ticks.indexOf(this.value);
                        var n = parseInt(ticks.length / 10);

                        // Show only every nth label and, always, the last one
                        if (index % n != 0 && index != ticks.length - 1)
                            return ""

                        return xValues[0][index];
                    },
                }
            });

            if (this.filters.errors) {
                this.chart_obj.addSeries({
                    type: 'xrange',
                    pointWidth: 2,
                    data: yErr[i].map((element, index) => {
                        return {
                            x: data[index].x,
                            x2: data[index].x2,
                            y: element[1]
                        }
                    }),
                    color: colors[i],
                    borderColor: colors[i],
                    colorByPoint: false,
                    showInLegend: false,
                    animation: false,
                    enableMouseTracking: false
                }, false);

                this.chart_obj.addSeries({
                    type: 'xrange',
                    pointWidth: 2,
                    data: yErr[i].map((element, index) => {
                        return {
                            x: data[index].x,
                            x2: data[index].x2,
                            y: element[0],
                        }
                    }),
                    color: colors[i],
                    borderColor: colors[i],
                    colorByPoint: false,
                    showInLegend: false,
                    animation: false,
                    enableMouseTracking: false
                }, false);
            }

            this.chart_obj.addSeries({
                name: fileName,
                type: 'xrange',
                pointWidth: 1,
                data: data,
                color: colors[i],
                borderColor: colors[i],
                colorByPoint: false,
                tooltip: {
                    headerFormat: "",
                    pointFormat: tooltip
                },
                showInLegend: true,
                animation: true
            }, true);
        }

        var self = this;
        setTimeout(function () { self.chart_obj.reflow(); }, 50);
    }

    update_runs_data(xValues) {
        this.bands = [];
        this.fills = [];//Array(xValues[0].length);
        this.durations = [];
        var start_i = 0;
        var curr = 0;
        var last_fill = 0;
        var flag = false;
        for (var i = 0; i < xValues[0].length; i++) {
            while (curr < runs_data.length && runs_data[curr].run < xValues[0][i])++curr;
            if (curr == runs_data.length) {
                console.log("Could not find the following runs in the fills file:");
                console.log(xValues[0].slice(i));
                break;
            }
            if (runs_data[curr].run === xValues[0][i]) {
                this.fills[i] = runs_data[curr].lhcfill;
                this.durations[i] = runs_data[curr].dur;
                if (runs_data[curr].lhcfill !== last_fill) {
                    if (flag) {
                        this.bands.push({
                            color: "#e6eaf2",
                            from: start_i - 0.5,
                            to: i - 1 + 0.5,
                            id: "fills"
                        });
                    }
                    else start_i = i;
                    flag = !flag;
                    last_fill = runs_data[curr].lhcfill;
                }
            }
        }
    }

    get_file_label(i) {
        var fileName = this.files[i].split(".")[0]; //Hugo: basic name of the file

        console.log(" Plot FileName = " + fileName);

        // Display the Labels of the PixelPhase1 multy plots in more readable way

        if (fileName.indexOf("perInOutLayer") !== -1) { //Convention: for plus or minus trends only, the first trend must be disk -/+3 and is called "perMinusDisk" or "perPlusDisk" in the title. So the title is correct and the legend also
            fileName = 'Inner Layer 1';
        }

        for (var number = 1; number <= 4; number++) { //If we have several plots on the same plot, show the layer number instead...  
            if ((fileName.indexOf("Module" + number) !== -1)) {
                fileName = 'Module ' + number;
                continue;
            }
        }

        for (var number = 1; number <= 2; number++) { //If we have several plots on the same plot, show the layer number instead...  
            if (((fileName.indexOf("Ring" + number) !== -1) || (fileName.indexOf("R" + number) !== -1)) && (fileName.indexOf("TEC") == -1) && (fileName.indexOf("TID") == -1)) {
                fileName = 'Ring ' + number;
                continue;
            }
        }

        for (var number = 1; number <= 6; number++) { //If we have several plots on the same plot, show the layer number instead...
            if ((fileName.indexOf("InnerLayer" + number) !== -1) || (fileName.indexOf("TIB_L" + number) !== -1)) {

                fileName = 'Inner Layer ' + number;
                continue;
            }
            if ((fileName.indexOf("OuterLayer" + number) !== -1) || (fileName.indexOf("TOB_L" + number) !== -1)) {
                fileName = 'Outer Layer ' + number;
                continue;
            }
            if ((fileName.indexOf("Layer" + number) !== -1) || (fileName.indexOf("L" + number) !== -1)) {
                fileName = 'Layer ' + number;
                continue;
            }
        }
        for (var number = 1; number <= 7; number++) { //If we have several plots on the same plot, show the layer number instead...

            if ((fileName.indexOf("TEC_MINUS_R" + number) !== -1)) {
                fileName = 'TEC- R ' + number;
                continue;
            }
            if ((fileName.indexOf("TEC_PLUS_R" + number) !== -1)) {
                fileName = 'TEC+ R ' + number;
                continue;
            }
        }
        for (var number = 1; number <= 9; number++) { //If we have several plots on the same plot, show the layer number instead...

            if ((fileName.indexOf("TEC_MINUS_W" + number) !== -1)) {
                fileName = 'TEC- W ' + number;
                continue;
            }
        }
        for (var number = 1; number <= 9; number++) { //If we have several plots on the same plot, show the layer number instead...

            if ((fileName.indexOf("TEC_PLUS_W" + number) !== -1)) {
                fileName = 'TEC+ W ' + number;
                continue;
            }
        }
        for (var number = 1; number <= 3; number++) { //or the disk number

            if (fileName.indexOf("Dm" + number) !== -1) {
                fileName = 'Disk -' + number;
                continue;
            }
            if (fileName.indexOf("Dp" + number) !== -1) {
                fileName = 'Disk +' + number;
                continue;
            }
            if (fileName.indexOf("TID_PLUS_R" + number) !== -1) {
                fileName = 'TID+ R' + number;
                continue;
            }
            if (fileName.indexOf("TID_MINUS_R" + number) !== -1) {
                fileName = 'TID- R' + number;
                continue;
            }
            if (fileName.indexOf("TID_PLUS_W" + number) !== -1) {
                fileName = 'TID+ W' + number;
                continue;
            }
            if (fileName.indexOf("TID_MINUS_W" + number) !== -1) {
                fileName = 'TID- W' + number;
                continue;
            }
        }
        if (fileName.indexOf("perLayer") !== -1) { //Convention: the first trend must be layer 1 and is called "perLayer" in the title. So the title is correct and the legend also
            fileName = 'Layer 1';
        }
        if ((fileName.indexOf("perDisk") !== -1) || (fileName.indexOf("perMinusDisk") !== -1)) { //Convention: the first trend must be disk -3 and is called "perDisk" in the title. So the title is correct and the legend also
            fileName = 'Disk -3';
        }
        if (fileName.indexOf("perPlusDisk") !== -1) { //Convention: for plus or minus trends only, the first trend must be disk -/+3 and is called "perMinusDisk" or "perPlusDisk" in the title. So the title is correct and the legend also
            fileName = 'Disk +3';
        }
        return fileName;
    }
}