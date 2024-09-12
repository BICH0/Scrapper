// ==UserScript==
// @name         Scrapper
// @namespace    http://tampermonkey.net/
// @version      2024-09-12
// @description  Small script to assist during web pentesting. It provides comments and URLs in a sorted manner, allowing for quick searches of key data.
// @author       Iván "BiCH0" Martínez
// @match        *://*/*
// @icon         https://static.wikia.nocookie.net/play-rust/images/0/03/Scrap_icon.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let webpageScraper = {
        textNodes:[], 
        comments:[], 
        internalUrls:[], 
        externalUrls:[]
    }

    function addItem(item, list){
        if (!list.includes(item)){
            list.push(item);
        }
    }

    function scrapItem(container){
        container.childNodes.forEach(item =>{
            switch (item.nodeName) {
                case "#text":
                    if (! item.nodeValue.match("(#text )?(\\n *)*")){
                        addItem(item.nodeValue,webpageScraper.textNodes);
                    }
                    break;
                case "#comment":
                    addItem(item.nodeValue,webpageScraper.comments);
                    break;
                default:
                    if (item.href != null){
                        let regex = document.location.href.replace(/\./g, "\\.").replace(/^http/, "http.?")+"#.*";
                        if (typeof item.href == "string"){
                            if (item.href == document.location.href || item.href.match(regex) || item.href.match("#.*")){
                                addItem(item.href,webpageScraper.internalUrls)
                            }else{
                                addItem(item.href,webpageScraper.externalUrls)
                            }
                       }
                    }
                    if (item.childElementCount > 0){
                        scrapItem(item);
                    }
            }
        });
    }

    function closeReport(item){
        item.parentNode.remove()
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function handleClick(item){
        let target = item.target;
        if (target.nodeName == "P"){
            let itemValue = target.innerText;
            if (itemValue == "Text copied!"){
                return;
            }
            navigator.clipboard.writeText(itemValue);
            target.innerText = "Text copied!";
            await sleep(700);
            target.innerText = itemValue;
        }
    }

    function generateReport(){
        stats.innerHTML="<h2 onclick='this.parentNode.remove()'>Close</h2>"
        stats.addEventListener("click", handleClick)
        for (const [key, value] of Object.entries(webpageScraper)){
            if (value.length == 0){
                continue
            }
            let sectionText = "<h1>"+key+"</h1><div>";
            value.forEach(item =>{
                sectionText+=`<p>${item}</p>`
            })
            stats.innerHTML+=sectionText+"</div>"
        }
        document.body.appendChild(stats);
    }

    let instanceID = Math.trunc(Math.random()*10000);

    let scrapButton = document.createElement("img");
    scrapButton.id = "scrapButton"+instanceID;
    let stats = document.createElement("div");
    stats.id = "statsContainer"+instanceID;

    let customCSSText = `#${scrapButton.id}{bottom:20px;right:20px;position:fixed;z-index:9999;height:40px;background:red;padding:2px;border-radius:.5rem;}#${scrapButton.id}:hover,#${stats.id}>div>p:hover,#${stats.id}>h2:hover{cursor:pointer}#${stats.id}{display:inline-block;position:fixed;top:0px;right:0px;z-index:9999;background-color:#151515;padding:10px 20px;}#${stats.id}>div{min-height:20px;max-height:10rem;overflow-y:auto;max-width:40vw;}#${stats.id}>h1{margin:10px 0px 5px 0px;font-size:1.5rem;line-height:1.5rem;padding:0px;color:#d63838;}#${stats.id}>div>p{white-space: nowrap;margin-bottom:5px;max-width:39vw;font-size:1rem;color: #f78888}#${stats.id}>h2{color: #ffffff;margin-bottom: 10px;}`
    let customCSS = document.createElement("style");
    if (customCSS.styleSheet) {
        customCSS.styleSheet.cssText = customCSSText;
    } else {
        customCSS.appendChild(document.createTextNode(customCSSText));
    }
    document.getElementsByTagName('head')[0].appendChild(customCSS);

    scrapButton.src = "https://static.wikia.nocookie.net/play-rust/images/0/03/Scrap_icon.png";
    scrapButton.onclick = async function(){
        let ogSrc = scrapButton.src;
        scrapButton.src = "https://i.gifer.com/ZKZg.gif";
        await sleep(100)
        scrapItem(document.body);
        await sleep(100);
        generateReport();
        scrapButton.src = ogSrc;
    };
        document.body.prepend(scrapButton)
})();
