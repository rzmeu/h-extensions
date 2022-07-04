import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const HentaiHandInfo: SourceInfo = {
  version: '0.1',
  name: 'HentaiHand',
  description: `Extension that pulls manga from HentaiHand`,
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

export class HentaiHand extends Suwayomi {

  sourceId: string = "1438773694780928937";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = true;

  supportsLatest: boolean = true;
}