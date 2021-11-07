import { Chapter, ChapterDetails, Tag, LanguageCode, Manga, MangaStatus, MangaTile, TagSection } from "paperback-extensions-common";

export const parseMangaDetails = (result: any): Manga => {
  const arrayTags: Tag[] = [];
  for(let i = 0; i < result["data"].tags.length; i++) {
    arrayTags.push({ id: result["data"].tags[i].slug, label: result["data"].tags[i].title });
  }

  const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
  const artist = result["data"].artists.length > 0 ? result["data"].artists[0].title : "Unknown";

  return createManga({
    id: result["data"].slug,
    titles: [result["meta"]["title"]],
    image: result["data"]["preview"].sizes["full"],
    rating: 0,
    status: MangaStatus.COMPLETED,
    artist: artist,
    author: artist,
    desc: result["meta"]["description"],
    tags: tagSections,
    langFlag: result["data"]["preview"].flag_code,
    hentai: true
  })
};

export const parseChapters = (mangaId: string): Chapter[] => {
  const chapters: Chapter[] = [];
  const date = new Date(Date.now() - 2208986640000);

  chapters.push(createChapter({
    id: "1",
    mangaId,
    name: "Chapter 1",
    langCode: LanguageCode.ENGLISH,
    chapNum: 1,
    time: date,
  }));

  return chapters;
};

export const parseChapterDetails = (result: any, mangaId: string, chapterId: string): ChapterDetails => {
  const pages: string[] = [];
  for (let i = 0; i < result["data"].pages.length; i++) {
    pages.push(result["data"].pages[i].sizes.full);
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

  for(let i = 0; i < result.data.length; i++) {
    mangaTiles.push(createMangaTile({
      id: result.data[i].slug,
      image: result.data[i].preview.sizes.small_thumb,
      title: createIconText({ text: result.data[i].title })
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
  const arrayTags: Tag[] = [];

  for(let i = 1; i < result.data.length - 1; i++) {
    arrayTags.push({ id: result.data[i].slug, label: result.data[i].title });
  }

  return [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
};