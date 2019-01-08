/**
 * @license
 *  Copyright Baidu Inc. All Rights Reserved.
 *
 *  This source code is licensed under the Apache License, Version 2.0; found in the
 *  LICENSE file in the root directory of this source tree.
 *
 * @file i18n localize
 */

function format(tpl, args) {
    if (!args || !args.length) {
        return tpl;
    }

    return tpl.replace(/\$\{(\d+)\}/g, (all, index) => args[index]);
}

let localesConf;

function localize({namespace, key}, ...args) {
    if (!namespace) {
        return format(localesConf[key], args);
    }

    if (!localesConf[namespace]) {
        // console.warn(`locales resource namespace empty: ${namespace}`);
        return '';
    }

    return format(localesConf[namespace][key], args);
}

function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}

function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}

function localizeItem(item, namespace) {
    if (isString(item)) {
        return item.replace(
            /\{\{(.+)\}\}/g,
            (all, key) => localize({key, namespace})
        );
    }

    if (isObject(item)) {
        Object.keys(item).forEach(k => {
            let subItem = item[k];
            item[k] = localizeItem(subItem, namespace);
        });

        return item;
    }

    if (isArray(item)) {
        return item.map(subItem => localizeItem(subItem, namespace));
    }

    return item;
}

module.exports = {
    /**
     * 设置全局 locales 资源
     *
     * @param {Object} config 全局 locales 资源
     */
    init(config) {
        if (localesConf) {
            return;
        }
        localesConf = config;
    },

    /**
     * 添加新的命名空间与资源
     *
     * @param {string} namespace 命名空间
     * @param {Object} config locales 资源
     */
    set(namespace, config) {
        if (!namespace) {
            return;
        }
        localesConf = localesConf || {};
        localesConf[namespace] = config;
    },

    /**
     * 获取 locales 资源
     *
     * @param {string=} namespace 命名空间，不传则为全局
     * @return {Object} locales 资源
     */
    get(namespace) {
        return namespace ? localesConf[namespace] : localesConf;
    },

    /**
     * 根据命名空间获取 localize 方法
     *
     * @param {string=} namespace 命名空间，不传则为全局
     * @return {Function} localize 方法
     */
    getLocalize(namespace) {
        return (key, ...args) => localize({namespace, key}, ...args);
    },

    /**
     * 批量处理json的本地化，将匹配json中的locales模板变量并替换
     *    例：{name: '{{editor}}', options: ['{{edit}}', '{{open}}']}
     *    => {name: '编辑器', options: ['编辑', '打开']}
     *
     * @param {string=} namespace 资源配置的命名空间，没有则不传
     * @param {Object|string} config 要本地化的json
     * @return {Object} 本地化后的结果对象
     * @throws JSON.parse SyntaxError
     */
    jsonLocalize(namespace, config) {
        if (!config) {
            config = namespace;
            namespace = '';
        }

        if (isString(config)) {
            config = JSON.parse(config);
        }

        return localizeItem(config, namespace);
    }
};
