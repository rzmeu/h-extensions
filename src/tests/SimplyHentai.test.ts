import cheerio from 'cheerio'
import {APIWrapper, Source, MangaTile, SearchRequest, Tag} from 'paperback-extensions-common';
import { SimplyHentai } from '../SimplyHentai/SimplyHentai';

describe('SimplyHentai Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new SimplyHentai(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can 
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "堀川雷鼓さんはバイトを始めた";

    it("Testing HomePageSections", async () => {
        let homePageSections = await wrapper.getHomePageSections(source);

        expect(homePageSections, "No response from server").to.exist;
        expect(homePageSections[0], "No 'New Mangas' section available").to.exist;
        expect(homePageSections[1], "No 'Hot Mangas' section available").to.exist;
        expect(homePageSections[2], "No 'Top Rated' section available").to.exist;
        expect(homePageSections[3], "No 'Most Viewed' section available").to.exist;

        let tile = homePageSections[0].items as [MangaTile];
        //mangaId = tile[0].id
    }).timeout(10000);

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, mangaId);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.exist;

        // Validate that the fields are filled
        let data = details;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.status, "Missing Status").to.exist;
        expect(data.author, "Missing Author").to.be.not.empty;
        expect(data.desc, "Missing Description").to.be.not.empty;
        expect(data.titles, "Missing Titles").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
    }).timeout(10000);

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaId);

        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

        let entry = data[0];
        expect(entry.id, "No ID present").to.not.be.empty;
        expect(entry.time, "No date present").to.exist;
        expect(entry.name, "No title available").to.not.be.empty;
        expect(entry.chapNum, "No chapter number present").to.exist;
    });


    it("Get Chapter Details", async () => {

        let chapters = await wrapper.getChapters(source, mangaId);
        let data = await wrapper.getChapterDetails(source, mangaId, "1");

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Testing home page results for New titles", async () => {
        let results = await wrapper.getViewMoreItems(source, "newest", {}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing home page results for Hot titles", async () => {
        let results = await wrapper.getViewMoreItems(source, "spotlight", {nextPage: 1}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing home page results for In Top Rated titles", async () => {
        let results = await wrapper.getViewMoreItems(source, "top-rated", {nextPage: 1}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing home page results for Most Viewed titles", async () => {
        let results = await wrapper.getViewMoreItems(source, "most-viewed", {nextPage: 1}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing home page results for New titles second page", async () => {
        let results = await wrapper.getViewMoreItems(source, "newest", {nextPage: 2}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing search by Tag", async () => {
        const tag: Tag = {
            id: 'sole-female',
            label: 'sole female'
        };

        const searchRequest: SearchRequest = {
            includedTags: [tag],
            parameters: {}
        };

        let search = await wrapper.searchRequest(source, searchRequest, { nextPage: 1 });
        let result = search.results[0];

        expect(result, "No response from server").to.exist;
        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
    });

    it("Testing search by Query", async () => {
        const searchRequest: SearchRequest = {
            title: 'dark',
            parameters: {}
        };

        let search = await wrapper.searchRequest(source, searchRequest, { nextPage: 1 });
        let result = search.results[0];

        expect(result, "No response from server").to.exist;
        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
    });

    it("Testing Home-Page acquisition", async () => {
        let homePages = await wrapper.getHomePageSections(source);
        expect(homePages, "No response from server").to.exist;
        expect(homePages[0], "No staff pick section available").to.exist;
        expect(homePages[1], "No recently added section available").to.exist;
        expect(homePages[2], "No trending section available").to.exist;
    });

    it("Get tags", async () => {
        let tags = await wrapper.getTags(source);
        expect(tags, "No server response").to.exist;
        expect(tags, "Empty server response").to.not.be.empty;
    });

});