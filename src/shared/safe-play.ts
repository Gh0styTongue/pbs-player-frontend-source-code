import { VideoJsPlayer } from 'video.js';

/**
 * Safely calls play() on a VideoJS player and handles all play() rejections
 * to prevent noise in error reporting systems like Sentry.
 * Follows Google's recommended pattern from:
 * https://developer.chrome.com/blog/play-request-was-interrupted/
 * @param player VideoJS player instance
 * @returns Promise that resolves when play starts or when play is prevented
 */
export function safePlay(player: VideoJsPlayer): Promise<void> {
  const playPromise = player.play();

  // Handle the case where play() might not return a promise (should be rare in modern browsers)
  if (!playPromise || typeof playPromise.catch !== 'function') {
    return Promise.resolve();
  }

  return playPromise.catch(() => {
    // Auto-play was prevented or play was interrupted
    // This is expected behavior, not an error
  });
}
