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

export const getTags = (): TagSection[] => {
  const arrayTags: Tag[] = [
    {id: "Ahegao", label: "Ahegao"},
    {id: "aunt", label: "Aunt"},
    {id: "BDSM", label: "BDSM"},
    {id: "Big Ass", label: "Big Ass"},
    {id: "Big Boobs", label: "Big Boobs"},
    {id: "big breasts", label: "Big Breasts"},
    {id: "Blackmail", label: "Blackmail"},
    {id: "Blindfold", label: "Blindfold"},
    {id: "Blowjob", label: "Blowjob"},
    {id: "Bondage", label: "Bondage"},
    {id: "Bride", label: "Bride"},
    {id: "Bukkake", label: "Bukkake"},
    {id: "business suit", label: "Business Suit"},
    {id: "Chastity Belt", label: "Chastity Belt"},
    {id: "Cheating", label: "Cheating"},
    {id: "Chinese dress", label: "Chinese Dress"},
    {id: "Collar", label: "Collar"},
    {id: "corruption", label: "Corruption"},
    {id: "Dark Skin", label: "Dark Skin"},
    {id: "Daughter", label: "Daughter"},
    {id: "Deepthroat", label: "Deepthroat"},
    {id: "Defloration", label: "Defloration"},
    {id: "Double Penetration", label: "Double Penetration"},
    {id: "Drunk", label: "Drunk"},
    {id: "Elf", label: "Elf"},
    {id: "enema", label: "Enema"},
    {id: "English", label: "English"},
    {id: "Forced", label: "Forced"},
    {id: "Gangbang", label: "Gangbang"},
    {id: "gaping", label: "Gaping"},
    {id: "goblin", label: "Goblin"},
    {id: "Group", label: "Group"},
    {id: "Group Sex", label: "Group Sex"},
    {id: "Gyaru", label: "Gyaru"},
    {id: "Harem", label: "Harem"},
    {id: "Housewife", label: "Housewife"},
    {id: "human pet", label: "Human Pet"},
    {id: "Humiliation", label: "Humiliation"},
    {id: "Impregnation", label: "Impregnation"},
    {id: "Incest", label: "Incest"},
    {id: "Lactation", label: "Lactation"},
    {id: "large insertions", label: "Large Insertions"},
    {id: "latex", label: "Latex"},
    {id: "lingerie", label: "Lingerie"},
    {id: "Loli", label: "Loli"},
    {id: "Maid", label: "Maid"},
    {id: "MILF", label: "MILF"},
    {id: "Mind Break", label: "Mind Break"},
    {id: "Mind Control", label: "Mind Control"},
    {id: "mmf threesome", label: "MMF Threesome"},
    {id: "Nun", label: "Nun"},
    {id: "Nurse", label: "Nurse"},
    {id: "Oral", label: "Oral"},
    {id: "Orc", label: "Orc"},
    {id: "orgasm denial", label: "Orgasm Denial"},
    {id: "piercing", label: "Piercing"},
    {id: "Pregnant", label: "Pregnant"},
    {id: "Prostitution", label: "Prostitution"},
    {id: "Rape", label: "Rape"},
    {id: "Schoolgirl", label: "Schoolgirl"},
    {id: "Sex Toys", label: "Sex Toys"},
    {id: "Slave", label: "Slave"},
    {id: "sole female", label: "Sole Female"},
    {id: "Spanking", label: "Spanking"},
    {id: "Squirting", label: "Squirting"},
    {id: "Stockings", label: "Stockings"},
    {id: "stomach deformation", label: "Stomach Deformation"},
    {id: "Strap-on", label: "Strap-on"},
    {id: "tail plug", label: "Tail Plug"},
    {id: "Teacher", label: "Teacher"},
    {id: "Torture", label: "Torture"},
    {id: "Toys", label: "Toys"},
    {id: "Trap", label: "Trap"},
    {id: "triple penetration", label: "Triple Penetration"},
    {id: "webtoon", label: "Webtoon"},
    {id: "Widow", label: "Widow"},
    {id: "Yandere", label: "Yandere"}
  ];

  return [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
};