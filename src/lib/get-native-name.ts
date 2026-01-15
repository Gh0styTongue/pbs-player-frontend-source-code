import ISO6391 from 'iso-639-1-plus';
import { toTitleCase } from './toTitleCase';

// Use the 2-character language code from the audio or caption track to lookup the language's native name
export const getNativeName = (languageCode: string): string => {
  let lang: string = languageCode;
  // Livestream (DRM) defines a three-letter code, unlike everything else
  if (lang === 'eng') lang = 'en';

  return ISO6391.validate(lang)
    ? toTitleCase(ISO6391.getNativeName(lang))
    : 'Unknown';
};
