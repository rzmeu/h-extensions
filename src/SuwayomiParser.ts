import {
  Chapter,
  ChapterDetails,
  LanguageCode,
  Manga,
  MangaStatus,
  MangaTile,
  Tag,
  TagSection
} from "paperback-extensions-common";
import {API_ENDPOINT} from "./Suwayomi";

export const parseMangaDetails = (result: any): Manga => {
  // const arrayTags: Tag[] = [];
  // for(let i = 0; i < result["data"].tags.length; i++) {
  //   arrayTags.push({ id: result["data"].tags[i].slug, label: result["data"].tags[i].title });
  // }
  //
  // const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
  // const artist = result["data"].artists.length > 0 ? result["data"].artists[0].title : "Unknown";

  return createManga({
    id: "" + result.id,
    titles: [result.title],
    image: `${API_ENDPOINT}/manga/${result.id}/thumbnail?useCache=true`,
    rating: 0,
    status: MangaStatus.ONGOING,
    artist: result.artist,
    author: result.author,
    desc: result.description,
    tags: [],
    langFlag: result.source.lang,
    hentai: result.source.isNsfw
  })
};

export const parseChapters = (result: any): Chapter[] => {
  const chapters: Chapter[] = [];

  for (let i = 0; i < result.length; i++) {
    chapters.push(createChapter({
      chapNum: result[i].index,
      id: "" + result[i].index,
      name: result[i].name,
      langCode: LanguageCode.ENGLISH,
      mangaId: "" + result[i].mangaId
    }));
  }

  return chapters;
};

export const parseChapterDetails = (result: any, mangaId: string, chapterId: string): ChapterDetails => {
  const pages: string[] = [];
  for (let i = 0; i < result.pageCount; i++) {
    pages.push(`${API_ENDPOINT}/manga/${mangaId}/chapter/${chapterId}/page/${i}?useCache=true`);
  }

  return createChapterDetails({
    id: chapterId,
    mangaId: mangaId,
    pages: pages,
    longStrip: false
  });
};

export const parseMangaItems = (result: any): MangaTile[] => {
  const mangaTiles: MangaTile[] = [];

  for(let i = 0; i < result.mangaList.length; i++) {
    mangaTiles.push(createMangaTile({
      id: "" + result.mangaList[i].id,
      image: `${API_ENDPOINT}/manga/${result.mangaList[i].id}/thumbnail?useCache=true`,
      title: createIconText({ text: result.mangaList[i].title })
    }))
  }

  return mangaTiles;
};

export const parseSearchMangaItems = (result: any): MangaTile[] => {
  const mangaTiles: MangaTile[] = [];

  for(let i = 0; i < result.data.length; i++) {
    mangaTiles.push(createMangaTile({
      id: result.data[i].object.slug,
      image: result.data[i].object.preview.sizes.small_thumb,
      title: createIconText({ text: result.data[i].object.title })
    }))
  }

  return mangaTiles;
};

export const parseTags = (result: any): TagSection[] => {
  // @ts-ignore
  let filters = result.filter((element) => element.type === "Group" && element.filter.name === "Tags");
  const arrayTags: Tag[] = [];

  if(filters.length == 1) {
    for(let i = 0; i < filters[0].filter.state.length; i++) {
      arrayTags.push({id: "" + filters[0].filter.state[i].filter.id, label: filters[0].filter.state[i].filter.name})
    }
    filters[0].state
  }

  return [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
};