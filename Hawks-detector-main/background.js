const brw = chrome;
const activationPrefix = "activation_";
const storage = brw.storage.session ? brw.storage.session : brw.storage.local;

async function getActivation(tabId){
    return Object.values(await storage.get(`${activationPrefix}${tabId}`))[0];
}

async function setActivation(tabId, activation){
    return await storage.set({[`${activationPrefix}${tabId}`]: activation});
}

async function removeActivation(tabId){
    return await storage.remove(`${activationPrefix}${tabId}`);
}

async function getActivationOrSetDefault(tabId){
   
    let activation = await getActivation(tabId);

    if (activation === undefined){
        activation = true;
        await setActivation(tabId, activation);
    };
    return activation;
}

brw.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        if ("countVisible" in message) {
            getActivation(sender.tab.id).then((activation) => {
                if (activation === true){
                  
                    displayPatternCount(message.countVisible, sender.tab.id);
                }
                sendResponse({ success: true });
            });

        } else if ("enableExtension" in message && "tabId" in message) {
            setActivation(message.tabId, message.enableExtension).then(() => {
               
                if (message.enableExtension === false) {
                    
                    displayPatternCount("", message.tabId);
                }
                sendResponse({ success: true });
            });

        } else if ("action" in message && message.action == "getActivationState") {

            let tabId;
            if ("tabId" in message) {
                tabId = message.tabId;
            } else {
                tabId = sender.tab.id;
            }

            getActivationOrSetDefault(tabId).then((activation) => {
                sendResponse({ isEnabled: activation });
            });

        } else {
            sendResponse({ success: false });
        }
        return true;
    }
);

brw.tabs.onReplaced.addListener(async function (addedTabId, removedTabId) {
    await setActivation(addedTabId, await getActivation(removedTabId));
    await removeActivation(removedTabId);
});
brw.tabs.onRemoved.addListener(async function (tabId, removeInfo) {
    await removeActivation(tabId);
});


let icons_default = brw.runtime.getManifest().icons;

let icons_disabled = {};

for (let resolution in icons_default) {
    icons_disabled[resolution] = `${icons_default[resolution].slice(0, -4)}_grey.png`;
}
brw.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.toLowerCase().startsWith("http://") || tab.url.toLowerCase().startsWith("https://")) {
        brw.action.setIcon({
            path: icons_default,
            tabId: tabId
        });
    } else {
        brw.action.setIcon({
            path: icons_disabled,
            tabId: tabId
        });
    }
});


function displayPatternCount(count, tabId) {
    brw.action.setBadgeText({
        tabId: tabId,
        text: "" + count
    });

    let bgColor = [255, 0, 0, 255];
    if (count == 0) {
        bgColor = [0, 255, 0, 255];
    }
    brw.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: bgColor
    });
}
