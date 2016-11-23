import LanguageService from "services/languageService";
import utils from "../utils";

const languagesActions = {
    getLanguages(tabId, callback) {
        return () => {
            LanguageService.getLanguages(tabId, data => {
                if (callback) {
                    callback(data);
                }
            });
        };
    },
    makePageTranslatable(tabId, callback) {
        return () => {
            LanguageService.makePageTranslatable(tabId, data => {
                if (callback) {
                    callback(data);
                }
            });
        };
    },
    makePageNeutral(tabId, callback) {
        return () => {
            LanguageService.makePageNeutral(tabId, data => {
                if (callback) {
                    callback(data);
                }
            }, data => {
                const Message = JSON.parse(data.responseText).Message;
                utils.notifyError(Message, 4000);
            });
        };
    },
    addMissingLanguages(tabId, callback) {
        return () => {
            LanguageService.addMissingLanguages(tabId, data => {
                if (callback) {
                    callback(data);
                }
            });
        };
    },
    notifyTranslators(params, callback) {
        return () => {
            LanguageService.notifyTranslators(params, data => {
                if (callback) {
                    callback(data);
                }
            });
        };
    },
    updateTabLocalization(params, callback, failureCallback) {
        return () => {
            LanguageService.updateTabLocalization(params, data => {
                if (callback) {
                    callback(data);
                }
            }, data => {
                if (failureCallback) {
                    failureCallback(data);
                }
            });
        };
    },
    deleteModule(params, callback, failureCallback) {
        return () => {
            LanguageService.deleteModule(params, data => {
                if (callback) {
                    callback(data);
                }
            }, data => {
                if (failureCallback) {
                    failureCallback(data);
                }
            });
        };
    },
    restoreModule(params, callback, failureCallback) {
        return () => {
            LanguageService.restoreModule(params, data => {
                if (callback) {
                    callback(data);
                }
            }, data => {
                if (failureCallback) {
                    failureCallback(data);
                }
            });
        };
    },
    getLanguageSettings(portalId, callback) {
        return () => {
            LanguageService.getLanguageSettings(portalId, data => {
                if (callback) {
                    callback(data);
                }
            });
        };
    }
};

export default languagesActions;
