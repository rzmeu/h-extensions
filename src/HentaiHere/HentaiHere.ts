import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const HentaiHereInfo: SourceInfo = {
  version: '0.1',
  name: 'HentaiHere',
  description: `Extension that pulls manga from HentaiHere`,
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

export class HentaiHere extends Suwayomi {

  sourceId: string = "7266624490370375187";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = true;

  supportsLatest: boolean = true;
}