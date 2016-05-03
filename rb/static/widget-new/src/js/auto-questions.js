var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });

var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var Hash = require('./utils/hash');

var PageData = require('./page-data');
var SVGs = require('./svgs');

function createAutoQuestions(pageData, groupSettings) {
    var questionConfig = groupSettings.autoQuestions();
    var questions = computeQuestions(questionConfig);
    fetchSharedReactions(questions, pageData, groupSettings);
    var ractive = Ractive({
        el: document.createElement('div'),
        data: {
            questions: questions,
            expandReactions: shouldExpandReactions(questionConfig),
            wholePrompt: BrowserMetrics.isMobile()
        },
        template: require('../templates/auto-questions.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    var rootElement = ractive.find('.antenna-auto-questions');
    return {
        element: $(rootElement),
        teardown: function() { ractive.teardown(); }
    }
}

// TODO: Terminology: question, question data, question config, category questions, etc.
function computeQuestions(questionConfig) {
    // TODO: Figure out what categories/topics are applicable
    var questions = [];
    var general = questionConfig.general_questions;
    if (general) {
        for (var i = 0; i < general.length; i++) {
            var question = general[i];
            var questionData = {
                // TODO: Should we specify "content" here or the actual container hashes that we want to use?
                itemContent: question.id,
                text: question.text,
                answers: question.answers,
                sharedReactions: question.shared_reactions
            };
            questions.push(questionData);
        }
    }
    var categories = computeMatchingCategories(questionConfig);
    for (var j = 0; j < categories.length; j++) {
        var category = categories[j];
        var categoryQuestions = category.questions;
        for (var k = 0; k < categoryQuestions.length; k++) {
            var question = categoryQuestions[k];
            var questionData = {
                itemContent: category.id + question.id, // TODO: do we need to do this or can we just generate unique question IDs?
                text: question.text,
                answers: question.answers,
                sharedReactions: question.shared_reactions
            };
            questions.push(questionData);
        }
    }
    return questions;
}

function fetchSharedReactions(questions, pageData, groupSettings) {
    var crosspageContainerHashes = [];
    for (var i = 0; i < questions.length; i++) {
        var question = questions[i];
        if (question.sharedReactions) {
            var hash = Hash.hashUrl('rdr-qtn-' + question.itemContent); // TODO: resolve duplicate code with page-scanner
            crosspageContainerHashes.push(hash);
        }
    }
    AjaxClient.fetchCrossPageContainers(crosspageContainerHashes, groupSettings, function(containerData) {
        PageData.mergeCrosspageContainerData(pageData, containerData);
    });
}

function computeMatchingCategories(questionConfig) {
    var pageCategories = [];
    var categorySelector = questionConfig.category_selector;
    if (categorySelector) {
        var categoryElements = document.querySelectorAll(categorySelector);
        var categoryAttribute = questionConfig.category_attribute;
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
        var values = category.category_values.split(';');
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
    var setting = questionConfig.expand_reactions; // Values are 'none', 'both', 'desktop', and 'mobile'
    return setting === 'both' ||
        (setting === 'desktop' && !BrowserMetrics.isMobile()) ||
        (setting === 'mobile' && BrowserMetrics.isMobile());
}

module.exports = {
    createAutoQuestions: createAutoQuestions
};