import {theme as ActionTypes}  from "../constants/actionTypes";
export default function theme(state = {
    currentTheme: {SiteLayout: {}, SiteContainer: {}, EditLayout: {}, EditContainer: {}},
    themes: {layouts: [], containers: []},
    currentThemeFiles: [],
    editableThemeFiles: [],
    editableTokens: [],
    editableSettings: [],
    editableValue: ''
}, action) {
    switch (action.type) {
        case ActionTypes.RETRIEVED_CURRENT_THEMES:
            return { ...state,
                currentTheme: action.data.currentTheme
            };
        case ActionTypes.RETRIEVED_CURRENT_THEMEFILES:
            return { ...state,
                currentThemeFiles: action.data.themeFiles
            };
        
        case ActionTypes.APPLY_THEME:
            return { ...state,
                currentTheme: action.data.currentTheme
            };
        case ActionTypes.RETRIEVED_THEMES:
            return { ...state,
                themes: {layouts: action.data.layouts, containers: action.data.containers}
            };
        case ActionTypes.RETRIEVED_EDITABLE_THEMEFILES:
            return { ...state,
                editableThemeFiles: action.data.themeFiles
            };
        case ActionTypes.RETRIEVED_EDITABLE_TOKENS:
            return { ...state,
                editableTokens: action.data.tokens
            };
        case ActionTypes.RETRIEVED_EDITABLE_SETTINGS:
            return { ...state,
                editableSettings: action.data.settings
            };
        case ActionTypes.RETRIEVED_EDITABLE_VALUES:
            return { ...state,
                editableValue: action.data.values
            };
        default:
            return { ...state
            };
    }
}
