import {
  ContentRating,
  LanguageCode,
  SourceInfo,
  TagType
} from 'paperback-extensions-common'
import {Suwayomi} from "../Suwayomi";

export const HentaiReadInfo: SourceInfo = {
  version: '0.1',
  name: 'HentaiRead',
  description: `Extension that pulls manga from HentaiRead`,
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

export class HentaiRead extends Suwayomi {

  sourceId: string = "6543143190556940874";

  languageCode: LanguageCode = LanguageCode.ENGLISH;

  isNsfw: boolean = true;

  supportsLatest: boolean = true;
}