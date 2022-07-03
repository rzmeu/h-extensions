import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const Hentai2ReadInfo: SourceInfo = {
  version: '0.1',
  name: 'Hentai2Read',
  description: `Extension that pulls manga from Hentai2Read`,
  author: 'rzmeu',
  authorWebsite: 'https://github.com/rzmeu',
  icon: 'icon.png',
  contentRating: ContentRating.EVERYONE,
  websiteBaseURL: "",
  sourceTags: [
    {
      text: 'Notifications',
      type: TagType.GREEN
    }
  ]
};

export class Hentai2Read extends Suwayomi {

  sourceId: string = "8314925449740051373";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = false;

  supportsLatest: boolean = true;
}