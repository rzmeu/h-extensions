import cheerio from 'cheerio'
import { Toonily } from "../Toonily/Toonily";
import { APIWrapper, Source } from 'paperback-extensions-common';

describe('Toonily Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new Toonily(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    var axios = require('axios')

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can 
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "liliths-cord-001"; 

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, [mangaId]);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.be.an('array');
        expect(details).to.not.have.lengthOf(0, "Empty response from server");

        // Validate that the fields are filled
        let data = details[0];
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.status, "Missing Status").to.exist;
        expect(data.desc, "Missing Description").to.be.not.empty;
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, '2517');
        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;
    });
    
//     it("Fuked", async() => {
//         let data = await axios.get('https://toonily.com/webtoon/liliths-cord-001/chapter-85/')
//         console.log(data)
// })

    it("Get Chapter Details", async () => {

        let chapters = await wrapper.getChapters(source, '2517');
        let data = await wrapper.getChapterDetails(source, '2517', chapters[0].id);

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Searching for Manga", async () => {
        let testSearch = createSearchRequest({
            title: 'Hero',
        });

        let search = await wrapper.search(source, testSearch, 1);
        let result = search[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.primaryText, "No primary text").to.be.not.null;

    });

    it("Searching for Manga With Invalid titles", async () => {
        let testSearch = createSearchRequest({
            title: 'asebrgfluiawntfw3i4yn5834sdfjhg34t',
        });

        let search = await wrapper.search(source, testSearch, 1);
        let result = search[0];
        expect(result).to.not.exist;    // There should be no entries with this tag!
    });

    it("Retrieving home sections", async() => {
        let homeSections = await wrapper.getHomePageSections(source)
        let result = homeSections[0]
        expect(result).to.exist

        expect(result.id, "HomeSection does not have a valid ID").to.not.be.empty
        
        for(let obj of result.items) {
            expect(obj.id, "Homesection item does not have a valid ID").to.not.be.empty
            expect(obj.image, "Homesection item does not have a valid image").to.not.be.empty
            expect(obj.title, "Homesection item does not have a valid title").to.not.be.empty
            expect(obj.primaryText.text, "Homesection item did not parse rating correctly").to.not.be.empty
        }
    })
});