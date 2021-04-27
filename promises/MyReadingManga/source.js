(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Madara = void 0;
const _1 = require(".");
const models_1 = require("../models");
class Madara extends _1.Source {
    constructor() {
        super(...arguments);
        /**
         * The path that precedes a manga page not including the base URL.
         * Eg. for https://www.webtoon.xyz/read/limit-breaker/ it would be 'read'.
         * Used in all functions.
         */
        this.sourceTraversalPathName = 'manga';
        /**
         * By default, the homepage of a Madara is not its true homepage.
         * Accessing the site directory and sorting by the latest title allows
         * functions to step through the multiple pages easier, without a lot of custom
         * logic for each source.
         *
         * This variable holds the latter half of the website path which is required to reach the
         * directory page.
         * Eg. 'webtoons' for https://www.webtoon.xyz/webtoons/?m_orderby=latest
         */
        this.homePage = 'manga';
        /**
         * Some Madara sources have a different selector which is required in order to parse
         * out the popular manga. This defaults to the most common selector
         * but can be overridden by other sources which need it.
         */
        this.popularMangaSelector = "div.page-item-detail";
        /**
         * Much like {@link popularMangaSelector} this will default to the most used CheerioJS
         * selector to extract URLs from popular manga. This is available to be overridden.
         */
        this.popularMangaUrlSelector = "div.post-title a";
        /**
         * Different Madara sources might have a slightly different selector which is required to parse out
         * each manga object while on a search result page. This is the selector
         * which is looped over. This may be overridden if required.
         */
        this.searchMangaSelector = "div.c-tabs-item__content";
    }
    parseDate(dateString) {
        // Primarily we see dates for the format: "1 day ago" or "16 Apr 2020"
        let dateStringModified = dateString.replace('day', 'days').replace('month', 'months').replace('hour', 'hours');
        return new Date(this.convertTime(dateStringModified));
    }
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.sourceTraversalPathName}/${mangaId}`,
                method: 'GET'
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let numericId = $('a.wp-manga-action-button').attr('data-post');
            let title = $('div.post-title h1').first().text().replace(/NEW/, '').replace('\\n', '').trim();
            let author = $('div.author-content').first().text().replace("\\n", '').trim();
            let artist = $('div.artist-content').first().text().replace("\\n", '').trim();
            let summary = $('p', $('div.description-summary')).text();
            let image = (_a = $('div.summary_image img').first().attr('data-src')) !== null && _a !== void 0 ? _a : '';
            let rating = $('span.total_votes').text().replace('Your Rating', '');
            let isOngoing = $('div.summary-content').text().toLowerCase().trim() == "ongoing";
            let genres = [];
            for (let obj of $('div.genres-content a').toArray()) {
                let genre = $(obj).text();
                genres.push(createTag({ label: genre, id: genre }));
            }
            // If we cannot parse out the data-id for this title, we cannot complete subsequent requests
            if (!numericId) {
                throw (`Could not parse out the data-id for ${mangaId} - This method might need overridden in the implementing source`);
            }
            return createManga({
                id: numericId,
                titles: [title],
                image: image,
                author: author,
                artist: artist,
                desc: summary,
                status: isOngoing ? models_1.MangaStatus.ONGOING : models_1.MangaStatus.COMPLETED,
                rating: Number(rating)
            });
        });
    }
    getChapters(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/wp-admin/admin-ajax.php`,
                method: 'POST',
                headers: {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "referer": this.baseUrl
                },
                data: `action=manga_get_chapters&manga=${mangaId}`
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let chapters = [];
            // Capture the manga title, as this differs from the ID which this function is fed
            let realTitle = (_a = $('a', $('li.wp-manga-chapter  ').first()).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace(/\/chapter.*/, '');
            if (!realTitle) {
                throw (`Failed to parse the human-readable title for ${mangaId}`);
            }
            // For each available chapter..
            for (let obj of $('li.wp-manga-chapter  ').toArray()) {
                let id = (_b = $('a', $(obj)).first().attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/${realTitle}/`, '').replace('/', '');
                let chapNum = Number($('a', $(obj)).first().text().replace(/\D/g, ''));
                let releaseDate = $('i', $(obj)).text();
                if (!id) {
                    throw (`Could not parse out ID when getting chapters for ${mangaId}`);
                }
                chapters.push({
                    id: id,
                    mangaId: realTitle,
                    langCode: this.languageCode,
                    chapNum: chapNum,
                    time: this.parseDate(releaseDate)
                });
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.sourceTraversalPathName}/${mangaId}/${chapterId}`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let pages = [];
            for (let obj of $('div.page-break').toArray()) {
                let page = $('img', $(obj)).attr('data-src');
                if (!page) {
                    throw (`Could not parse page for ${mangaId}/${chapterId}`);
                }
                pages.push(page.replace(/[\t|\n]/g, ''));
            }
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
        });
    }
    searchRequest(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // If we're supplied a page that we should be on, set our internal reference to that page. Otherwise, we start from page 0.
            let page = (_a = metadata.page) !== null && _a !== void 0 ? _a : 0;
            const request = createRequestObject({
                url: `${this.baseUrl}/page/${page}?s=${query.title}&post_type=wp-manga`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let results = [];
            for (let obj of $(this.searchMangaSelector).toArray()) {
                let id = (_b = $('a', $(obj)).attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                let title = createIconText({ text: (_c = $('a', $(obj)).attr('title')) !== null && _c !== void 0 ? _c : '' });
                let image = $('img', $(obj)).attr('data-src');
                if (!id || !title.text || !image) {
                    // Something went wrong with our parsing, return a detailed error
                    throw (`Failed to parse searchResult for ${this.baseUrl} using ${this.searchMangaSelector} as a loop selector`);
                }
                results.push(createMangaTile({
                    id: id,
                    title: title,
                    image: image
                }));
            }
            // Check to see whether we need to navigate to the next page or not
            if ($('div.wp-pagenavi')) {
                // There ARE multiple pages available, now we must check if we've reached the last or not
                let pageContext = $('span.pages').text().match(/(\d)/g);
                if (!pageContext || !pageContext[0] || !pageContext[1]) {
                    throw (`Failed to parse whether this search has more pages or not. This source may need to have it's searchRequest method overridden`);
                }
                // Because we used the \d regex, we can safely cast each capture to a numeric value
                if (Number(pageContext[1]) != Number(pageContext[2])) {
                    metadata.page = page + 1;
                }
                else {
                    metadata.page = undefined;
                }
            }
            return createPagedResults({
                results: results,
                metadata: metadata.page !== undefined ? metadata : undefined
            });
        });
    }
    /**
     * It's hard to capture a default logic for homepages. So for madara sources,
     * instead we've provided a homesection reader for the base_url/webtoons/ endpoint.
     * This supports having paged views in almost all cases.
     * @param sectionCallback
     */
    getHomePageSections(sectionCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let section = createHomeSection({ id: "latest", title: "Latest Titles" });
            sectionCallback(section);
            // Parse all of the available data
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.homePage}/?m_orderby=latest`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let items = [];
            for (let obj of $('div.manga').toArray()) {
                let image = $('img', $(obj)).attr('data-src');
                let title = $('a', $('h3.h5', $(obj))).text();
                let id = (_a = $('a', $('h3.h5', $(obj))).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                if (!id || !title || !image) {
                    throw (`Failed to parse homepage sections for ${this.baseUrl}/${this.sourceTraversalPathName}/`);
                }
                items.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: title }),
                    image: image
                }));
            }
            section.items = items;
            sectionCallback(section);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // We only have one homepage section ID, so we don't need to worry about handling that any
            let page = (_a = metadata.page) !== null && _a !== void 0 ? _a : 0; // Default to page 0
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.homePage}/page/${page}/?m_orderby=latest`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let items = [];
            for (let obj of $('div.manga').toArray()) {
                let image = $('img', $(obj)).attr('data-src');
                let title = $('a', $('h3.h5', $(obj))).text();
                let id = (_b = $('a', $('h3.h5', $(obj))).attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                if (!id || !title || !image) {
                    throw (`Failed to parse homepage sections for ${this.baseUrl}/${this.sourceTraversalPathName}`);
                }
                items.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: title }),
                    image: image
                }));
            }
            // Set up to go to the next page. If we are on the last page, remove the logic.
            metadata.page = page + 1;
            if (!$('a.last')) {
                metadata = undefined;
            }
            return createPagedResults({
                results: items,
                metadata: metadata
            });
        });
    }
}
exports.Madara = Madara;

},{".":4,"../models":25}],3:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
}
exports.Source = Source;

},{}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Madara"), exports);

},{"./Madara":2,"./Source":3}],5:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":4,"./models":25}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],12:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],13:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],18:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],19:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);

},{"./Chapter":6,"./ChapterDetails":7,"./Constants":8,"./HomeSection":9,"./Languages":10,"./Manga":11,"./MangaTile":12,"./MangaUpdate":13,"./OAuth":14,"./PagedResults":15,"./RequestHeaders":16,"./RequestManager":17,"./RequestObject":18,"./ResponseObject":19,"./SearchRequest":20,"./SourceInfo":21,"./SourceTag":22,"./TagSection":23,"./TrackObject":24}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLanguage = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
exports.parseLanguage = (language) => {
    let langCode = paperback_extensions_common_1.LanguageCode.UNKNOWN;
    switch (language.toUpperCase()) {
        case "BENGALI":
            langCode = paperback_extensions_common_1.LanguageCode.BENGALI;
            break;
        case "BULGARIAN":
            langCode = paperback_extensions_common_1.LanguageCode.BULGARIAN;
            break;
        case "BRAZILIAN":
            langCode = paperback_extensions_common_1.LanguageCode.BRAZILIAN;
            break;
        case "CHINESE":
            langCode = paperback_extensions_common_1.LanguageCode.CHINEESE;
            break;
        case "CZECH":
            langCode = paperback_extensions_common_1.LanguageCode.CZECH;
            break;
        case "GERMAN":
            langCode = paperback_extensions_common_1.LanguageCode.GERMAN;
            break;
        case "DANISH":
            langCode = paperback_extensions_common_1.LanguageCode.DANISH;
            break;
        case "ENGLISH":
            langCode = paperback_extensions_common_1.LanguageCode.ENGLISH;
            break;
        case "SPANISH":
            langCode = paperback_extensions_common_1.LanguageCode.SPANISH;
            break;
        case "FINNISH":
            langCode = paperback_extensions_common_1.LanguageCode.FINNISH;
            break;
        case "FRENCH":
            langCode = paperback_extensions_common_1.LanguageCode.FRENCH;
            break;
        case "WELSH":
            langCode = paperback_extensions_common_1.LanguageCode.WELSH;
            break;
        case "GREEK":
            langCode = paperback_extensions_common_1.LanguageCode.GREEK;
            break;
        case "CHINESE":
            langCode = paperback_extensions_common_1.LanguageCode.CHINEESE_HONGKONG;
            break;
        case "HUNGARIAN":
            langCode = paperback_extensions_common_1.LanguageCode.HUNGARIAN;
            break;
        case "INDONESIAN":
            langCode = paperback_extensions_common_1.LanguageCode.INDONESIAN;
            break;
        case "ISRAELI":
            langCode = paperback_extensions_common_1.LanguageCode.ISRELI;
            break;
        case "INDIAN":
            langCode = paperback_extensions_common_1.LanguageCode.INDIAN;
            break;
        case "IRAN":
            langCode = paperback_extensions_common_1.LanguageCode.IRAN;
            break;
        case "ITALIAN":
            langCode = paperback_extensions_common_1.LanguageCode.ITALIAN;
            break;
        case "JAPANESE":
            langCode = paperback_extensions_common_1.LanguageCode.JAPANESE;
            break;
        case "KOREAN":
            langCode = paperback_extensions_common_1.LanguageCode.KOREAN;
            break;
        case "LITHUANIAN":
            langCode = paperback_extensions_common_1.LanguageCode.LITHUANIAN;
            break;
        case "MONGOLIAN":
            langCode = paperback_extensions_common_1.LanguageCode.MONGOLIAN;
            break;
        case "MEXICAN":
            langCode = paperback_extensions_common_1.LanguageCode.MEXIAN;
            break;
        case "MALAY":
            langCode = paperback_extensions_common_1.LanguageCode.MALAY;
            break;
        case "DUTCH":
            langCode = paperback_extensions_common_1.LanguageCode.DUTCH;
            break;
        case "NORWEGIAN":
            langCode = paperback_extensions_common_1.LanguageCode.NORWEGIAN;
            break;
        case "FILIPINO":
            langCode = paperback_extensions_common_1.LanguageCode.PHILIPPINE;
            break;
        case "POLISH":
            langCode = paperback_extensions_common_1.LanguageCode.POLISH;
            break;
        case "PORTUGUESE":
            langCode = paperback_extensions_common_1.LanguageCode.PORTUGUESE;
            break;
        case "ROMANIAN":
            langCode = paperback_extensions_common_1.LanguageCode.ROMANIAN;
            break;
        case "RUSSIAN":
            langCode = paperback_extensions_common_1.LanguageCode.RUSSIAN;
            break;
        case "SANSKRIT":
            langCode = paperback_extensions_common_1.LanguageCode.SANSKRIT;
            break;
        case "SAMI":
            langCode = paperback_extensions_common_1.LanguageCode.SAMI;
            break;
        case "THAI":
            langCode = paperback_extensions_common_1.LanguageCode.THAI;
            break;
        case "TURKISH":
            langCode = paperback_extensions_common_1.LanguageCode.TURKISH;
            break;
        case "UKRAINIAN":
            langCode = paperback_extensions_common_1.LanguageCode.UKRAINIAN;
            break;
        case "VIETNAMESE":
            langCode = paperback_extensions_common_1.LanguageCode.VIETNAMESE;
            break;
        default:
            langCode = paperback_extensions_common_1.LanguageCode.UNKNOWN;
            break;
    }
    return langCode;
};

},{"paperback-extensions-common":5}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyReadingManga = exports.MyReadingMangaInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MyReadingMangaParser_1 = require("./MyReadingMangaParser");
const MRM_DOMAIN = "https://myreadingmanga.info";
exports.MyReadingMangaInfo = {
    version: "1.0.2",
    name: "MyReadingManga",
    icon: "icon.png",
    author: "Ankah",
    authorWebsite: "https://github.com/AdrienSeon",
    description: "Extension that pulls manga from MyReadingManga",
    hentaiSource: false,
    websiteBaseURL: MRM_DOMAIN,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW,
        },
        {
            text: "Yaoi",
            type: paperback_extensions_common_1.TagType.YELLOW,
        },
        {
            text: "Cloudflare",
            type: paperback_extensions_common_1.TagType.RED,
        },
    ],
};
class MyReadingManga extends paperback_extensions_common_1.Source {
    getMangaShareUrl(mangaId) {
        return `${MRM_DOMAIN}/${mangaId}/`;
    }
    async getMangaDetails(mangaId) {
        const request = createRequestObject({
            url: `${MRM_DOMAIN}/${mangaId}/`,
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        let $ = this.cheerio.load(response.data);
        return MyReadingMangaParser_1.parseMangaDetails($, mangaId);
    }
    async getChapters(mangaId) {
        const request = createRequestObject({
            url: `${MRM_DOMAIN}/`,
            method: "GET",
            param: mangaId,
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        const $ = this.cheerio.load(response.data);
        return MyReadingMangaParser_1.parseChapters($, mangaId);
    }
    async getChapterDetails(mangaId, chapterId) {
        const request = createRequestObject({
            url: `${MRM_DOMAIN}/`,
            method: "GET",
            cookies: [{ name: "content_lazyload", value: "off", domain: `${MRM_DOMAIN}` }],
            param: `${mangaId}/${chapterId}`,
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        const $ = this.cheerio.load(response.data);
        return MyReadingMangaParser_1.parseChapterDetails($, mangaId, chapterId);
    }
    async getHomePageSections(sectionCallback) {
        const sections = [
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/search/?wpsolr_sort=sort_by_date_desc`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "1_recently_updated",
                    title: "RECENTLY UPDATED",
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/yaoi-manga/`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "2_yaoi",
                    title: "YAOI MANGAS",
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/manhwa/`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "3_manhwa",
                    title: "MANHWA",
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/manhua/`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "4_manhua",
                    title: "MANHUA",
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/genre/bara/`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "5_bara",
                    title: "BARA",
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MRM_DOMAIN}/search/?wpsolr_sort=sort_by_random`,
                    method: "GET",
                }),
                section: createHomeSection({
                    id: "6_randomly_selected",
                    title: "RANDOMLY SELECTED",
                    view_more: true,
                }),
            },
        ];
        const promises = [];
        for (const section of sections) {
            // Load empty sections
            sectionCallback(section.section);
            // Populate data in sections
            promises.push(this.requestManager.schedule(section.request, 1).then((response) => {
                const $ = this.cheerio.load(response.data);
                this.cloudflareError(response.status);
                section.section.items = MyReadingMangaParser_1.parseHomeSections($, section.section.id);
                sectionCallback(section.section);
            }));
        }
        // Make sure the function completes
        await Promise.all(promises);
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        const page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        let param = "";
        switch (homepageSectionId) {
            case "1_recently_updated":
                param = `/search/?wpsolr_sort=sort_by_date_desc&wpsolr_page=${page}`;
                break;
            case "2_yaoi":
                param = `/yaoi-manga/page/${page}/`;
                break;
            case "3_manhwa":
                param = `/manhwa/page/${page}/`;
                break;
            case "4_manhua":
                param = `/manhua/page/${page}/`;
                break;
            case "5_bara":
                param = `/genre/bara/page/${page}/`;
                break;
            case "6_randomly_selected":
                param = `/search/?wpsolr_sort=sort_by_random&wpsolr_page=${page}`;
                break;
            default:
                return Promise.resolve(null);
        }
        const request = createRequestObject({
            url: `${MRM_DOMAIN}`,
            method: "GET",
            param,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const mangaTiles = MyReadingMangaParser_1.parseHomeSections($, homepageSectionId);
        if (homepageSectionId === "1_recently_updated" || homepageSectionId === "6_randomly_selected") {
            // Different page structure since it's a search result
            metadata = MyReadingMangaParser_1.isLastPage($, true) ? undefined : { page: page + 1 };
        }
        else {
            metadata = MyReadingMangaParser_1.isLastPage($, false) ? undefined : { page: page + 1 };
        }
        return createPagedResults({
            results: mangaTiles,
            metadata,
        });
    }
    async searchRequest(query, metadata) {
        var _a, _b;
        let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        const request = createRequestObject({
            url: `${MRM_DOMAIN}/search/?search=${encodeURIComponent((_b = query.title) !== null && _b !== void 0 ? _b : "")}${"&wpsolr_page=" + page}`,
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const results = MyReadingMangaParser_1.parseSearchResults($);
        metadata = MyReadingMangaParser_1.isLastPage($, true) ? undefined : { page: page + 1 };
        return createPagedResults({
            results,
            metadata,
        });
    }
    cloudflareError(status) {
        if (status === 503) {
            throw new Error("CLOUDFLARE BYPASS ERROR: Please go to Settings > Sources > MyReadingManga and press Cloudflare Bypass");
        }
    }
    getCloudflareBypassRequest() {
        return createRequestObject({
            url: `${MRM_DOMAIN}`,
            method: "GET",
        });
    }
    globalRequestHeaders() {
        return {
            referer: `${MRM_DOMAIN}/`,
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        };
    }
}
exports.MyReadingManga = MyReadingManga;

},{"./MyReadingMangaParser":28,"paperback-extensions-common":5}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseSearchResults = exports.parseHomeSections = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Languages_1 = require("./Languages");
exports.parseMangaDetails = ($, mangaId) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // Titles
    const title = (_a = decodeHTMLEntity($(".entry-title", ".post").text()).replace(/(\[.+?\])/g, "").replace(/(\(.+?\))/g, "").trim()) !== null && _a !== void 0 ? _a : "";
    let titles = [title];
    const altTitleArray = (_b = decodeHTMLEntity($(".entry-title", ".post").text()).replace(/(\[.+?\])/g, "").match(/(\(.+?\))/g)) !== null && _b !== void 0 ? _b : [];
    if (altTitleArray.length > 0) {
        for (const altTitle of altTitleArray) {
            titles.push(altTitle.replace(/(\(|\))/g, "").trim());
        }
    }
    const altTitleInContent = (_c = decodeHTMLEntity($(".alt-title-class").next().text()).split("\n")) !== null && _c !== void 0 ? _c : "";
    if (altTitleInContent.length > 0) {
        for (const altTitle of altTitleInContent) {
            titles.push(altTitle.trim());
        }
    }
    // Author
    let author = "";
    const authorFound = (_d = decodeHTMLEntity($(".entry-title", ".post").text()).match(/(\[.+?\])/g)) !== null && _d !== void 0 ? _d : [];
    if (authorFound.length > 0) {
        author = authorFound[0].toString().replace(/(\[|\])/g, "").trim();
    }
    // Metadata
    let category = "";
    let langFlag = paperback_extensions_common_1.LanguageCode.UNKNOWN;
    let langName = "Unknown";
    let scanlatedBy = "";
    let rawStatus = "";
    let pairing = "";
    let genres = [];
    let tags = [];
    for (const element of $(".entry-meta > span").toArray()) {
        const metadata = $(element).text().split(":");
        switch (metadata[0].trim()) {
            case "Filed Under":
                category = metadata[1].trim();
                break;
            case "Language":
                langFlag = Languages_1.parseLanguage(metadata[1].trim());
                langName = metadata[1].trim();
                break;
            case "Scanlation Group":
                scanlatedBy = metadata[1].trim();
                break;
            case "Pairing":
                pairing = metadata[1].trim();
                break;
            case "Status":
                rawStatus = metadata[1].trim();
                break;
            case "Genres":
                let genresNotTrimmed = metadata[1].trim().split(",");
                genres = genresNotTrimmed.map((genre) => genre.trim());
                break;
            case "Tagged With":
                let tagsNotTrimmed = metadata[1].trim().split(",");
                tags = tagsNotTrimmed.map((tag) => tag.trim());
                break;
        }
    }
    // Artist
    const artist = author !== null && author !== void 0 ? author : "";
    // Thumbnail
    const image = encodeURI(getImageSrc($(".img-myreadingmanga").first()));
    // Status
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    switch (rawStatus) {
        case "Completed":
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
            break;
        case "Ongoing":
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case "Licensed": // Not supported by the app at the moment so falling back to MangaStatus.ONGOING
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case "Dropped": // Not supported by the app at the moment so falling back to MangaStatus.ONGOING
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case "Discontinued": // Not supported by the app at the moment so falling back to MangaStatus.ONGOING
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case "Hiatus": // Not supported by the app at the moment so falling back to MangaStatus.ONGOING
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
    }
    // Last update
    const lastUpdate = timeSince(new Date(Date.parse((_e = $(".entry-time").attr("datetime")) !== null && _e !== void 0 ? _e : "0")));
    // NSFW type
    const hentai = false; // ! Temporary until Mangadex is back up / Paperback login is in place
    // Description
    let description = titles.join("\n") + "\n";
    let summary = "";
    if (scanlatedBy !== "") {
        description = description + "Scanlation Group: " + scanlatedBy + "\n\n";
    }
    if (pairing !== "") {
        description = description + "Pairing: " + pairing + "\n\n";
    }
    if ($(".info-class").length > 0) {
        for (const element of $(".info-class").nextUntil("div").toArray()) {
            summary = summary + decodeHTMLEntity($(element).text()).replace(/\n/g, "");
        }
    }
    else {
        summary = "No description provided";
    }
    description = description + summary;
    // Tags
    const genresTags = [];
    for (const genre of genres) {
        genresTags.push(createTag({ id: genre.toLowerCase(), label: genre }));
    }
    const tagsTags = [];
    for (const tag of tags) {
        tagsTags.push(createTag({ id: tag.toLowerCase(), label: tag }));
    }
    const tagSections = [
        createTagSection({
            id: "category",
            label: "Category",
            tags: [createTag({ id: category.toLowerCase(), label: category })],
        }),
        createTagSection({
            id: "genres",
            label: "Genres",
            tags: genresTags,
        }),
        createTagSection({
            id: "tags",
            label: "Tags",
            tags: tagsTags,
        }),
    ];
    // Related IDs
    let relatedIds = [];
    for (const element of $("div > .jp-relatedposts-post-a").toArray()) {
        const mangaLink = (_f = $(element).attr("href")) !== null && _f !== void 0 ? _f : "";
        if (mangaLink.length > 0) {
            relatedIds.push((_g = mangaLink.split("/").reverse()[1]) !== null && _g !== void 0 ? _g : "");
        }
    }
    if (!titles)
        throw new Error("An error occurred while parsing the requested manga");
    return createManga({
        id: mangaId,
        titles,
        image,
        status,
        artist,
        author,
        langFlag,
        langName,
        tags: tagSections,
        lastUpdate,
        desc: description,
        hentai,
        relatedIds,
        rating: 0,
    });
};
exports.parseChapters = ($, mangaId) => {
    var _a, _b, _c;
    let chapters = [];
    let language = "English";
    for (const element of $(".entry-meta > span").toArray()) {
        let metadata = $(element).text().split(":");
        if (metadata[0] === "Language") {
            language = metadata[1].trim();
        }
    }
    const langCode = Languages_1.parseLanguage(language);
    const isMultipleChapter = $(".entry-pagination").length;
    if (isMultipleChapter > 0) {
        chapters.push(createChapter({
            mangaId,
            id: "1",
            chapNum: 1,
            name: "Chapter 1",
            langCode,
            time: new Date(Date.parse((_a = $(".entry-time").attr("datetime")) !== null && _a !== void 0 ? _a : "0")),
        }));
        let chapterId = 1;
        for (const element of $(".entry-pagination > a").slice(0, -1).toArray()) {
            chapterId = chapterId + 1;
            const id = chapterId.toString();
            const chapNum = chapterId;
            const name = "Chapter " + chapterId;
            chapters.push(createChapter({
                mangaId,
                id,
                chapNum,
                name,
                langCode,
                time: new Date(Date.parse((_b = $(".entry-time").attr("datetime")) !== null && _b !== void 0 ? _b : "0")),
            }));
        }
    }
    else {
        let chapterId = 1;
        const id = chapterId.toString();
        const chapNum = chapterId;
        const name = "Oneshot";
        chapters.push(createChapter({
            mangaId,
            id,
            chapNum,
            name,
            langCode,
            time: new Date(Date.parse((_c = $(".entry-time").attr("datetime")) !== null && _c !== void 0 ? _c : "0")),
        }));
    }
    return chapters;
};
exports.parseChapterDetails = ($, mangaId, chapterId) => {
    const pages = [];
    const container = $("div.entry-content");
    for (const img of $("img", container).toArray()) {
        pages.push(encodeURI(getImageSrc($(img))));
    }
    if (!pages)
        throw new Error("An error occurred while parsing pages for this chapter");
    return createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages,
        longStrip: false,
    });
};
exports.parseHomeSections = ($, sectionId) => {
    var _a, _b, _c, _d;
    let mangaTiles = [];
    const collectedIds = [];
    if (sectionId === "1_recently_updated" || sectionId == "6_randomly_selected") { // Different page structure since it's a search result
        mangaTiles = mangaTiles.concat(exports.parseSearchResults($));
    }
    else {
        const container = $("main.content");
        for (const element of $(".post", container).toArray()) {
            const id = (_b = ((_a = $(".entry-title-link", element).attr("href")) !== null && _a !== void 0 ? _a : "").split("/").reverse()[1]) !== null && _b !== void 0 ? _b : "";
            const title = (_c = decodeHTMLEntity($(".entry-title-link", element).text()).replace(/(\[.+?\])/g, "").replace(/(\(.+?\))/g, "").trim()) !== null && _c !== void 0 ? _c : "";
            const image = encodeURI(getImageSrc($(".post-image", element)));
            let author = "";
            const authorFound = (_d = decodeHTMLEntity($(".entry-title-link", element).text()).match(/(\[.+?\])/g)) !== null && _d !== void 0 ? _d : [];
            if (authorFound.length > 0) {
                author = authorFound[0].toString().replace(/(\[|\])/g, "").trim();
            }
            if (!id || !title)
                continue;
            if (!collectedIds.includes(id)) {
                mangaTiles.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: author }),
                }));
                collectedIds.push(id);
            }
        }
    }
    return mangaTiles;
};
exports.parseSearchResults = ($) => {
    var _a, _b, _c, _d, _e, _f;
    const mangaTiles = [];
    const collectedIds = [];
    const container = $("div.wdm_results");
    for (const element of $(".results-by-facets > div", container).toArray()) {
        const id = (_b = ((_a = $("a", element).attr("href")) !== null && _a !== void 0 ? _a : "").split("/").reverse()[1]) !== null && _b !== void 0 ? _b : "";
        const title = (_c = $(".p_title", element).text().replace(/(\[.+?\])/g, "").replace(/(\(.+?\))/g, "").trim()) !== null && _c !== void 0 ? _c : "";
        const image = (_d = encodeURI(getImageSrc($(".wdm_result_list_thumb", element)))) !== null && _d !== void 0 ? _d : "";
        const category = (_e = $("span.pcat > span.pcat", element).text()) !== null && _e !== void 0 ? _e : "";
        let author = "";
        const authorFound = (_f = decodeHTMLEntity($(".p_title", element).text()).match(/(\[.+?\])/g)) !== null && _f !== void 0 ? _f : [];
        if (authorFound.length > 0) {
            author = authorFound[0].toString().replace(/(\[|\])/g, "").trim();
        }
        if (!id || !title)
            continue;
        if (!category.match(/in Video/)) {
            if (!collectedIds.includes(id)) {
                mangaTiles.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: author }),
                }));
                collectedIds.push(id);
            }
        }
    }
    return mangaTiles;
};
exports.isLastPage = ($, isSearchPage) => {
    if (isSearchPage) {
        const container = $("#pagination-flickr");
        const current = $(".active", container).text();
        const total = $(".paginate", container).last().text();
        if (current) {
            if (total === current) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }
    else {
        if ($(".pagination-next").length > 0) {
            return false;
        }
        else {
            return true;
        }
    }
};
// Utility functions
const decodeHTMLEntity = (str) => {
    return str.replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
    });
};
const getImageSrc = (imageObj) => {
    var _a;
    const hasDataSrc = typeof (imageObj === null || imageObj === void 0 ? void 0 : imageObj.attr("data-src")) !== "undefined";
    const image = hasDataSrc ? imageObj === null || imageObj === void 0 ? void 0 : imageObj.attr("data-src") : imageObj === null || imageObj === void 0 ? void 0 : imageObj.attr("src");
    return (_a = image === null || image === void 0 ? void 0 : image.trim()) !== null && _a !== void 0 ? _a : "";
};
const timeSince = function (date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 60 / 60 / 24 / 365);
    if (interval >= 1)
        return Math.floor(interval) > 1 ? Math.floor(interval) + " years ago" : Math.floor(interval) + " year ago";
    interval = seconds / 60 / 60 / 24 / 30;
    if (interval >= 1)
        return Math.floor(interval) > 1 ? Math.floor(interval) + " months ago" : Math.floor(interval) + " month ago";
    interval = seconds / 60 / 60 / 24;
    if (interval >= 1)
        return Math.floor(interval) > 1 ? Math.floor(interval) + " days ago" : Math.floor(interval) + " day ago";
    interval = seconds / 60 / 60;
    if (interval >= 1)
        return Math.floor(interval) > 1 ? Math.floor(interval) + " hours ago" : Math.floor(interval) + " hour ago";
    interval = seconds / 60;
    if (interval >= 1)
        return Math.floor(interval) > 1 ? Math.floor(interval) + " minutes ago" : Math.floor(interval) + " minute ago";
    return Math.floor(interval) > 1 ? Math.floor(interval) + " seconds ago" : Math.floor(interval) + " second ago";
};

},{"./Languages":26,"paperback-extensions-common":5}]},{},[27])(27)
});
