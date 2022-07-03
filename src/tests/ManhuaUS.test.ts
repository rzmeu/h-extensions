import cheerio from 'cheerio'
import {APIWrapper, Source, MangaTile, SearchRequest, Tag} from 'paperback-extensions-common';
import {ManhuaUS} from "../ManhuaUS/ManhuaUS";

describe('ManhuaUS Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new ManhuaUS(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can 
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "4641";

    it("Testing HomePageSections", async () => {
        let homePageSections = await wrapper.getHomePageSections(source);

        expect(homePageSections, "No response from server").to.exist;
        expect(homePageSections[0], "No 'Latest' section available").to.exist;
        expect(homePageSections[1], "No 'Popular' section available").to.exist;

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
        let data = await wrapper.getChapterDetails(source, mangaId, "1");

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    }).timeout(10000);

    it("Testing home page results for Latest", async () => {
        let results = await wrapper.getViewMoreItems(source, "latest", {}, 1);

        expect(results, "No results whatsoever for this section").to.exist;
        expect(results, "Results are empty").to.not.be.empty;

        let data = results![0];
        expect(data.id, "No ID present").to.exist;
        expect(data.image, "No image present").to.exist;
        expect(data.title.text, "No title present").to.exist;
    });

    it("Testing home page results for Popular", async () => {
        let results = await wrapper.getViewMoreItems(source, "popular", {nextPage: 1}, 1);

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

    it("Get tags", async () => {
        let tags = await wrapper.getTags(source);
        expect(tags, "No server response").to.exist;
        expect(tags, "Empty server response").to.not.be.empty;
    });

});