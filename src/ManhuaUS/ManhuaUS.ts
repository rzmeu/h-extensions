import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const ManhuaUSInfo: SourceInfo = {
  version: '0.1',
  name: 'ManhuaUS',
  description: `Extension that pulls manga from ManhuaUS`,
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

export class ManhuaUS extends Suwayomi {

  sourceId: string = "4005973248538140146";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = false;

  supportsLatest: boolean = true;
}