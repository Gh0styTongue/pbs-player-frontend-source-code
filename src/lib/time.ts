import { PlayerTimeInfo } from '../player/player';

const formatDigitsShort = (number: number): string => {
  return String(number);
};

const formatDigitsLong = (number: number): string => {
  return (number < 10 ? '0' : '') + number;
};

export const formatDuration = (duration: number): string => {
  const totalHours = Math.floor(duration / 3600);
  let remainingSeconds = duration % 3600;
  const totalMinutes = Math.floor(remainingSeconds / 60);
  remainingSeconds = remainingSeconds - totalMinutes * 60;
  const seconds = remainingSeconds % 60;

  // don't display hours if not at least 1hr long; no need for two digits
  const formattedHours = totalHours > 0 ? `${totalHours}:` : '';
  // always display minutes even if less than 1 minute; always display with two digits
  const formattedMinutes =
    totalHours > 0
      ? `${formatDigitsLong(totalMinutes)}:`
      : `${formatDigitsShort(totalMinutes)}:`;
  // always display seconds with two digits
  const formattedSeconds = formatDigitsLong(seconds);
  const formattedDuration = `${
    formattedHours + formattedMinutes + formattedSeconds
  }`;

  return formattedDuration;
};

export const formatDurationPretty = (duration: number): string => {
  const totalHours = Math.floor(duration / 3600);
  let remainingSeconds = duration % 3600;
  const totalMinutes = Math.floor(remainingSeconds / 60);
  remainingSeconds = remainingSeconds - totalMinutes * 60;
  const seconds = remainingSeconds % 60;

  const formattedHours = totalHours > 0 ? `${totalHours}h` : '';
  const formattedMinutes =
    totalMinutes > 0 ? `${formatDigitsShort(totalMinutes)}m` : '';
  const formattedSeconds = `${formatDigitsShort(seconds)}s`;
  return `${formattedHours} ${formattedMinutes} ${formattedSeconds}`;
};

export const updateTimeInfo = (playerEl: HTMLVideoElement): PlayerTimeInfo => {
  return {
    currentTime: playerEl.currentTime,
    position: playerEl.currentTime,
    duration: playerEl.duration,
    metadata: {},
    seekRange: playerEl.seekable,
    start: 0,
    end: playerEl.duration,
  };
};
