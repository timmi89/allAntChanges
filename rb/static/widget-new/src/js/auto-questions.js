var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });

var BrowserMetrics = require('./utils/browser-metrics');
var SVGs = require('./svgs');

function createAutoQuestions(pageData, groupSettings) {
    var questionsConfig = groupSettings.autoQuestions();
    var questionsData = computeQuestionsData(questionsConfig);
    var ractive = Ractive({
        el: document.createElement('div'),
        data: {
            questions: questionsData,
            expandReactions: shouldExpandReactions(questionsConfig),
            wholePrompt: BrowserMetrics.isMobile()
        },
        template: require('../templates/auto-questions.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    var rootElement = ractive.find('.antenna-auto-questions');
    return {
        element: rootElement,
        teardown: function() { ractive.teardown(); }
    }
}

function computeQuestionsData(questionConfig) {
    var questionsData = [];
    // This is a little trick to push the contents of an array into another array. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push#Merging_two_arrays
    Array.prototype.push.apply(questionsData, questionConfig.questions);
    var categories = computeMatchingCategories(questionConfig);
    for (var j = 0; j < categories.length; j++) {
        Array.prototype.push.apply(questionsData, categories[j].questions);
    }
    return questionsData;
}

function computeMatchingCategories(questionConfig) {
    var pageCategories = [];
    var categorySelector = questionConfig.categorySelector;
    if (categorySelector) {
        var categoryElements = document.querySelectorAll(categorySelector);
        var categoryAttribute = questionConfig.categoryAttribute;
        for (var i = 0; i < categoryElements.length; i++) {
            var element = categoryElements[i];
            var pageCategory = null;
            if (categoryAttribute) {
                pageCategory = element.getAttribute(categoryAttribute);
            } else {
                pageCategory = element.innerText;
            }
            if (pageCategory) {
                pageCategories.push(pageCategory);
            }
        }
    }
    var allCategories = questionConfig.categories;
    var matchingCategories = [];
    for (var j = 0; j < allCategories.length; j++) {
        var category = allCategories[j];
        if (isMatchingCategory(category, pageCategories)) {
            matchingCategories.push(category);
        }
    }
    return matchingCategories;

    function isMatchingCategory(category, pageCategories) {
        var values = category.categoryValues.split(';');
        for (var k = 0; k < values.length; k++) {
            var value = values[k];
            var exp = new RegExp('^' + value.replace('*', '.*') + '$');
            for (var l = 0; l < pageCategories.length; l++) {
                if (exp.test(pageCategories[l])) {
                    return true;
                }
            }
        }
        return false;
    }
}

function shouldExpandReactions(questionConfig) {
    var setting = questionConfig.expandReactions; // Values are 'none', 'both', 'desktop', and 'mobile'
    return setting === 'both' ||
        (setting === 'desktop' && !BrowserMetrics.isMobile()) ||
        (setting === 'mobile' && BrowserMetrics.isMobile());
}

module.exports = {
    createAutoQuestions: createAutoQuestions
};