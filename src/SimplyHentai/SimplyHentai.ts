import {
  Chapter,
  ChapterDetails,
  ContentRating,
  HomeSection,
  Manga,
  PagedResults,
  SearchRequest,
  Source,
  SourceInfo,
  TagSection,
  TagType,
} from "paperback-extensions-common"
import {
  parseChapterDetails,
  parseChapters,
  parseMangaDetails,
  parseMangaItems,
  parseSearchMangaItems,
  getTags
} from "./SimplyHentaiParser"

const SH_DOMAIN = 'https://www.simply-hentai.com';
const API_URL = 'https://api.simply-hentai.com/v3';
const method = 'GET';

export const SimplyHentaiInfo: SourceInfo = {
  version: '1.0.2',
  name: 'SimplyHentai',
  icon: 'icon.png',
  author: 'chronos',
  authorWebsite: 'https://github.com/rzmeu',
  description: 'Extension that pulls manga from SimplyHentai',
  contentRating: ContentRating.ADULT,
  websiteBaseURL: SH_DOMAIN,
  sourceTags: [
    {
      text: "18+",
      type: TagType.YELLOW
    }
  ]
};

export class SimplyHentai extends Source {
    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        throw new Error("Method not implemented.");
    }
  requestManager = createRequestManager({
    requestsPerSecond: 2,
    requestTimeout: 15000,
  });

  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    const section1 = createHomeSection({ id: 'newest', title: 'New Mangas', view_more: true });
    const section2 = createHomeSection({ id: 'spotlight', title: 'Hot Mangas', view_more: true });
    const section3 = createHomeSection({ id: 'top-rated', title: 'Top Rated', view_more: true });
    const section4 = createHomeSection({ id: 'most-viewed', title: 'Most Viewed', view_more: true });
    const sections = [section1, section2, section3, section4];

    for(const section of sections) {
      const sectionPagedResult = await this.getViewMoreItems(section.id, {nextPage: 1});
      section.items = sectionPagedResult?.results;
      sectionCallback(section)
    }
  }

  async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.nextPage || 1;
    let param = `/albums?si=0&locale=en&sort=${homepageSectionId}&page=${page}`;

    const request = createRequestObject({
      url: API_URL,
      method,
      param
    });

    const response = await this.requestManager.schedule(request, 1);

    const nextPage = page + 1;

    return createPagedResults({
      results: parseMangaItems(this.extractResultFromResponse(response)),
      metadata: {nextPage: nextPage}
    });
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    let id = encodeURI(mangaId)
    const request = createRequestObject({
      url: `${API_URL}/album/${id}?si=0&locale=en`,
      method,
      param: id
    });

    const response = await this.requestManager.schedule(request, 1);

    return parseMangaDetails(this.extractResultFromResponse(response));
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    return parseChapters(mangaId);
  }

  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    let id = encodeURI(mangaId)
    const request = createRequestObject({
      url: `${API_URL}/album/${id}/pages?si=0&locale=en`,
      method,
      param: id,
    });

    const response = await this.requestManager.schedule(request, 1);
    const result = this.extractResultFromResponse(response);

    return parseChapterDetails(result, mangaId, chapterId)
  }

  async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.nextPage || 1;
    let param: string = `/search/complex?si=0&locale=en&page=${page}`;

    if(query.title) {
      param += `&query=${query.title}`;
    } else if(query.includedTags) {
      for(let i = 0; i < query.includedTags.length; i++) {
        param += `&filter[tags][${i}]=${query.includedTags[i].id}`
      }
    }

    const request = createRequestObject({
      url: API_URL,
      method: method,
      param: encodeURI(param),
      metadata: {nextPage: page + 1}
    });

    const response = await this.requestManager.schedule(request, 1);

    return createPagedResults({
      results: parseSearchMangaItems(this.extractResultFromResponse(response)),
      metadata: {nextPage: page + 1}
    });
  }

  async getSearchTags?(): Promise<TagSection[]> {
    return getTags();
  }
  
  extractResultFromResponse = (response: any): any => {
    if (response.status > 400) {
      throw new Error(
        `Failed to fetch data on getMangaDetails with status code: ` +
          response.status
      )
    }

    const result =
      typeof response.data === "string" || typeof response.data !== "object"
        ? JSON.parse(response.data)
        : response.data;

    if (!result)
      throw new Error(`Failed to parse the response on getMangaDetails.`);

      return result;
  }
}