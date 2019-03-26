var current_chart = null;
var popup_chart = null;

function popup(el) {
    var name = $(el).attr("name");
    console.log("popup: " + name);

    if (popup_chart != null)
        Chart.prototype.destroy.call(popup_chart);

    current_chart = chart_list.find(name);

    $("#start").val(current_chart.runs_range[0]);
    $("#end").val(current_chart.runs_range[1]);

    $("#start-y").val(current_chart.chart_obj.yAxis[0].min);
    $("#end-y").val(current_chart.chart_obj.yAxis[0].max);
    
    popup_chart = $.extend(true, new current_chart.constructor({}, ""), current_chart); //copy chart

    popup_chart.el_id = "popup-chart";
    popup_chart.filters = $.extend(true, {}, global_filters);
    popup_chart.last_filters = undefined;
    popup_chart.chart_obj = null;
    
    Chart.prototype.update.call(popup_chart);
}

function updatePopup() {
    console.log("updatePopup()");
    var start = $("#start").val();
    var end = $("#end").val();
    var start_y = $("#start-y").val();
    var end_y = $("#end-y").val();
    
    popup_chart.filters.runs = new Filter(true, "run-filter-range", new NumRange(parseInt(start), parseInt(end)));

    Chart.prototype.update.call(popup_chart);

    // Update y range
    popup_chart.chart_obj.yAxis[0].update({
        min: start_y,
        max: end_y
    });
}