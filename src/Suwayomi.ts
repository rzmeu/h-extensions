import {
  Chapter,
  ChapterDetails,
  ContentRating,
  HomeSection, LanguageCode,
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
  parseTags
} from "./SuwayomiParser"

const method = 'GET';
export const API_ENDPOINT = 'http://192.168.1.169:4567/api/v1';


export abstract class Suwayomi extends Source {
  abstract sourceId: string;
  abstract languageCode: LanguageCode;
  abstract isNsfw: boolean;
  abstract supportsLatest: boolean;

  getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
    throw new Error("Method not implemented.");
  }
  requestManager = createRequestManager({
    requestsPerSecond: 2,
    requestTimeout: 15000,
  });

  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    const sections: HomeSection[] = [];
    if(this.supportsLatest) {
      sections.push(createHomeSection({ id: 'latest', title: 'Latest', view_more: true }));
    }

    sections.push(createHomeSection({ id: 'popular', title: 'Popular', view_more: true }));

    for(const section of sections) {
      const sectionPagedResult = await this.getViewMoreItems(section.id, {nextPage: 1});
      section.items = sectionPagedResult?.results;
      sectionCallback(section)
    }
  }

  async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.nextPage || 1;

    const request = createRequestObject({
      url: `${API_ENDPOINT}/source/${this.sourceId}/${homepageSectionId}/${page}`,
      method
    });

    const response = await this.requestManager.schedule(request, 1);

    const nextPage = page + 1;

    return createPagedResults({
      results: parseMangaItems(this.extractResultFromResponse(response)),
      metadata: {nextPage: nextPage}
    });
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const request = createRequestObject({
      url: `${API_ENDPOINT}/manga/${mangaId}/?onlineFetch=false`,
      method
    });

    const response = await this.requestManager.schedule(request, 1);

    return parseMangaDetails(this.extractResultFromResponse(response));
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: `${API_ENDPOINT}/manga/${mangaId}/chapters?onlineFetch=false`,
      method
    });

    const response = await this.requestManager.schedule(request, 2);

    return parseChapters(this.extractResultFromResponse(response));
  }

  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    const request = createRequestObject({
      url: `${API_ENDPOINT}/manga/${mangaId}/chapter/${chapterId}`,
      method
    });

    const response = await this.requestManager.schedule(request, 1);
    const result = this.extractResultFromResponse(response);

    return parseChapterDetails(result, mangaId, chapterId)
  }

  async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.nextPage || 1;

    const request = createRequestObject({
      url: `${API_ENDPOINT}/source/${this.sourceId}/search?searchTerm=${query.title}&pageNum=${page}`,
      method
    });

    const response = await this.requestManager.schedule(request, 1);

    const nextPage = page + 1;

    return createPagedResults({
      results: parseMangaItems(this.extractResultFromResponse(response)),
      metadata: {nextPage: nextPage}
    });

  }

  async getSearchTags?(): Promise<TagSection[]> {
    const request = createRequestObject({
      url: `${API_ENDPOINT}/source/${this.sourceId}/filters?reset=false`,
      method
    });

    const response = await this.requestManager.schedule(request, 1);
    const result = this.extractResultFromResponse(response);

    return parseTags(result);
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