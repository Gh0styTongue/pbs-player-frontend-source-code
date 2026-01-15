import { Video } from '../bridge';

export interface ChapterMarker {
  time: number;
  text?: string;
  display?: boolean;
  class?: string;
}

/**
 * Format player chapter marker cues
 */
export function getChapters(video: Video): ChapterMarker[] {
  return video.chapters.map((c) => ({
    time: c.start / 1000,
    text: c.title,
    display: true,
    class: 'video-js-marker',
  }));
}
