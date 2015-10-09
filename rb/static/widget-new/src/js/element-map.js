// TODO: needs a better name
var containers = {};

function getElement(containerHash) {
    return containers[containerHash];
}

function setElement(containerHash, element) {
    containers[containerHash] = element;
}

//noinspection JSUnresolvedVariable
module.exports = {
    get: getElement,
    set: setElement
};