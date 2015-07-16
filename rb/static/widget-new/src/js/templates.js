

// TODO use actual templates. :)

function indicator() {
    return $('<div style="width:20px; height: 20px; border-radius:20px; background-color: red; float:right;"></div>');
}

function summary() {
    return $('<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;"></div>');
}

//noinspection JSUnresolvedVariable
module.exports = {
    indicator: indicator,
    summary: summary
};