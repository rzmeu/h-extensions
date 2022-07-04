import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const HentaiFoxInfo: SourceInfo = {
  version: '0.1',
  name: 'HentaiFox',
  description: `Extension that pulls manga from HentaiFox`,
  author: 'rzmeu',
  authorWebsite: 'https://github.com/rzmeu',
  icon: 'icon.png',
  contentRating: ContentRating.ADULT,
  websiteBaseURL: "",
  sourceTags: [
    {
      text: 'Notifications',
      type: TagType.GREEN
    }
  ]
};

export class HentaiFox extends Suwayomi {

  sourceId: string = "7945033982379409892";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = true;

  supportsLatest: boolean = false;
}