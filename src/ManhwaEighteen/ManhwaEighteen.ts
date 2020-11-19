import { Source, Manga, MangaStatus, Chapter, ChapterDetails, HomeSectionRequest, HomeSection, MangaTile, SearchRequest, LanguageCode, TagSection, Request, MangaUpdates, SourceTag, TagType, PagedResults } from "paperback-extensions-common"
const ME_DOMAIN = 'https://manhwa18.com'

export class ManhwaEighteen extends Source {

  constructor(cheerio: CheerioAPI) {
    super(cheerio)
  }

  get version(): string { return '0.7.54' }
  get name(): string { return 'Manhwa18 (18+)' }
  get description(): string { return 'Extension that pulls manga from Manhwa18' }
  get author(): string { return 'Conrad Weiser' }
  get authorWebsite(): string { return 'http://github.com/conradweiser' }
  get icon(): string { return "logo.png" }
  get hentaiSource(): boolean { return true }
  getMangaShareUrl(mangaId: string): string | null { return `${ME_DOMAIN}/${mangaId}.html` }
  get sourceTags(): SourceTag[] { return [{ text: "18+", type: TagType.YELLOW }, {text: "Buggy", type: TagType.RED}] }
  get websiteBaseURL(): string { return ME_DOMAIN }

  getMangaDetailsRequest(ids: string[]): Request[] {
    let requests: Request[] = []
    for (let id of ids) {
      let metadata = { 'id': id }
      requests.push(createRequestObject({
        url: `${ME_DOMAIN}/${id}.html`,
        metadata: metadata,
        method: 'GET'
      }))
    }
    return requests
  }

  getMangaDetails(data: any, metadata: any): Manga[] {
    let $ = this.cheerio.load(data)

    let titles: string[] = []
    let author

    let tags: TagSection[] = [createTagSection({ id: '0', label: 'genre', tags: [] })]
    let status: MangaStatus = MangaStatus.ONGOING   // Default to ongoing
    let views
    let lang
    let image

    let imageBase = $('.thumbnail').attr('src')
    if(imageBase?.includes('manhwa18') || imageBase?.includes('smurfs.toptoon')) {
      image = imageBase
    }
    else {
      image = `${ME_DOMAIN}${imageBase}`
    }

    let objContext = $('li', $('.manga-info')).toArray()
    for (let i = 0; i < objContext.length; i++) {
      switch (i) {
        case 0: {
          titles.push($(objContext[i]).text().replace("Manga name:", "").trim()) ?? ''
          break;
        }
        case 1: {
          titles.push($(objContext[i]).text().replace("Other names: ", "").trim()) ?? ''
          break;
        }
        case 2: {
          author = $('a', $(objContext[i])).text() ?? ''
          break;
        }
        case 3: {
          for (let obj of $('a', $(objContext[i]).toArray()).toArray()) {
            let text = $(obj).text()
            tags[0].tags.push(createTag({ label: text, id: text }))

            if (text.toLowerCase().includes("raw")) {
              lang = LanguageCode.KOREAN
            }
            else {
              lang = LanguageCode.ENGLISH
            }
          }
          break;
        }
        case 4: {
          let text = $('a', $(objContext[i])).text()
          status = text.includes("On going") ? MangaStatus.ONGOING : MangaStatus.COMPLETED
          break;
        }
        case 6: {
          views = $(objContext[i]).text().replace(" Views: ", "") ?? ''
          break;
        }
      }
    }

    let rowContext = $('.row', $('.well-sm')).toArray()
    let description = $('p', $(rowContext[1])).text()

    let rating = $('.h0_ratings_active', $('.h0rating')).toArray().length

    return [createManga({
      id: metadata.id,
      titles: titles,
      image: image!,
      status: status,
      desc: description,
      tags: tags,
      author: author,
      rating: rating,
      langFlag: lang,
      langName: lang,
      hentai: true            // This is an 18+ source
    })]

  }

  getChaptersRequest(mangaId: string): Request {
    let metadata = { 'id': mangaId }
    mangaId = mangaId.replace(".html", "")
    return createRequestObject({
      url: `${ME_DOMAIN}/${mangaId}.html`,
      metadata: metadata,
      method: 'GET'
    })
  }

  getChapters(data: any, metadata: any): Chapter[] {
    let $ = this.cheerio.load(data)
    let chapters: Chapter[] = []

    let lang

    let objContext = $('li', $('.manga-info')).toArray()
    for (let i = 0; i < objContext.length; i++) {
      switch (i) {
        case 3: {
          for (let obj of $('a', $(objContext[i]).toArray()).toArray()) {
            let text = $(obj).text()

            if (text.toLowerCase().includes("raw")) {
              lang = LanguageCode.KOREAN
            }
            else {
              lang = LanguageCode.ENGLISH
            }
          }
          break;
        }
      }
    }

    let i = 1
    for (let obj of $('tr', $('.table')).toArray().reverse()) {
      let id = $('.chapter', $(obj)).attr('href')
      let name = $('b', $(obj)).text().trim()

      //TODO Add the date calculation into here
      let timeStr = /(\d+) ([hours|weeks|months]+) ago/.exec($('time', $(obj)).text().trim())
      let date = new Date()
      if (timeStr) {

        switch (timeStr[2]) {
          case 'hours': {
            // Do nothing, we'll just call it today
            break;
          }
          case 'weeks': {
            date.setDate(date.getDate() - (Number(timeStr[1])) * 7)
            break;
          }
          case 'months': {
            date.setDate(date.getDate() - (Number(timeStr[1])) * 31)  // We're just going to assume 31 days each month I guess. Can't be too specific 
            break;
          }
        }
      }


      chapters.push(createChapter({
        id: id!,
        mangaId: metadata.id,
        chapNum: i,
        langCode: lang ?? LanguageCode.UNKNOWN,
        name: name,
        time: date
      }))

      i++
    }

    return chapters
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {

    let metadata = { 'mangaId': mangaId, 'chapterId': chapId }
    return createRequestObject({
      url: `${ME_DOMAIN}/${chapId}.html`,
      metadata: metadata,
      method: 'GET',
    })
  }

  getChapterDetails(data: any, metadata: any): ChapterDetails {
    let $ = this.cheerio.load(data)
    let pages: string[] = []

    let containerHead = $('.chapter-content').toArray()
    for (let obj of $('img', containerHead[containerHead.length - 1]).toArray()) {
      let pageUrl = $(obj).attr('src')!.trim()
      // If the page URL is missing 
      if(pageUrl.includes(`manhwa18`) || pageUrl.includes('i.ibb')) {
        pages.push(pageUrl)
        console.log(pageUrl)
      }

      else {
        // Append it manually
        pages.push(`${ME_DOMAIN}/${pageUrl}`)

        console.log(`${ME_DOMAIN}/${pageUrl}`)
      }
    }

    metadata.chapterId = metadata.chapterId.replace(".html", "")
    metadata.chapterId = metadata.chapterId.replace(/-chapter-\d/g, "")
    metadata.chapterId = metadata.chapterId.replace("read", "manga")

    return createChapterDetails({
      id: metadata.chapterId,
      mangaId: metadata.mangaId,
      pages: pages,
      longStrip: true
    })
  }


  searchRequest(query: SearchRequest): Request | null {

    // If h-sources are disabled for the search request, always return null
    if (query.hStatus === false) {
      return null
    }

    let title = query.title?.replace(" ", "+")

    return createRequestObject({
      url: `${ME_DOMAIN}/danh-sach-truyen.html?m_status=&author=&group=&name=${title}&genre=&ungenre=`,
      timeout: 4000,
      method: "GET"
    })
  }

  search(data: any, metadata: any): PagedResults {

    let $ = this.cheerio.load(data)
    let mangaTiles: MangaTile[] = []

    for (let obj of $('.row-list').toArray()) {
      let title = $('a', $('.media-heading', $(obj))).text() ?? ''
      let id = $('a', $('.media-heading', $(obj))).attr('href') ?? ''
      let img = `${ME_DOMAIN}${$('img', $(obj)).attr('src')}` ?? ''
      let textContext = $('.media-body', $(obj))
      let primaryText = createIconText({ text: $('span', textContext).text() })

      id = id.replace(".html", "")

      mangaTiles.push(createMangaTile({
        title: createIconText({ text: title }),
        id: id,
        image: img,
        primaryText: primaryText
      }))
    }

    return createPagedResults({
      results: mangaTiles
    })
  }

  getHomePageSectionRequest(): HomeSectionRequest[] {
    let request = createRequestObject({ url: `${ME_DOMAIN}`, method: 'GET' })
    let section1 = createHomeSection({
      id: 'latest_release', title: 'Latest Manhwa Releases', view_more: createRequestObject({
        url: `https://manhwa18.com/manga-list.html?listType=pagination&page=1&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=views&sort_type=DESC`,
        method: 'GET',
        metadata: {
          page: 1
        }
      })
    })

    return [createHomeSectionRequest({ request: request, sections: [section1] })]
  }

  getViewMoreItems(data: any, key: string, metadata: any): PagedResults {
    let $ = this.cheerio.load(data)
    let results: MangaTile[] = []

    console.log(`Made a view more request to: https://manhwa18.com/manga-list.html?listType=pagination&page=${metadata.page}&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=views&sort_type=DESC`)

    for (let obj of $('.row-list').toArray()) {

      let title = $('a', $('.media-heading', $(obj))).text() ?? ''
      let id = $('a', $('.media-heading', $(obj))).attr('href') ?? ''
      let img = `${ME_DOMAIN}${$('img', $(obj)).attr('src')}` ?? ''
      let textContext = $('.media-body', $(obj))
      let primaryText = createIconText({ text: $('span', textContext).text() })

      id = id.replace(".html", "")

      console.log(`Processing view more object with ID: ${id}`)

      results.push(createMangaTile({
        title: createIconText({ text: title }),
        id: id,
        image: img,
        primaryText: primaryText
      }))
    }

    var returnObject = createPagedResults({
      results: results,
      nextPage: undefined
    })

    // Check if this is the last page, if not, generate a newPage request for this call
    let pagnationContextArray = $('li', $('.pagination-wrap')).toArray()
    let lastPageAvailable = Number($('a', $(pagnationContextArray[pagnationContextArray.length - 2])).text())

    if (lastPageAvailable != undefined && (metadata.page + 1) != lastPageAvailable) {
      // Set the nextPage
      metadata.page = metadata.page + 1

      returnObject.nextPage = createRequestObject({
        url: `https://manhwa18.com/manga-list.html?listType=pagination&page=${metadata.page}&artist=&author=&group=&m_status=&name=&genre=&ungenre=&sort=views&sort_type=DESC`,
        method: 'GET',
        metadata: metadata
      })
    }

    console.log(`${results}`)


    return returnObject

  }

  getHomePageSections(data: any, sections: HomeSection[]): HomeSection[] {
    let $ = this.cheerio.load(data)
    let latestManga: MangaTile[] = []

    let context = $('#contentstory').toArray()[0]
    for (let item of $('.itemupdate', $(context)).toArray()) {
      let id = $('a', $(item)).attr('href')?.replace(".html", "")
      let title = createIconText({ text: $('.title-h3', $(item)).text() })
      let imageBase = $('.lazy', $(item)).attr('src')
      let views = $('.view', $(item)).text()
      let image

      if(imageBase?.includes('manhwa18') || imageBase?.includes('smurfs.toptoon')) {
        image = imageBase
      }
      else {
        image = `${ME_DOMAIN}${imageBase}`
      }

      if (!id) {
        continue
      }

      latestManga.push(createMangaTile({
        id: id,
        title: title,
        image: image,
        primaryText: createIconText({ text: views })
      }))
    }

    sections[0].items = latestManga

    return sections
  }

  filterUpdatedMangaRequest(ids: string[], time: Date): Request {

    let metadata = { 'ids': ids, referenceTime: time, page: 1 }

    return createRequestObject({
      url: `${ME_DOMAIN}/index.html`,
      method: 'GET',
      metadata: metadata
    })
  }

  filterUpdatedManga(data: any, metadata: any): MangaUpdates {
    let $ = this.cheerio.load(data)

    //MW18 is kinda sketchy where the only place that shows update times is the main page. We'll do the best we can.
    let returnObject: MangaUpdates = {
      ids: []
    }

    for (let content of $('#contentstory').toArray()) {
      for (let item of $('.itemupdate', $(content)).toArray()) {
        let id = $('a', $(item)).attr('href')?.replace(".html", "")
        let dateUpdated = $('time', $(item)).text().trim()

        let date: Date

        // Was this updated minutes ago?
        if (dateUpdated.includes("minutes")) {
          let parsedDateNumeric = Number(dateUpdated.replace(/\D/g, ''))
          date = new Date()
          date.setMinutes(date.getMinutes() - parsedDateNumeric)
        }

        // Was it hours ago?
        else if (dateUpdated.includes("hours")) {
          let parsedDateNumeric = Number(dateUpdated.replace(/\D/g, ''))
          date = new Date()
          date.setHours(date.getHours() - parsedDateNumeric)
        }

        // Otherwise it was days
        else {
          let parsedDateNumeric = Number(dateUpdated.replace(/\D/g, ''))
          date = new Date()
          date.setDate(date.getDate() - parsedDateNumeric)
        }

        if (!id) {
          continue
        }

        // If this was before our reference time, add it to the list of updates
        if (date < metadata.referenceTime) {
          returnObject.ids.push(id)
        }

      }
    }

    return returnObject
  }

}
