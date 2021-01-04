
import { Source, Manga, MangaStatus, Tag, Chapter, ChapterDetails, HomeSectionRequest, HomeSection, MangaTile, SearchRequest, MangaUpdates, LanguageCode, Request, SourceTag, TagType, PagedResults } from "paperback-extensions-common"

const TOONILY_DOMAIN = 'https://toonily.com'

export class Toonily extends Source {
  constructor(cheerio: CheerioAPI) {
    super(cheerio)
  }

  get version(): string { return '1.1.23' }
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
        url: `${TOONILY_DOMAIN}/webtoon/${metadata.id}`,
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
    let manga: Manga[] = []
    let $ = this.cheerio.load(data)

    let title = $('h1', $('.post-title')).text().replace('18+', '').trim()
    let hentai = $('.adult').toArray().length > 0 ? true : false
    let image = $('img', $('.summary_image')).attr('data-src')
    let rating = $('.total_votes').text().replace('Your Rating', '')
    let status: MangaStatus = $('.summary-content').text().toLowerCase().includes('ongoing') ? MangaStatus.ONGOING : MangaStatus.COMPLETED
    let artist = $('a', $('.artist-content')).text()
    let author = $('a', $('.author-content')).text()
    let desc = $('p', $('.summary__content ')).text()

    // Get all of the tags
    let tags: Tag[] = []
    for (let obj of $('a', $('.genres-content')).toArray()) {
      let tagId = $(obj).attr('href')?.replace('https://toonily.com/webtoon-genre/', '').replace('/', '')
      let tagName = $(obj).text()

      if (!tagId || !tagName) {
        continue
      }

      tags.push(createTag({ id: tagId!, label: tagName }))
    }


    return [createManga({
      id: $('.wp-manga-action-button').attr('data-post')!,
      titles: [title],
      image: image!,
      rating: Number(rating),
      status: status,
      hentai: hentai,
      artist: artist,
      author: author,
      desc: desc,
      tags: [createTagSection({ label: 'genres', id: 'genres', tags: tags })]
    })]
  }

  getChaptersRequest(mangaId: string): Request {

    let metadata = { 'id': mangaId }
    return createRequestObject({
      url: `${TOONILY_DOMAIN}/wp-admin/admin-ajax.php`,
      headers: {
        action: 'manga_get_chapters',
        manga: mangaId
      },
      metadata: metadata,
      method: 'POST'
    })
  }

  getChapters(data: any, metadata: any): Chapter[] {
    let $ = this.cheerio.load(data)
    let chapters: Chapter[] = []

    for (let obj of $('.wp-manga-chapter  ').toArray()) {
      let id = $('a', $(obj)).attr('href')?.replace(`${TOONILY_DOMAIN}/webtoon/${metadata.id}/`, '').replace('/', '')!
      let chapNum = Number(/(\d+)/g.exec($('a', $(obj)).text())![1])
      let date = new Date($('i', $(obj)).text())

      chapters.push(createChapter({
        id: id,
        mangaId: metadata.id,
      langCode: LanguageCode.ENGLISH,
        chapNum: chapNum,
        time: date
      }))
    }

    return chapters
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {

    let metadata = { 'mangaId': mangaId, 'chapterId': chapId }
    console.log(metadata, createRequestObject({
      url: `${TOONILY_DOMAIN}/webtoon/${mangaId}/${chapId}/`,
      metadata: metadata,
      cookies: [{
        name: 'wpmanga-adault',
        value: '1',
      domain: 'toonily.com',
        path: '/'
      }],
      method: 'GET',
    }));
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
    for (let obj of $('.page-break', $('.reading-content')).toArray()) {

      let pageContent = $('img', $(obj)).attr('data-src')?.trim()
      if (!pageContent) {
        // Try the alternative page getter
        pages.push($('img', $(obj)).attr('src')?.trim()!)

      }
      else {
        pages.push(pageContent)
      }


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
      url: `${TOONILY_DOMAIN}/?s=${query.title}&post_type=wp-manga`,
      timeout: 4000,
      method: "GET"
    })
  }

  search(data: any, metadata: any): PagedResults {

    let $ = this.cheerio.load(data)
    let mangaTiles: MangaTile[] = []

    for (let obj of $('.row', $('.c-tabs-item')).toArray()) {
      let id = $('a', $(obj)).attr('href')?.replace(`${TOONILY_DOMAIN}/webtoon/`, '').replace('/', '')!
      let title = $('a', $(obj)).attr('title')!
      let image = $('img', $(obj)).attr('data-src')!

      let rating = $('.total_votes', $(obj)).text().trim()

      mangaTiles.push(createMangaTile({
        id: id,
        title: createIconText({ text: title }),
        image: image,
        primaryText: createIconText({ text: rating, icon: 'star.fill' })
      }))
    }

    return createPagedResults({
      results: mangaTiles
    })
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

  filterUpdatedMangaRequest(ids: string[], time: Date): Request {

    let metadata = { 'ids': ids, referenceTime: time, page: 1 }

    return createRequestObject({
      url: `${TOONILY_DOMAIN}`,
      method: 'GET',
      metadata: metadata
    })
  }

  filterUpdatedManga(data: any, metadata: any): MangaUpdates {
    let $ = this.cheerio.load(data)

    metadata.page = metadata.page++
    let returnObject = createMangaUpdates({
      'ids': [],
      nextPage: createRequestObject({
        url: `${TOONILY_DOMAIN}/page/${metadata.page}`,
        method: 'GET',
        metadata: metadata
      })
    })

    for (let row of $('.page-listing-item').toArray()) {
      for (let obj of $('.col-6', $(row)).toArray()) {
        let id = $('a', $('.item-thumb', $(obj))).attr('href')?.replace(`${TOONILY_DOMAIN}/webtoon/`, '').replace('/', '')

        // has this object been updated within the reference date?
        let chapterItem = $('.chapter-item', $(obj)).toArray()[0] // Always just use the first entry
        let postOnText = $('.post-on', $(chapterItem)).text().replace("\n", "").trim()
        // Toonily has a wack way of displaying dates, it can be one of three things. New, '1 day ago', or a proper date.
        var date = new Date()
        if (postOnText.includes('1 day ago')) {
          date.setDate(date.getDate() - 1)
        }

        else if (postOnText == "") {
          // This is a NEW object, we have to parse out the date specifically for this
          var dateString = $('img', $(chapterItem)).attr('alt')

          if (dateString?.includes("mins")) {
            dateString = dateString.replace(/\D/g, '')
            date.setMinutes(date.getMinutes() - Number(dateString))
          }

          else if (dateString?.includes("hours")) {
            dateString = dateString.replace(/\D/g, '')
            date.setHours(date.getHours() - Number(dateString))
          }
        }

        else {
          // This is a properly formatted date we can parse
          date = new Date(postOnText)
        }

        // If this is past our reference time, disable paging to new pages for updates
        if(date > metadata.referenceTime) {
          returnObject.nextPage = undefined
        }

        if(date < metadata.referenceTime) {
          returnObject.ids.push(id!)
        }
      }
    }

    return returnObject
  }
}
