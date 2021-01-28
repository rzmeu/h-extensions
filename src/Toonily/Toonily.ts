
import { Source, Manga, MangaStatus, Tag, Chapter, ChapterDetails, HomeSectionRequest, HomeSection, MangaTile, SearchRequest, MangaUpdates, LanguageCode, Request, SourceTag, TagType, PagedResults } from "paperback-extensions-common"

const TOONILY_DOMAIN = 'https://toonily.com'

export class Toonily extends Source {
  constructor(cheerio: CheerioAPI) {
    super(cheerio)
  }

  get version(): string { return '1.1.24' }
  get name(): string { return 'Toonily' }
  get description(): string { return 'Source full of Korean Manhwa content. Contains both 18+ and non-18+ material.' }
  get author(): string { return 'Conrad Weiser' }
  get authorWebsite(): string { return 'http://github.com/conradweiser' }
  get icon(): string { return "logo.png" }
  get hentaiSource(): boolean { return false }
  get sourceTags(): SourceTag[] { return [{ text: "18+", type: TagType.YELLOW }, {text: "Buggy", type: TagType.RED}] }
  get websiteBaseURL(): string { return TOONILY_DOMAIN }

  // Set the ratelimit to 2 to test an extreme case
  get rateLimit(): Number { return 1 }


  getMangaDetailsRequest(ids: string[]): Request[] {
    let requests: Request[] = []
    for (let id of ids) {

      let metadata = { 'id': id }
      requests.push(createRequestObject({
        url: `${TOONILY_DOMAIN}/read/${metadata.id}`,
        cookies: [{
          name: 'wpmanga-adault',
          value: '1',
          domain: 'toonily.com',
          path: '/'
        }],
        metadata: metadata,
        method: 'GET'
      }))
    }

    return requests
  }

  getMangaDetails(data: any, metadata: any): Manga[] {

  let $ = this.cheerio.load(data)

  let title = $('div.post-title h1').first().text().replace("\\n", '').trim()
  let author = $('div.author-content').first().text().replace("\\n", '').trim()
  let artist = $('div.artist-content').first().text().replace("\\n", '').trim()

  let summaryContext = $('div.description-summary div.summary__content')
  let summary = $('p', summaryContext).text()

  let image = $('div.summary_image img').first().attr('data-src')
  let status = $('div.summary-content').last().text().replace("\n", '').replace("\t", '')
  let rating = $('.total_votes').text().replace('Your Rating', '')

  let genres: Tag[] = []
  for(let obj of $('div.genres-content a').toArray()) {
      let genre = $(obj).text()
      genres.push(createTag({id: genre, label: genre}))
  }

  return [createManga({
      id: metadata.id,
      titles: [title],
      image: image ?? '',
      author: author,
      artist: artist,
      desc: summary,
      tags: [createTagSection({id: 'genres', label: 'genres', tags: genres})],
      rating: Number(rating),
      status: status == "OnGoing" ? MangaStatus.ONGOING : MangaStatus.COMPLETED
  })]
    }
  

  getChaptersRequest(mangaId: string): Request {

    let metadata = { 'id': mangaId }
    return createRequestObject({
      url: `${TOONILY_DOMAIN}/webtoon/${mangaId}`,
      metadata: metadata,
      method: 'GET'
    })
  }

  getChapters(data: any, metadata: any): Chapter[] {
    let $ = this.cheerio.load(data)
    let chapters: Chapter[] = []

    for(let obj of $('li.wp-manga-chapter  ', $('ul.version-chap')).toArray()) {

        let id = $('a', obj).attr('href')?.match(/(chapter-\d+)/)
        if(id === null || id === undefined || id[0] === undefined) {
            continue
        }

        chapters.push(createChapter({
            id: id[0],
            mangaId: metadata.id,
            chapNum: Number($(obj).text().replace(/\D/g, '')),
            langCode: LanguageCode.ENGLISH,     // Is this right?
        }))
    }
    return chapters
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {

    let metadata = { 'mangaId': mangaId, 'chapterId': chapId }

    return createRequestObject({
      url: `${TOONILY_DOMAIN}/webtoon/${mangaId}/${chapId}/`,
      metadata: metadata,
      cookies: [{
        name: 'wpmanga-adault',
        value: '1',
        domain: 'toonily.com',
        path: '/'
      }],
      method: 'GET',
    })
  }

  getChapterDetails(data: any, metadata: any): ChapterDetails {

    let $ = this.cheerio.load(data)

    let pages: string[] = []
    for(let obj of $('div.page-break').toArray()) {
        let pageUrl = $('img', $(obj)).attr('data-src')?.trim() ?? ''
        pageUrl = pageUrl.substr(pageUrl.indexOf('https'))

        if(pageUrl == '') {
            console.log("Failed to parse Toonily chapter detail")
            continue
        }

        pages.push(pageUrl)

    }

    return createChapterDetails({
      id: metadata.chapterId,
      mangaId: metadata.mangaId,
      pages: pages,
      longStrip: true
    })
  }


  searchRequest(query: SearchRequest): Request {
    query.title = query.title?.replace(" ", "+")
    return createRequestObject({
      //https://toonily.com/?s=Hero&post_type=wp-manga
      url: `${TOONILY_DOMAIN}/page/${0}/?s=${query.title}&post_type=wp-manga`,
      method: "GET"
    })
  }

  search(data: any, metadata: any): PagedResults {

    let $ = this.cheerio.load(data)

    let results: MangaTile[] = []
    
    for(let obj of $('div.c-tabs-item__content').toArray()) {
        let idContext = $('a', $('h3.h4', $(obj))).attr('href')
        if(!idContext) {
            continue
        }

        let idParse = idContext.match(/\/read\/(.+)\//)
        if(idParse === null || !idParse[0]) {
          continue
        }

        let id = idParse[1]
        let title = createIconText({text: $('.h4', $(obj)).text() ?? "NO TITLE AVAILABLE"})
        let image = $('img', $(obj)).attr('data-src')

        if(!image) {
            // Do some kind of complaining here
            continue
        }

        results.push(createMangaTile({
            id: id,
            title: title,
            image: image
        }))
      }
    return createPagedResults({results: results})
  }

  getHomePageSectionRequest(): HomeSectionRequest[] | null {

    let request = createRequestObject({ url: `${TOONILY_DOMAIN}`, method: 'GET' })
    let latestUpdatesSection = createHomeSection({ id: 'latest_updates', title: 'LATEST UPDATES', view_more: createRequestObject({
      url: `${TOONILY_DOMAIN}`,
      method: 'GET',
      metadata: {
        page: 1
      }
    }) })

    return [createHomeSectionRequest({ request: request, sections: [latestUpdatesSection] })]

  }

  getViewMoreItems(data: string, key: string, metadata: any): PagedResults {
    let $ = this.cheerio.load(data)
    let results: MangaTile[] = []

    let returnObject: PagedResults = createPagedResults({
      results: [],
      nextPage: undefined
    })

    for (let row of $('.page-listing-item').toArray()) {
      for (let obj of $('.col-6', $(row)).toArray()) {
        let id = $('a', $('.item-thumb', $(obj))).attr('href')?.replace(`${TOONILY_DOMAIN}/webtoon/`, '').replace('/', '')
        let title = $('a', $('.item-thumb', $(obj))).attr('title')?.trim()
        let image = $('img', $(obj)).attr('data-src')
        let rating = $('.total_votes', $(obj)).text().trim()

        if (!title || !image || !id) {
          continue
        }

        results.push(createMangaTile({
          id: id,
          title: createIconText({ text: title }),
          image: image,
          primaryText: createIconText({ text: rating, icon: 'star.fill' })
        }))
      }
    }

    // Are we at the last page?
    let naviContext = $('.wp-pagenavi')
    let currPage = Number($('.current', $(naviContext)).text().replace(/\D/g, ''))

    let lastPageContext = $('a', $(naviContext))
    let lastPage = Number($(lastPageContext.toArray().slice(-1)[0]).attr('href')?.replace(/\D/g, ''))
    
    if (currPage < lastPage) {

      metadata.page = metadata.page + 1

      returnObject.nextPage = createRequestObject({
        url: `${TOONILY_DOMAIN}/page/${metadata.page}`,
        method: 'GET',
        metadata: metadata
      })

      console.log(`Requesting view more for ${TOONILY_DOMAIN}/page/${metadata.page}`)
    }

    returnObject.results = results

    return returnObject
  }


  getHomePageSections(data: any, section: HomeSection[]): HomeSection[] | null {

    let $ = this.cheerio.load(data)
    let latestUpdates: MangaTile[] = []

    for (let row of $('.page-listing-item').toArray()) {
      for (let obj of $('.col-6', $(row)).toArray()) {
        let id = $('a', $('.item-thumb', $(obj))).attr('href')?.replace(`${TOONILY_DOMAIN}/webtoon/`, '').replace('/', '')
        let title = $('a', $('.item-thumb', $(obj))).attr('title')?.trim()
        let image = $('img', $(obj)).attr('data-src')
        let rating = $('.total_votes', $(obj)).text().trim()

        if (!title || !image || !id) {
          continue
        }

        latestUpdates.push(createMangaTile({
          id: id,
          title: createIconText({ text: title }),
          image: image,
          primaryText: createIconText({ text: rating, icon: 'star.fill' })
        }))
      }
    }

    section[0].items = latestUpdates
    return section
  }
}
