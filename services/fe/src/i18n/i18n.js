import {translations} from './translations';

const DEFAULT_LANG = 'tr';

const getByPath = (obj, path) => {
    if (!obj || !path) {
        return undefined;
    }

    return String(path).split('.').reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
};

export const translate = (lang, key, params = {}) => {
    const activeLang = translations[lang] ? lang : DEFAULT_LANG;
    const raw = getByPath(translations[activeLang], key) ?? getByPath(translations[DEFAULT_LANG], key) ?? key;

    if (typeof raw !== 'string') {
        return raw;
    }

    return raw.replace(/\{\{(\w+)\}\}/g, (_, token) => String(params[token] ?? ''));
};

export const supportedLanguages = [
    {value: 'tr', label: 'TR'},
    {value: 'en', label: 'EN'}
];
