(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Source_1 = require("./Source");
const Manga_1 = require("../models/Manga");
class Madara extends Source_1.Source {
    constructor(cheerio) {
        super(cheerio);
    }
    //This is to let Madara sources override selectors without needing to override whole methods
    get titleSelector() { return 'div.post-title h1'; }
    get authorSelector() { return 'div.author-content'; }
    get genresSelector() { return 'div.genres-content a'; }
    get artistSelector() { return 'div.artist-content'; }
    get ratingSelector() { return 'span#averagerate'; }
    get thumbnailSelector() { return 'div.summary_image img'; }
    get thumbnailAttr() { return 'src'; }
    get chapterListSelector() { return 'li.wp-manga-chapter'; }
    get pageListSelector() { return 'div.page-break'; }
    get pageImageAttr() { return 'src'; }
    get searchMangaSelector() { return 'div.c-tabs-item__content'; }
    get searchCoverAttr() { return 'src'; }
    getMangaDetailsRequest(ids) {
        let requests = [];
        for (let id of ids) {
            let metadata = { 'id': id };
            requests.push(createRequestObject({
                url: this.MadaraDomain + "/manga/" + id,
                metadata: metadata,
                method: 'GET'
            }));
        }
        return requests;
    }
    getMangaDetails(data, metadata) {
        var _a, _b;
        let manga = [];
        let $ = this.cheerio.load(data);
        let title = $(this.titleSelector).first().children().remove().end().text().trim();
        let titles = [title];
        titles.push.apply(titles, $('div.summary-content').eq(2).text().trim().split(", "));
        let author = $(this.authorSelector).text().trim();
        let tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] })];
        for (let genre of $(this.genresSelector).toArray()) {
            let id = (_b = (_a = $(genre).attr("href")) === null || _a === void 0 ? void 0 : _a.split('/').pop()) !== null && _b !== void 0 ? _b : '';
            let tag = $(genre).text();
            tagSections[0].tags.push(createTag({ id: id, label: tag }));
        }
        let status = ($("div.summary-content").last().text() == "Completed") ? Manga_1.MangaStatus.COMPLETED : Manga_1.MangaStatus.ONGOING;
        let averageRating = $(this.ratingSelector).text().trim();
        let src = $(this.thumbnailSelector).attr(this.thumbnailAttr);
        //Not sure if that double slash happens with any Madara source, but added just in case
        src = (src === null || src === void 0 ? void 0 : src.startsWith("http")) ? src : this.MadaraDomain + (src === null || src === void 0 ? void 0 : src.replace("//", ""));
        let artist = $(this.artistSelector).text().trim();
        let description = ($("div.description-summary  div.summary__content").find("p").text() != "") ? $("div.description-summary  div.summary__content").find("p").text().replace(/<br>/g, '\n') : $("div.description-summary  div.summary__content").text();
        return [createManga({
                id: metadata.id,
                titles: titles,
                image: src,
                avgRating: Number(averageRating),
                rating: Number(averageRating),
                author: author,
                artist: artist,
                desc: description,
                status: status,
                tags: tagSections,
                langName: this.language,
                langFlag: this.langFlag
            })];
    }
    getChaptersRequest(mangaId) {
        let metadata = { 'id': mangaId };
        return createRequestObject({
            url: `${this.MadaraDomain}/manga/${mangaId}`,
            method: "GET",
            metadata: metadata
        });
    }
    getChapters(data, metadata) {
        let $ = this.cheerio.load(data);
        let chapters = [];
        for (let elem of $(this.chapterListSelector).toArray()) {
            let name = $(elem).find("a").first().text().trim();
            let id = /[0-9.]+/.exec(name)[0];
            let imgDate = $(elem).find("img").attr("alt");
            let time = (imgDate != undefined) ? this.convertTime(imgDate) : this.parseChapterDate($(elem).find("span.chapter-release-date i").first().text());
            chapters.push(createChapter({
                id: id !== null && id !== void 0 ? id : '',
                chapNum: Number(id),
                mangaId: metadata.id,
                name: name,
                time: time,
                langCode: this.langCode,
            }));
        }
        return chapters;
    }
    parseChapterDate(date) {
        if (date.toLowerCase().includes("ago")) {
            return this.convertTime(date);
        }
        if (date.toLowerCase().startsWith("yesterday")) {
            //To start it at the beginning of yesterday, instead of exactly 24 hrs prior to now
            return new Date((Math.floor(Date.now() / 86400000) * 86400000) - 86400000);
        }
        if (date.toLowerCase().startsWith("today")) {
            return new Date(Math.floor(Date.now() / 86400000) * 8640000);
        }
        if (/\d+(st|nd|rd|th)/.test(date)) {
            let match = /\d+(st|nd|rd|th)/.exec(date)[0];
            let day = match.replace(/\D/g, "");
            return new Date(date.replace(match, day));
        }
        return new Date(date);
    }
    getChapterDetailsRequest(mangaId, chId) {
        let metadata = { 'mangaId': mangaId, 'chapterId': chId, 'nextPage': false, 'page': 1 };
        return createRequestObject({
            url: `${this.MadaraDomain}/manga/${mangaId}/chapter-${chId.replace('.', '-')}`,
            method: "GET",
            metadata: metadata
        });
    }
    getChapterDetails(data, metadata) {
        var _a;
        let pages = [];
        let $ = this.cheerio.load(data);
        let pageElements = $(this.pageListSelector);
        for (let page of pageElements.toArray()) {
            pages.push(((_a = $(page)) === null || _a === void 0 ? void 0 : _a.find("img")).first().attr(this.pageImageAttr).trim());
        }
        let chapterDetails = createChapterDetails({
            id: metadata.chapterId,
            mangaId: metadata.mangaId,
            pages: pages,
            longStrip: false
        });
        return chapterDetails;
    }
    searchRequest(query, page) {
        var _a;
        let url = `${this.MadaraDomain}/page/${page}/?`;
        let author = query.author || '';
        let artist = query.artist || '';
        let genres = ((_a = query.includeGenre) !== null && _a !== void 0 ? _a : []).join(",");
        let paramaters = { "s": query.title, "post_type": "wp-manga", "author": author, "artist": artist, "genres": genres };
        return createRequestObject({
            url: url + new URLSearchParams(paramaters).toString(),
            method: 'GET'
        });
    }
    search(data) {
        var _a, _b;
        let $ = this.cheerio.load(data);
        let mangas = [];
        for (let manga of $(this.searchMangaSelector).toArray()) {
            let id = (_b = (_a = $("div.post-title a", manga).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/")[4]) !== null && _b !== void 0 ? _b : '';
            if (!id.endsWith("novel")) {
                let cover = $("img", manga).first().attr(this.searchCoverAttr);
                cover = (cover === null || cover === void 0 ? void 0 : cover.startsWith("http")) ? cover : this.MadaraDomain + (cover === null || cover === void 0 ? void 0 : cover.replace("//", "/"));
                let title = $("div.post-title a", manga).text();
                let author = $("div.summary-content > a[href*=manga-author]", manga).text().trim();
                let alternatives = $("div.summary-content", manga).first().text().trim();
                mangas.push(createMangaTile({
                    id: id,
                    image: cover,
                    title: createIconText({ text: title !== null && title !== void 0 ? title : '' }),
                    subtitleText: createIconText({ text: author !== null && author !== void 0 ? author : '' })
                }));
            }
        }
        return mangas;
    }
}
exports.Madara = Madara;

},{"../models/Manga":6,"./Source":2}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * An optional field where the author may put a link to their website
     */
    get authorWebsite() { return null; }
    /**
     * An optional field that defines the language of the extension's source
     */
    get language() { return 'all'; }
    /**
     * An optional field of source tags: Little bits of metadata which is rendered on the website
     * under your repositories section
     */
    get sourceTags() { return []; }
    // <-----------        OPTIONAL METHODS        -----------> //
    /**
     * Returns the number of calls that can be done per second from the application
     * This is to avoid IP bans from many of the sources
     * Can be adjusted per source since different sites have different limits
     */
    get rateLimit() { return 2; }
    requestModifier(request) { return request; }
    getMangaShareUrl(mangaId) { return null; }
    /**
     * (OPTIONAL METHOD) Different sources have different tags available for searching. This method
     * should target a URL which allows you to parse apart all of the available tags which a website has.
     * This will populate tags in the iOS application where the user can use
     * @returns A request object which can provide HTML for determining tags that a source uses
     */
    getTagsRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which should handle parsing apart HTML returned from {@link Source.getTags}
     * and generate a list of {@link TagSection} objects, determining what sections of tags an app has, as well as
     * what tags are associated with each section
     * @param data HTML which can be parsed to get tag information
     */
    getTags(data) { return null; }
    /**
     * (OPTIONAL METHOD) A function which should handle generating a request for determining whether or
     * not a manga has been updated since a specific reference time.
     * This method is different depending on the source. A current implementation for a source, as example,
     * is going through multiple pages of the 'latest' section, and determining whether or not there
     * are entries available before your supplied date.
     * @param ids The manga IDs which you are searching for updates on
     * @param time A {@link Date} marking the point in time you'd like to search up from.
     * Eg, A date of November 2020, when it is currently December 2020, should return all instances
     * of the image you are searching for, which has been updated in the last month
     * @param page A page number parameter may be used if your update scanning requires you to
     * traverse multiple pages.
     */
    filterUpdatedMangaRequest(ids, time, page) { return null; }
    /**
     * (OPTIONAL METHOD) A function which should handle parsing apart HTML returned from {@link Source.filterUpdatedMangaRequest}
     * and generate a list manga which has been updated within the timeframe specified in the request.
     * @param data HTML which can be parsed to determine whether or not a Manga has been updated or not
     * @param metadata Anything passed to the {@link Request} object in {@link Source.filterUpdatedMangaRequest}
     * with the key of metadata will be available to this method here in this parameter
     * @returns A list of mangaID which has been updated. Also, a nextPage parameter is required. This is a flag
     * which should be set to true, if you need to traverse to the next page of your search, in order to fully
     * determine whether or not you've gotten all of the updated manga or not. This will increment
     * the page number in the {@link Source.filterUpdatedMangaRequest} method and run it again with the new
     * parameter
     */
    filterUpdatedManga(data, metadata) { return null; }
    /**
     * (OPTIONAL METHOD) A function which should generate a {@link HomeSectionRequest} with the intention
     * of parsing apart a home page of a source, and grouping content into multiple categories.
     * This does not exist for all sources, but sections you would commonly see would be
     * 'Latest Manga', 'Hot Manga', 'Recommended Manga', etc.
     * @returns A list of {@link HomeSectionRequest} objects. A request for search section on the home page.
     * It is likely that your request object will be the same in all of them.
     */
    getHomePageSectionRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which should handle parsing apart HTML returned from {@link Source.getHomePageSectionRequest}
     * and finish filling out the {@link HomeSection} objects.
     * Generally this simply should update the parameter obejcts with all of the correct contents, and
     * return the completed array
     * @param data The HTML which should be parsed into the {@link HomeSection} objects. There may only be one element in the array, that is okay
     * if only one section exists
     * @param section The list of HomeSection objects which are unfinished, and need filled out
     */
    getHomePageSections(data, section) { return null; }
    /**
     * (OPTIONAL METHOD) For many of the home page sections, there is an ability to view more of that selection
     * Calling this function should generate a {@link Request} targeting a new page of a given key
     * @param key The current page that is being viewed
     * @param page The page number which you are currently searching
     */
    getViewMoreRequest(key, page) { return null; }
    /**
     * (OPTIONAL METHOD) A function which should handle parsing apart a page
     * and generate different {@link MangaTile} objects which can be found on it
     * @param data HTML which should be parsed into a {@link MangaTile} object
     * @param key
     */
    getViewMoreItems(data, key) { return null; }
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

},{}],3:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./Madara"));
__export(require("./Source"));

},{"./Madara":1,"./Source":2}],4:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./base"));
__export(require("./models"));

},{"./base":3,"./models":8}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Info is blue, success is green, warning is yellow and danger is red.
 */
var TagType;
(function (TagType) {
    TagType["WARNING"] = "warning";
    TagType["INFO"] = "info";
    TagType["SUCCESS"] = "success";
    TagType["DANGER"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],8:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./Manga"));
__export(require("./SourceTag"));
__export(require("./Languages"));

},{"./Languages":5,"./Manga":6,"./SourceTag":7}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NHENTAI_DOMAIN = 'https://nhentai.net';
class NHentai extends paperback_extensions_common_1.Source {
    constructor(cheerio) {
        super(cheerio);
    }
    get version() { return '0.8.3'; }
    get name() { return 'nHentai'; }
    get description() { return 'Extension that pulls manga from nHentai'; }
    get author() { return 'Conrad Weiser'; }
    get authorWebsite() { return 'http://github.com/conradweiser'; }
    get icon() { return "logo.png"; } // The website has SVG versions, I had to find one off of a different source
    get hentaiSource() { return true; }
    getMangaShareUrl(mangaId) { return `https://nhentai.net/g/${mangaId}`; }
    convertLanguageToCode(language) {
        switch (language.toLowerCase()) {
            case "english": return paperback_extensions_common_1.LanguageCode.ENGLISH;
            case "japanese": return paperback_extensions_common_1.LanguageCode.JAPANESE;
            case "chinese": return paperback_extensions_common_1.LanguageCode.CHINEESE;
            default: return paperback_extensions_common_1.LanguageCode.UNKNOWN;
        }
    }
    getMangaDetailsRequest(ids) {
        let requests = [];
        for (let id of ids) {
            let metadata = { 'id': id };
            requests.push(createRequestObject({
                url: `${NHENTAI_DOMAIN}/g/${id}`,
                metadata: metadata,
                method: 'GET'
            }));
        }
        return requests;
    }
    getMangaDetails(data, metadata) {
        var _a, _b, _c, _d, _e, _f;
        let manga = [];
        let $ = this.cheerio.load(data);
        let info = $('[itemprop=name]');
        let image = (_a = $('[itemprop=image]').attr('content')) !== null && _a !== void 0 ? _a : '';
        let title = (_b = $('[itemprop=name]').attr('content')) !== null && _b !== void 0 ? _b : '';
        // Comma seperate all of the tags and store them in our tag section 
        let tagSections = [createTagSection({ id: '0', label: 'tag', tags: [] })];
        let tags = (_d = (_c = $('meta[name="twitter:description"]').attr('content')) === null || _c === void 0 ? void 0 : _c.split(",")) !== null && _d !== void 0 ? _d : [];
        tagSections[0].tags = tags.map((elem) => createTag({ id: elem.trim(), label: elem.trim() }));
        // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
        title = title.replace(/(\[.+?\])/g, "").trim();
        // Grab the alternative titles
        let titles = [title];
        let altTitleBlock = $('#info');
        let altNameTop = (_e = $('h1', altTitleBlock).text()) !== null && _e !== void 0 ? _e : '';
        let altNameBottom = (_f = $('h2', altTitleBlock).text()) !== null && _f !== void 0 ? _f : '';
        if (altNameTop) {
            titles.push(altNameTop.trim());
        }
        if (altNameBottom) {
            titles.push(altNameBottom.trim());
        }
        // Get the artist and language information
        let context = $("#info-block");
        let artist = '';
        let language = '';
        for (let item of $('.tag-container', context).toArray()) {
            if ($(item).text().indexOf("Artists") > -1) {
                let temp = $("a", item).text();
                artist = temp.substring(0, temp.search(/\d/));
            }
            else if ($(item).text().indexOf("Languages") > -1) {
                let temp = $("a", item);
                if (temp.toArray().length > 1) {
                    let temptext = $(temp.toArray()[1]).text();
                    language = temptext.substring(0, temptext.indexOf(" ("));
                }
                else {
                    let temptext = temp.text();
                    language = temptext.substring(0, temptext.indexOf(" ("));
                }
            }
        }
        let status = 1;
        let hentai = true; // I'm assuming that's why you're here!
        manga.push(createManga({
            id: metadata.id,
            titles: titles,
            image: image,
            rating: 0,
            status: status,
            artist: artist,
            tags: tagSections,
            hentai: hentai
        }));
        return manga;
    }
    getChaptersRequest(mangaId) {
        let metadata = { 'id': mangaId };
        return createRequestObject({
            url: `${NHENTAI_DOMAIN}/g/${mangaId}`,
            method: "GET",
            metadata: metadata
        });
    }
    getChapters(data, metadata) {
        var _a, _b;
        let $ = this.cheerio.load(data);
        let chapters = [];
        // NHentai is unique, where there is only ever one chapter.
        let title = (_a = $('[itemprop=name]').attr('content')) !== null && _a !== void 0 ? _a : '';
        let time = new Date((_b = $('time').attr('datetime')) !== null && _b !== void 0 ? _b : '');
        // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
        title = title.replace(/(\[.+?\])/g, "").trim();
        // Get the correct language code
        let language = paperback_extensions_common_1.LanguageCode.UNKNOWN;
        for (let item of $('.tag-container').toArray()) {
            if ($(item).text().indexOf("Languages") > -1) {
                let langs = $('span', item).text();
                if (langs.includes("japanese")) {
                    language = paperback_extensions_common_1.LanguageCode.JAPANESE;
                    break;
                }
                else if (langs.includes("english")) {
                    language = paperback_extensions_common_1.LanguageCode.ENGLISH;
                    break;
                }
                else if (langs.includes("chinese")) {
                    language = paperback_extensions_common_1.LanguageCode.CHINEESE;
                    break;
                }
            }
        }
        chapters.push(createChapter({
            id: "1",
            mangaId: metadata.id,
            name: title,
            chapNum: 1,
            time: time,
            langCode: language,
        }));
        return chapters;
    }
    getChapterDetailsRequest(mangaId, chapId) {
        let metadata = { 'mangaId': mangaId, 'chapterId': chapId };
        return createRequestObject({
            url: `${NHENTAI_DOMAIN}/g/${mangaId}`,
            metadata: metadata,
            method: 'GET',
        });
    }
    getChapterDetails(data, metadata) {
        var _a;
        let $ = this.cheerio.load(data);
        // Get the number of chapters, we can generate URLs using that as a basis
        let pages = [];
        let thumbContainer = $("#thumbnail-container");
        let numChapters = $('.thumb-container', thumbContainer).length;
        // Get the gallery number that it is assigned to
        let gallerySrc = $('img', thumbContainer).attr('data-src');
        // We can regular expression match out the gallery ID from this string
        let galleryId = parseInt((gallerySrc === null || gallerySrc === void 0 ? void 0 : gallerySrc.match(/.*\/(\d*)\//))[1]);
        // Get all of the pages
        let counter = 1;
        for (let obj of $($('img', '.thumb-container')).toArray()) {
            let imageType = ((_a = $(obj).attr('data-src')) === null || _a === void 0 ? void 0 : _a.match(/\.([png|jpg]{3,3})/g))[0];
            pages.push(`https://i.nhentai.net/galleries/${galleryId}/${counter}${imageType}`);
            counter++;
        }
        let chapterDetails = createChapterDetails({
            id: metadata.chapterId,
            mangaId: metadata.mangaId,
            pages: pages,
            longStrip: false
        });
        return chapterDetails;
    }
    searchRequest(query, page) {
        var _a;
        // If h-sources are disabled for the search request, always return null
        if (query.hStatus === false) {
            return null;
        }
        // If the search query is a six digit direct link to a manga, create a request to just that URL and alert the handler via metadata
        if ((_a = query.title) === null || _a === void 0 ? void 0 : _a.match(/\d{5,6}/)) {
            return createRequestObject({
                url: `${NHENTAI_DOMAIN}/g/${query.title}`,
                metadata: { sixDigit: true },
                timeout: 4000,
                method: "GET"
            });
        }
        // Concat all of the available options together into a search keyword which can be supplied as a GET request param
        let param = '';
        if (query.title) {
            param += query.title.replace(" ", "+") + '+';
        }
        if (query.includeContent) {
            for (let content in query.includeContent) {
                param += ('tag:"' + query.includeContent[content].replace(" ", "+") + '"+');
            }
        }
        if (query.excludeContent) {
            for (let content in query.excludeContent) {
                param += ('-tag:"' + query.excludeContent[content].replace(" ", "+") + '"+');
            }
        }
        if (query.artist) {
            param += ("Artist:" + query.artist.replace(" ", "+") + "+");
        }
        param = param.trim();
        param = encodeURI(param);
        return createRequestObject({
            url: `${NHENTAI_DOMAIN}/search/?q=${param}&page=${page}`,
            metadata: { sixDigit: false },
            timeout: 4000,
            method: "GET"
        });
    }
    search(data, metadata) {
        var _a, _b, _c;
        let $ = this.cheerio.load(data);
        let mangaTiles = [];
        // Was this a six digit request? 
        if (metadata.sixDigit) {
            // Retrieve the ID from the body
            let contextNode = $('#bigcontainer');
            let href = $('a', contextNode).attr('href');
            let mangaId = parseInt((href === null || href === void 0 ? void 0 : href.match(/g\/(\d*)\/\d/))[1]);
            let title = (_a = $('[itemprop=name]').attr('content')) !== null && _a !== void 0 ? _a : '';
            // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
            title = title.replace(/(\[.+?\])/g, "").trim();
            mangaTiles.push(createMangaTile({
                id: mangaId.toString(),
                title: createIconText({ text: title }),
                image: (_b = $('[itemprop=image]').attr('content')) !== null && _b !== void 0 ? _b : ''
            }));
            return mangaTiles;
        }
        let containerNode = $('.index-container');
        for (let item of $('.gallery', containerNode).toArray()) {
            let currNode = $(item);
            let image = $('img', currNode).attr('data-src');
            // If image is undefined, we've hit a lazyload part of the website. Adjust the scraping to target the other features
            if (image == undefined) {
                image = 'http:' + $('img', currNode).attr('src');
            }
            let title = $('.caption', currNode).text();
            let idHref = (_c = $('a', currNode).attr('href')) === null || _c === void 0 ? void 0 : _c.match(/\/(\d*)\//);
            // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
            title = title.replace(/(\[.+?\])/g, "").trim();
            mangaTiles.push(createMangaTile({
                id: idHref[1],
                title: createIconText({ text: title }),
                image: image
            }));
        }
        return mangaTiles;
    }
    getTagsRequest() {
        return createRequestObject({
            url: `${NHENTAI_DOMAIN}/tags/popular`,
            timeout: 4000,
            method: "GET"
        });
    }
    getTags(data) {
        let tagCategoryId = 'Popular'; // There are no tag categories, just 'tags', as we're parsing the first page of popular tags, just label it as popular
        let tagLabel = 'Popular';
        let tagSection = createTagSection({
            id: tagCategoryId,
            label: tagLabel,
            tags: []
        });
        let $ = this.cheerio.load(data);
        let container = $("#tag-container");
        for (let item of $('a', container).toArray()) {
            let currNode = $(item);
            // Grab the tag and add it to the list
            let tagName = currNode.text(); // Consider pulling the legitimate tag IDs instead of the names?
            // Tags come in the form 'Sole female (99,999) or some form of numbers in parenths. Remove that from the string
            tagName = tagName.replace(/\(\d*,*\d*\)/, "").trim();
            tagSection.tags.push(createTag({
                id: tagName,
                label: tagName
            }));
        }
        return [tagSection];
    }
    getHomePageSectionRequest() {
        let request = createRequestObject({ url: `${NHENTAI_DOMAIN}`, method: 'GET', });
        let homeSection = createHomeSection({ id: 'latest_hentai', title: 'LATEST HENTAI', view_more: true });
        return [createHomeSectionRequest({ request: request, sections: [homeSection] })];
    }
    getHomePageSections(data, section) {
        var _a;
        let updatedHentai = [];
        let $ = this.cheerio.load(data);
        let containerNode = $('.index-container');
        for (let item of $('.gallery', containerNode).toArray()) {
            let currNode = $(item);
            let image = $('img', currNode).attr('data-src');
            // If image is undefined, we've hit a lazyload part of the website. Adjust the scraping to target the other features
            if (image == undefined) {
                image = 'http:' + $('img', currNode).attr('src');
            }
            // Clean up the title by removing all metadata, these are items enclosed within [ ] brackets
            let title = $('.caption', currNode).text();
            title = title.replace(/(\[.+?\])/g, "").trim();
            let idHref = (_a = $('a', currNode).attr('href')) === null || _a === void 0 ? void 0 : _a.match(/\/(\d*)\//);
            updatedHentai.push(createMangaTile({
                id: idHref[1],
                title: createIconText({ text: title }),
                image: image
            }));
        }
        section[0].items = updatedHentai;
        return section;
    }
    getViewMoreRequest(key, page) {
        return createRequestObject({
            url: `${NHENTAI_DOMAIN}/?page=${page}`,
            method: 'GET'
        });
    }
    getViewMoreItems(data, key) {
        var _a;
        let tiles = this.getHomePageSections(data, [createHomeSection({ id: 'latest_hentai', title: 'LATEST HENTAI' })]);
        return (_a = tiles[0].items) !== null && _a !== void 0 ? _a : null;
    }
}
exports.NHentai = NHentai;

},{"paperback-extensions-common":4}]},{},[9])(9)
});
