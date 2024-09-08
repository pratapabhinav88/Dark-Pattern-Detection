const brw = chrome;

export const patternConfig = {
    patterns: [
        {
            name: brw.i18n.getMessage("patternCountdown_name"),
            className: "countdown",
            detectionFunctions: [
                function (node, nodeOld) {
                    if (nodeOld && node.innerText != nodeOld.innerText) {
                        const reg = /(?:\d{1,2}\s*:\s*){1,3}\d{1,2}|(?:\d{1,2}\s*(?:days?|hours?|minutes?|seconds?|tage?|stunden?|minuten?|sekunden?|[a-zA-Z]{1,3}\.?)(?:\s*und)?\s*){2,4}/gi;

                        const regBad = /(?:\d{1,2}\s*:\s*){4,}\d{1,2}|(?:\d{1,2}\s*(?:days?|hours?|minutes?|seconds?|tage?|stunden?|minuten?|sekunden?|[a-zA-Z]{1,3}\.?)(?:\s*und)?\s*){5,}/gi;

                        
                        let matchesOld = nodeOld.innerText.replace(regBad, "").match(reg);
                        let matchesNew = node.innerText.replace(regBad, "").match(reg);

                        if (matchesNew == null || matchesOld == null ||
                            (matchesNew != null && matchesOld != null
                                && matchesNew.length != matchesOld.length)) {
                            return false;
                        }

                        for (let i = 0; i < matchesNew.length; i++) {
                          
                            let numbersNew = matchesNew[i].match(/\d+/gi);
                            let numbersOld = matchesOld[i].match(/\d+/gi);

                            if (numbersNew.length != numbersOld.length) {
                                continue;
                            }

                            for (let x = 0; x < numbersNew.length; x++) {
                                if (parseInt(numbersNew[x]) > parseInt(numbersOld[x])) {
                                    break;
                                }
                                if (parseInt(numbersNew[x]) < parseInt(numbersOld[x])) {
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                }
            ],
            infoUrl: brw.i18n.getMessage("patternCountdown_infoUrl"),
            info: brw.i18n.getMessage("patternCountdown_info"),
            languages: [
                "en"
            ]
        },
        {
            
            name: brw.i18n.getMessage("patternScarcity_name"),
            className: "scarcity",
            detectionFunctions: [
                function (node, nodeOld) {

                    return /\d+\s*(?:\%|pieces?|pcs\.?|pc\.?|ct\.?|items?)?\s*(?:available|sold|claimed|redeemed)|(?:last|final)\s*(?:article|item)/i.test(node.innerText);
                },
                function (node, nodeOld) {
                  return /\s*(?:limited time deal?|deal of the day)/i.test(node.textContent || '');
                },
                function (node, nodeOld) {
                  return /\d+\s*(?:left)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternScarcity_infoUrl"),
            info: brw.i18n.getMessage("patternScarcity_info"),
            languages: [
                "en"
            ]
        },
        {
            name: brw.i18n.getMessage("patternSocialProof_name"),
            className: "social-proof",
            detectionFunctions: [
                function (node, nodeOld) {
                    return /\d+\s*(?:other)?\s*(?:customers?|clients?|buyers?|users?|shoppers?|purchasers?|people)\s*(?:have\s+)?\s*(?:(?:also\s*)?(?:bought|purchased|ordered)|(?:rated|reviewed))\s*(?:this|the\s*following)\s*(?:product|article|item)s?/i.test(node.innerText);
                },
                function (node, nodeOld) {
                  return /\s*(?:bought?|past month)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternSocialProof_infoUrl"),
            info: brw.i18n.getMessage("patternSocialProof_info"),
            languages: [
                "en"
            ]
        },
        {
            name: brw.i18n.getMessage("patternForcedContinuity_name"),
            className: "forced-continuity",
            detectionFunctions: [
                function (node, nodeOld) {
                    if (/(?:(?:€|EUR|GBP|£|\$|USD)\s*\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:euros?|€|EUR|GBP|£|pounds?(?:\s*sterling)?|\$|USD|dollars?))\s*(?:(?:(?:per|\/|a)\s*month)|(?:p|\/)m)\s*(?:after|from\s*(?:month|day)\s*\d+)/i.test(node.innerText)) {
                        return true;
                    }
                    if (/(?:(?:€|EUR|GBP|£|\$|USD)\s*\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:euros?|€|EUR|GBP|£|pounds?(?:\s*sterling)?|\$|USD|dollars?))\s*(?:after\s*(?:the)?\s*\d+(?:th|nd|rd|th)?\s*(?:months?|days?)|from\s*(?:month|day)\s*\d+)/i.test(node.innerText)) {
                        return true;
                    }
                    if (/(?:after\s*that|then|afterwards|subsequently)\s*(?:(?:€|EUR|GBP|£|\$|USD)\s*\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:euros?|€|EUR|GBP|£|pounds?(?:\s*sterling)?|\$|USD|dollars?))\s*(?:(?:(?:per|\/|a)\s*month)|(?:p|\/)m)/i.test(node.innerText)) {
                        return true;
                    }
                    if (/after\s*(?:the)?\s*\d+(?:th|nd|rd|th)?\s*months?\s*(?:only|just)?\s*(?:(?:€|EUR|GBP|£|\$|USD)\s*\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:euros?|€|EUR|GBP|£|pounds?(?:\s*sterling)?|\$|USD|dollars?))/i.test(node.innerText)) {
                        
                        return true;
                    }
                    
                    return false;
                },
                function (node, nodeOld) {
                    
                    if (/\d+(?:,\d{2})?\s*(?:Euro|€)\s*(?:(?:pro|im|\/)\s*Monat)?\s*(?:ab\s*(?:dem)?\s*\d+\.\s*Monat|nach\s*\d+\s*(?:Monaten|Tagen)|nach\s*(?:einem|1)\s*Monat)/i.test(node.innerText)) {
                    
                        return true;
                    }
                    if (/(?:anschließend|danach)\s*\d+(?:,\d{2})?\s*(?:Euro|€)\s*(?:pro|im|\/)\s*Monat/i.test(node.innerText)) {
                     
                        return true;
                    }
                    if (/\d+(?:,\d{2})?\s*(?:Euro|€)\s*(?:pro|im|\/)\s*Monat\s*(?:anschließend|danach)/i.test(node.innerText)) {
                       
                        return true;
                    }
                    if (/ab(?:\s*dem)?\s*\d+\.\s*Monat(?:\s*nur)?\s*\d+(?:,\d{2})?\s*(?:Euro|€)/i.test(node.innerText)) {
                       
                        return true;
                    }
                   
                    return false;
                }
            ],
            infoUrl: brw.i18n.getMessage("patternForcedContinuity_infoUrl"),
            info: brw.i18n.getMessage("patternForcedContinuity_info"),
            languages: [
                "en"
            ]
        },

        {
            
            name: brw.i18n.getMessage("patternDisguisedAds_name"),
            className: "Disguised",
            detectionFunctions: [
                function (node, nodeOld) {
                  return /\s*(?:zzzzzzzzzzzzzzzzz)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternScarcity_infoUrl"),
            info: brw.i18n.getMessage("patternScarcity_info"),
            languages: [
                "en"
            ]
        },

        {
            name: brw.i18n.getMessage("patternConfirmShaming_name"),
            className: "ConfirmShaming",
            detectionFunctions: [
                function (node, nodeOld) {
                  return /\s*(?:subscribe to?|unsubscribe?|no,thanks)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternScarcity_infoUrl"),
            info: brw.i18n.getMessage("patternScarcity_info"),
            languages: [
                "en"
            ]
        },
        {
            
            name: brw.i18n.getMessage("patternHiddenCost_name"),
            className: "HiddenCost",
            detectionFunctions: [
                function (node, nodeOld) {
                  return /\s*(?:offer price?|cancellation fee?|convenience fee?|convenience charge)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternScarcity_infoUrl"),
            info: brw.i18n.getMessage("patternScarcity_info"),
            languages: [
                "en"
            ]
        },
        {
            
            name: brw.i18n.getMessage("patternMisdirection_name"),
            className: "Misdirection",
            detectionFunctions: [
                function (node, nodeOld) {

                    return /\d+\s*(?:\%|pieces?|pcs\.?|pc\.?|ct\.?|items?)?\s*(?:available|sold|claimed|redeemed)|(?:last|final)\s*(?:article|item)/i.test(node.innerText);
                },
                function (node, nodeOld) {
                  return /\s*(?:sponsored?|bestseller?|flipkart's choice)/i.test(node.textContent || '');
                }
            ],
            infoUrl: brw.i18n.getMessage("patternScarcity_infoUrl"),
            info: brw.i18n.getMessage("patternScarcity_info"),
            languages: [
                "en"
            ]
        },
    ]
}


function validatePatternConfig() {
    
    let names = patternConfig.patterns.map(p => p.name);

    if ((new Set(names)).size !== names.length) {
        return false;
    }
    for (let pattern of patternConfig.patterns) {
        
        if (!pattern.name || typeof pattern.name !== "string") {
            return false;
        }
        if (!pattern.className || typeof pattern.className !== "string") {
            return false;
        }
        if (!Array.isArray(pattern.detectionFunctions) || pattern.detectionFunctions.length <= 0) {
            return false;
        }
        
        for (let detectionFunc of pattern.detectionFunctions) {
            if (typeof detectionFunc !== "function" || detectionFunc.length !== 2) {
                return false;
            }
        }
        if (!pattern.infoUrl || typeof pattern.infoUrl !== "string") {
            return false;
        }
        if (!pattern.info || typeof pattern.info !== "string") {
            return false;
        }
        if (!Array.isArray(pattern.languages) || pattern.languages.length <= 0) {
            return false;
        }
        for (let language of pattern.languages) {
            if (!language || typeof language !== "string") {
                return false;
            }
        }
    }
    return true;
}


export const patternConfigIsValid = validatePatternConfig();

export const extensionClassPrefix = "__ph__";

export const patternDetectedClassName = extensionClassPrefix + "pattern-detected";

export const currentPatternClassName = extensionClassPrefix + "current-pattern";

export const tagBlacklist = ["script", "style", "noscript", "audio", "video"];
