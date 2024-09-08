import * as constants from "../scripts/constants.js";
import { LitElement, html, css } from '../scripts/lit/lit-core.min.js';

import { onOffSwitchStyles, sharedStyles, actionButtonStyles, patternsListStyles, patternLinkStyles } from "./styles.js";


const brw = chrome;
let www;
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('closeButton').addEventListener('click', function() {
        window.close(); 
    });
});


const activationState = Object.freeze({
    On: 1,
    Off: 0,
    PermanentlyOff: -1,
});

brw.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        document.querySelector("extension-popup").handleMessage(message, sender, sendResponse);
    }
);

async function getCurrentTab() {
    return (await brw.tabs.query({ active: true, currentWindow: true }))[0];
}

export class ExtensionPopup extends LitElement {
    static properties = {
        activation: { type: Number },
        initActivation: { type: Number },
        results: { type: Object }
    };

    constructor() {
        super();
        if (!constants.patternConfigIsValid) {
            this.activation = activationState.PermanentlyOff;
        } else {
            this.activation = activationState.Off;
        }
        this.initActivation = this.activation;
        this.results = {};
    }

    async handleMessage(message, sender, sendResponse) {
        if ("countVisible" in message) {
            if (sender.tab.active && (await getCurrentTab()).windowId === sender.tab.windowId) {
                this.results = message;
            }
        }
    }

    async firstUpdated() {
        if (this.activation === activationState.PermanentlyOff) {
            return;
        }
        let currentTab = await getCurrentTab();
        if (currentTab.url.toLowerCase().startsWith("http://") || currentTab.url.toLowerCase().startsWith("https://")) {
            let currentTabActivation = await brw.runtime.sendMessage({ "action": "getActivationState", "tabId": currentTab.id });
            if (currentTabActivation.isEnabled) {
                this.activation = activationState.On;

                while (true) {
                    try {
                        this.results = await brw.tabs.sendMessage(currentTab.id, { action: "getPatternCount" });
                        break;
                    } catch (error) {
                        await new Promise(resolve => { setTimeout(resolve, 250) });
                    }
                }
            }
        } else {
            this.activation = activationState.PermanentlyOff;
        }
        this.initActivation = this.activation;
    }

    render() {
        return html`
            <popup-header></popup-header>
            <on-off-switch .activation=${this.activation} .app=${this}></on-off-switch>
            <refresh-button .hide=${this.activation === this.initActivation} .app=${this}></refresh-button>
            <redo-button .activation=${this.initActivation}></redo-button>
            <found-patterns-list .activation=${this.initActivation} .results=${this.results}></found-patterns-list>
            <show-pattern-button .activation=${this.initActivation} .results=${this.results}></show-pattern-button>
            <pattern-warning .activation=${this.initActivation} .results=${this.results}></pattern-warning>
            <supported-patterns-list></supported-patterns-list>
            <popup-footer></popup-footer>
            <authors-s></authors-s>
        `;
    }
}
customElements.define("extension-popup", ExtensionPopup);


export class PopupHeader extends LitElement {
    static styles = [
        sharedStyles,
        css`
            h3 {
                color: red;
            }
        `
    ];

    render() {
        return html`
        <h1 style="color:white;">${brw.i18n.getMessage("extName")}</h1>
        ${!constants.patternConfigIsValid ?
                html`<h3>${brw.i18n.getMessage("errorInvalidConfig")}<h3>` : html``}
      `;
    }
}

customElements.define("popup-header", PopupHeader);

export class OnOffSwitch extends LitElement {
    static properties = {
        activation: { type: Number },
        app: { type: Object }
    };

    static styles = [
        sharedStyles,
        onOffSwitchStyles
    ];

    async changeActivation(event) {
        if (this.activation !== activationState.PermanentlyOff) {
            if (this.activation === activationState.Off) {
                this.activation = activationState.On;
            } else {
                this.activation = activationState.Off;
            }
            this.app.activation = this.activation;
        }
    }

    render() {
        return html`
        <div>
            <input type="checkbox" id="main-onoffswitch" tabindex="0"
                @change=${this.changeActivation}
                .checked=${this.activation === activationState.On}
                .disabled=${this.activation === activationState.PermanentlyOff} />
            <label for="main-onoffswitch">
                <span class="onoffswitch-inner"></span>
                <span class="onoffswitch-switch"></span>
            </label>
        </div>
      `;
    }
}

customElements.define("on-off-switch", OnOffSwitch);

export class RefreshButton extends LitElement {
   
    static properties = {
        
        hide: { type: Boolean },
        
        app: { type: Object }
    };

    static styles = [
        sharedStyles,
        actionButtonStyles
    ];

    
    async refreshTab() {
        
        await brw.runtime.sendMessage({ "enableExtension": this.app.activation === activationState.On, "tabId": (await getCurrentTab()).id });
        await brw.tabs.reload();
        this.app.initActivation = this.app.activation;
    }

    
    render() {
        if (this.hide) {
            return html``;
        }
        return html`
        <div>
            <span @click=${this.refreshTab} style="color:white;">${brw.i18n.getMessage("buttonReloadPageForChange")}</span>
        </div>
        `;
    }
}
customElements.define("refresh-button", RefreshButton);


export class RedoButton extends LitElement {
    static properties = {
        activation: { type: Number }
    };
    static styles = [
        sharedStyles,
        actionButtonStyles
    ];

    /**
     * Function to trigger the pattern detection in the tab again.
     * @param {Event} event
     */
    async redoPatternCheck(event) {
        await brw.tabs.sendMessage((await getCurrentTab()).id, { action: "redoPatternHighlighting" });
    }

    render() {
        if (this.activation !== activationState.On) {
            return html``;
        }
        return html`
        <div>
            <span @click=${this.redoPatternCheck} style="color:white;">${brw.i18n.getMessage("buttonRedoPatternCheck")}</span>
        </div>
      `;
    }
}
customElements.define("redo-button", RedoButton);


export class FoundPatternsList extends LitElement {
    static properties = {
        activation: { type: Number },
        results: { type: Object }
    };
    static styles = [
        sharedStyles,
        patternsListStyles,
        patternLinkStyles
    ];

    
    render() {
        if (this.activation !== activationState.On) {
            return html``;
        }
        return html`
        <div>
            <h2 style="color:white;">${brw.i18n.getMessage("headingFoundPatterns")}</h2>
            <h2 style="color: ${this.results.countVisible ? "#ba3e01" : "green"}">${this.results.countVisible}</h2>
            <ul>
                ${this.results.patterns?.map((pattern) => {
            let currentPatternInfo = constants.patternConfig.patterns.find(p => p.name === pattern.name);
            if (pattern.elementsVisible.length === 0) {
                return html``;
            }
            return html`
                    <li style="color:white;" title="${currentPatternInfo.info}">
                        <a style="color:white;" href="${currentPatternInfo.infoUrl}" target="_blank">${pattern.name}</a>: ${pattern.elementsVisible.length}
                    </li>`;
        })}
            </ul>
        </div>
      `;
    }
}
customElements.define("found-patterns-list", FoundPatternsList);

export class ShowPatternButtons extends LitElement {
    static properties = {
        activation: { type: Number },
        results: { type: Object },
        _currentPatternId: { type: Number, state: true },
        _visiblePatterns: { type: Array, state: true }
    };
    static styles = [
        sharedStyles,
        patternLinkStyles,
        css`
            .button {
                font-size: large;
                cursor: pointer;
                user-select: none;
            }

            span {
                display: inline-block;
                text-align: center;
            }

            span:not(.button) {
                width: 110px;
                margin: 0 15px;
            }
        `
    ];


    extractVisiblePatterns() {
        this._visiblePatterns = [];
        if (this.results.patterns) {
            for (const pattern of this.results.patterns) {
                if (pattern.elementsVisible.length > 0) {
                    for (const elem of pattern.elementsVisible) {
                        this._visiblePatterns.push({ "phid": elem, "patternName": pattern.name });
                    }
                }
            }
        }
    }


    getIndexOfPatternId(phid) {
        return this._visiblePatterns.map(pattern => pattern.phid).indexOf(phid);
    }


    async showPattern(step) {
        
        let idx;
    
        if (!this._currentPatternId) {
            if (step > 0) {
               
                idx = 0;
            } else {
              
                idx = this._visiblePatterns.length - 1;
            }
        } else {
            idx = this.getIndexOfPatternId(this._currentPatternId);
            if (idx === -1) {
               
                idx = 0;
            } else {
            
                idx += step;
            }
        }
        if (idx >= this._visiblePatterns.length) {
            
            idx = 0;
        } else if (idx < 0) {

            idx = this._visiblePatterns.length - 1;
        }
        this._currentPatternId = this._visiblePatterns[idx].phid;
        await brw.tabs.sendMessage((await getCurrentTab()).id, { "showElement": this._currentPatternId });
    }


    async showNextPattern(event) {
        await this.showPattern(1);
    }


    async showPreviousPattern(event) {
        await this.showPattern(-1);
    }

    getCurrentPatternText() {
        if (this._currentPatternId) {
            let idx = this.getIndexOfPatternId(this._currentPatternId);

            if (idx !== -1) {
                let currentPatternInfo = constants.patternConfig.patterns.find(p => p.name === this._visiblePatterns[idx].patternName);
                www=this._visiblePatterns[idx].patternName;
                return html`
                    <h3 style="color:white;">
                        ${this._visiblePatterns[idx].patternName}
                    </h3>`;
            }
        }
        return html``;
    }

    getCurrentPatternNumber() {
      
        if (this._currentPatternId) {
            let idx = this.getIndexOfPatternId(this._currentPatternId);
            if (idx !== -1) {
                return `${idx + 1}`;
            }
        }
        return "-";
    }

    willUpdate(changedProperties) {
        if (changedProperties.has("results")) {
            this.extractVisiblePatterns();
        }
    }


    render() {
        if (this.activation !== activationState.On || this.results.countVisible === 0) {
            return html``;
        }
        //www=this.getCurrentPatternText();
        return html`
        <div>
            <h2 style="color:white;">${brw.i18n.getMessage("headingShowPattern")}</h2>
            <span class="button" @click=${this.showPreviousPattern}><img src="../images/previous-24.png"></img></span>
            <span style="color:white; font-size:24px;">${brw.i18n.getMessage("showPatternState", [this.getCurrentPatternNumber(), this.results.countVisible.toString()])}</span>
            <span class="button" @click=${this.showNextPattern}><img src="../images/next-24.png"></img></span>
            ${this.getCurrentPatternText()}

        </div>
      `;
    }
}

customElements.define("show-pattern-button", ShowPatternButtons);


export class SupportedPatternsList extends LitElement {
    static styles = [
        sharedStyles,
        patternsListStyles,
        patternLinkStyles,
        css`
             .container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-gap: 10px;
            }

            .item {
              background-color: #f0f0f0;
              padding: 20px;
              border: 1px solid #ccc;
            }
            div {
                border: 1px solid white;
                margin: 2.5em 0 1em;
            }
        `
    ];

    
    render() {
        return html`
        <div>
            <h2 style="color:white;">${brw.i18n.getMessage("headingSupportedPatterns")}</h2>
            <table style="width:100%; color:white; text-align:left; margin-left:50px; padding:5px">
        <tr>
            <td>${brw.i18n.getMessage("patternCountdown_name")}</td>
            <td>${brw.i18n.getMessage("patternScarcity_name")}</td>
        </tr>
        <tr>
            <td>${brw.i18n.getMessage("patternSocialProof_name")}</td>
            <td>${brw.i18n.getMessage("patternForcedContinuity_name")}</td>
        </tr>
        <tr>
            <td>${brw.i18n.getMessage("patternDisguisedAds_name")}</td>
            <td>${brw.i18n.getMessage("patternConfirmShaming_name")}</td>
        </tr>
        <tr>
            <td>${brw.i18n.getMessage("patternHiddenCost_name")}</td>
            <td>${brw.i18n.getMessage("patternMisdirection_name")}</td>
        </tr>
    </table>
        </div>
      `;
    }
}

customElements.define("supported-patterns-list", SupportedPatternsList);


export class PopupFooter extends LitElement {
    static styles = [
        sharedStyles,
        css`
            div {
                margin-top: 2em;
            }
        `
    ];

    
    render() {
        return html`
        <div style="color:white;">
            ${brw.i18n.getMessage("textMoreInformation")}: <a href="https://github.com/NEWTONSGAMINGYT/Hawks-detector" target="_blank">Click Here</a>.
        </div>
      `;
    }
}
customElements.define("popup-footer", PopupFooter);


export class authors extends LitElement {

    
    render() {
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h2 style="color:white;">Developers: Smriti, Kritarth, Aryan, Abhinav, Shubham</h2>
        </div>
      `;
    }
}
customElements.define("authors-s", authors);

export class pw extends LitElement {
    static properties = {
        activation: { type: Number },
        results: { type: Object }
    };

    
    render() {
        if (this.activation !== activationState.On || this.results.countVisible === 0) {
            return html``;
        }
        if(www=="Hidden Cost"){
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h3 style="color:red;font-size:15px; ">${brw.i18n.getMessage("patternHiddenCost_w")}</h3>
        </div>

      `;
      }
      if(www=="Scarcity"){
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h3 style="color:red;font-size:15px; ">${brw.i18n.getMessage("patternScarcity_w")}</h3>
        </div>

      `;
      }
      if(www=="Social Proof"){
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h3 style="color:red;font-size:15px; ">${brw.i18n.getMessage("patternSocialProof_w")}</h3>
        </div>

      `;
      }
      if(www=="Misdirection"){
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h3 style="color:red;font-size:15px; ">${brw.i18n.getMessage("patternMisdirection_w")}</h3>
        </div>

      `;
      }
      if(www=="ConfirmShaming"){
        return html`
        <div style="margin:0px; border: 1px solid white;">
            <h3 style="color:red;font-size:15px; ">${brw.i18n.getMessage("patternConfirmShaming_w")}</h3>
        </div>

      `;
      }
    }
}
customElements.define("pattern-warning", pw);