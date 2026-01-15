import videojs from 'video.js';
import { videoJsBreakpoints } from '../constants';
import { VideoJsPBSPlayer } from '../player/player';

// Default options for the plugin.
const defaults = {};

// Cache for image elements
const cache = {};

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;
interface VttThumbnailsOptions {
  src: string;
  showTimestamp?: boolean;
}

interface VttTimestamp {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
}

interface ProcessedVttObject {
  start: number;
  end: number;
  css: ProcessedVttCss;
}

interface VttProps {
  x: string;
  y: string;
  w: string;
  h: string;
  image: string;
}

interface ProcessedVttCss {
  background?: string;
  url?: string;
  height?: string;
  width?: string;
}

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options: VttThumbnailsOptions) => {
  player.addClass('vjs-vtt-thumbnails');
  // eslint-disable-next-line new-cap, no-use-before-define
  player.vttThumbnails = new vttThumbnailsPlugin(player, options);
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function vttThumbnails
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
/* eslint-disable-next-line */
const vttThumbnails = function (this: any, options: VttThumbnailsOptions) {
  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });
};

/**
 * VTT Thumbnails class.
 *
 * This class performs all functions related to displaying the vtt
 * thumbnails.
 */
class vttThumbnailsPlugin {
  player: VideoJsPBSPlayer;
  options: VttThumbnailsOptions;
  registeredEvents: { [key: string]: (e: Event) => void };
  thumbnailHolder?: HTMLDivElement | null;
  progressBar?: HTMLElement | null;
  vttData?: ProcessedVttObject[];
  lastStyle?: ProcessedVttCss | null;
  data: any; //eslint-disable-line
  mouseMoveCallback?: (e: Event) => void;
  touchMoveCallback?: (e: Event) => void;

  /**
   * Plugin class constructor, called by videojs on
   * ready event.
   *
   * @function  constructor
   * @param    {Player} player
   *           A Video.js player object.
   *
   * @param    {Object} [options={}]
   *           A plain object containing options for the plugin.
   */
  constructor(player: VideoJsPBSPlayer, options: VttThumbnailsOptions) {
    this.player = player;
    this.options = options;
    this.initializeThumbnails();
    this.registeredEvents = {};
    this.progressBar = null;
    this.vttData = [];
    this.lastStyle = null;

    return this;
  }

  src(source: string): void {
    this.resetPlugin();
    this.options.src = source;
    this.initializeThumbnails();
  }

  detach(): void {
    this.resetPlugin();
  }

  resetPlugin(): void {
    if (this.thumbnailHolder && this.thumbnailHolder.parentNode) {
      this.thumbnailHolder.parentNode.removeChild(this.thumbnailHolder);
    }

    if (this.progressBar) {
      this.progressBar.removeEventListener(
        'mouseenter',
        this.registeredEvents.progressBarMouseEnter
      );
      this.progressBar.removeEventListener(
        'mouseleave',
        this.registeredEvents.progressBarMouseLeave
      );
      this.progressBar.removeEventListener(
        'mousemove',
        this.registeredEvents.progressBarMouseMove
      );
    }

    delete this.registeredEvents.progressBarMouseEnter;
    delete this.registeredEvents.progressBarMouseLeave;
    delete this.registeredEvents.progressBarMouseMove;
    delete this.progressBar;
    delete this.vttData;
    delete this.thumbnailHolder;
    delete this.lastStyle;
  }

  /**
   * Bootstrap the plugin.
   */
  initializeThumbnails(): void {
    if (!this.options.src) {
      return;
    }

    const baseUrl = this.getBaseUrl();
    const url = this.getFullyQualifiedUrl(this.options.src, baseUrl);

    this.getVttFile(url).then((data) => {
      this.vttData = this.processVtt(data);
      /**
       * While VOD assets without a trick play VTT file present in their
       * CS response will not trigger this plugin, some VOD assets may or
       * may not include a blank placeholder Trick Play VTT file. We need to
       * detect those here and only setup thumbnails when there is data. */
      if (this.vttData.length > 0) {
        this.setupThumbnailElement();
      }
    });
  }

  /**
   * Builds a base URL should we require one.
   *
   * @return {string}
   */
  getBaseUrl(): string {
    return (
      [
        // eslint-disable-next-line no-undef
        window.location.protocol,
        '//',
        // eslint-disable-next-line no-undef
        window.location.hostname,
        // eslint-disable-next-line no-undef
        window.location.port ? ':' + window.location.port : '',
        // eslint-disable-next-line no-undef
        window.location.pathname,
      ]
        .join('')
        .split(/([^/]*)$/gi)
        .shift() || ''
    );
  }

  /**
   * Grabs the contents of the VTT file.
   *
   * @param url
   * @return {Promise}
   */
  /* eslint-disable-next-line */
  getVttFile(url: string | URL): Promise<any> {
    return new Promise((resolve) => {
      /* eslint-disable-next-line */
      const req: any = new XMLHttpRequest();

      req.data = {
        resolve,
      };

      req.addEventListener('load', this.vttFileLoaded);
      req.open('GET', url);
      req.overrideMimeType('text/plain; charset=utf-8');
      req.send();
    });
  }

  /**
   * Callback for loaded VTT file.
   */
  vttFileLoaded() {
    this.data.resolve(this.responseText);
  }

  responseText() {
    throw new Error('Method not implemented.');
  }

  setupThumbnailElement(): void {
    // ? is it necessary to set it to a dummy div first?
    let mouseDisplay: Element | null = document.createElement('div');

    if (!this.options.showTimestamp) {
      mouseDisplay = this.player.$('.vjs-mouse-display');
    }

    // eslint-disable-next-line no-undef
    const thumbHolder = document.createElement('div');

    thumbHolder.setAttribute('class', 'vjs-vtt-thumbnail-display');

    // this.progressBar = this.player.$('.vjs-progress-control');
    // Using '.vjs-progress-holder' instead of 'vjs-progress-control' helps
    // when you add left and right margins to progress bar style.
    this.progressBar = this.player.$('.vjs-progress-holder') as HTMLElement;

    if (this.progressBar) this.progressBar.appendChild(thumbHolder);
    this.thumbnailHolder = thumbHolder;

    if (mouseDisplay && !this.options.showTimestamp) {
      mouseDisplay.classList.add('vjs-hidden');
    }

    this.registeredEvents.progressBarMouseEnter = () => {
      return this.onBarMouseenter();
    };

    this.registeredEvents.progressBarMouseLeave = () => {
      return this.onBarMouseleave();
    };

    this.registeredEvents.progressBarTouchStart = () => {
      return this.onBarTouchstart();
    };

    this.registeredEvents.progressBarTouchEnd = () => {
      return this.onBarTouchend();
    };

    if (this.progressBar) {
      this.progressBar.addEventListener(
        'mouseenter',
        this.registeredEvents.progressBarMouseEnter
      );
      this.progressBar.addEventListener(
        'mouseleave',
        this.registeredEvents.progressBarMouseLeave
      );
      this.progressBar.addEventListener(
        'touchstart',
        this.registeredEvents.progressBarTouchStart,
        { passive: true }
      );
      this.progressBar.addEventListener(
        'touchend',
        this.registeredEvents.progressBarTouchEnd,
        { passive: true }
      );
    }
  }

  onBarMouseenter(): void {
    this.mouseMoveCallback = (e: Event) => {
      this.onBarMousemove(e);
    };

    this.registeredEvents.progressBarMouseMove = this.mouseMoveCallback;

    if (this.progressBar)
      this.progressBar.addEventListener(
        'mousemove',
        this.registeredEvents.progressBarMouseMove
      );
    this.showThumbnailHolder();
  }

  onBarMouseleave() {
    if (this.registeredEvents.progressBarMouseMove) {
      this.progressBar &&
        this.progressBar.removeEventListener(
          'mousemove',
          this.registeredEvents.progressBarMouseMove
        );
    }

    this.hideThumbnailHolder();
  }

  onBarMousemove(event: Event) {
    if (this.progressBar) {
      this.updateThumbnailStyle(
        videojs.dom.getPointerPosition(this.progressBar, event).x,
        this.progressBar.offsetWidth
      );
    }
  }
  // --------------------------------------
  // Touch events

  onBarTouchstart(): void {
    this.touchMoveCallback = (e: Event) => {
      this.onBarTouchmove(e);
    };

    this.registeredEvents.progressBarTouchMove = this.touchMoveCallback;

    if (this.progressBar)
      this.progressBar.addEventListener(
        'touchmove',
        this.registeredEvents.progressBarTouchMove
      );
    this.showThumbnailHolder();
  }

  onBarTouchend() {
    if (this.registeredEvents.progressBarTouchMove) {
      this.progressBar &&
        this.progressBar.removeEventListener(
          'touchmove',
          this.registeredEvents.progressBarTouchMove
        );
    }

    this.hideThumbnailHolder();
  }

  onBarTouchmove(event: Event) {
    if (this.progressBar) {
      this.updateThumbnailStyle(
        videojs.dom.getPointerPosition(this.progressBar, event).x,
        this.progressBar.offsetWidth
      );
    }
  }

  // --------------------------------------
  getStyleForTime(time: number): ProcessedVttCss {
    let itemCss: ProcessedVttCss = {};

    if (this.vttData) {
      for (let i = 0; i < this.vttData.length; ++i) {
        const item = this.vttData[i];

        if (time >= item.start && time < item.end) {
          // Cache miss
          if (item.css.url && !cache[item.css.url]) {
            // eslint-disable-next-line no-undef
            const image = new Image();

            image.src = item.css.url;
            cache[item.css.url] = image;
          }

          itemCss = item.css;
        }
      }
    }

    return itemCss;
  }

  showThumbnailHolder(): void {
    if (this.thumbnailHolder) {
      this.thumbnailHolder.style.opacity = '1';
    }
  }

  hideThumbnailHolder(): void {
    if (this.thumbnailHolder) {
      this.thumbnailHolder.style.opacity = '0';
    }
  }

  updateThumbnailStyle(percent: number, width: number): void {
    const duration: number = this.player.duration();
    const time: number = percent * duration;
    const currentStyle: ProcessedVttCss = this.getStyleForTime(time);

    if (!currentStyle) {
      return this.hideThumbnailHolder();
    }

    const xPos: number = percent * width;
    const thumbnailWidth =
      currentStyle.width && parseInt(currentStyle.width, 10);
    const halfthumbnailWidth = thumbnailWidth && thumbnailWidth >> 1;
    const marginRight =
      xPos && halfthumbnailWidth && width - (xPos + halfthumbnailWidth);
    const marginLeft = xPos && halfthumbnailWidth && xPos - halfthumbnailWidth;

    // We apply scale conditionally based on the videojs breakpoint applied to the Player at the moment this function is called. The trick play file has a hardcoded dimension of 160x90 for each thumbnail extracted from the larger sprite image, so overriding thumbnail sizes with CSS won't work without completely re-generating thumbnails each time the viewport is resized.
    // Undocumented attribute on the Player object, hence ignoring TS error here.
    // @ts-expect-error
    const currentVjsBreakpoint = this.player.breakpoint_;

    let scale = 1;
    if (videoJsBreakpoints.tiny.includes(currentVjsBreakpoint)) {
      scale = 0.7;
    } else if (videoJsBreakpoints.small.includes(currentVjsBreakpoint)) {
      scale = 0.8;
    } else if (videoJsBreakpoints.medium.includes(currentVjsBreakpoint)) {
      scale = 0.9;
    }

    if (this.thumbnailHolder && marginLeft && marginRight) {
      if (marginLeft > 0 && marginRight > 0) {
        this.thumbnailHolder.style.transform = `translateX(${
          xPos - halfthumbnailWidth
        }px) scale(${scale})`;
        this.thumbnailHolder.style.transformOrigin = 'bottom center';
      } else if (marginLeft <= 0) {
        this.thumbnailHolder.style.transform = `translateX(${0}px) scale(${scale})`;
        this.thumbnailHolder.style.transformOrigin = 'bottom left';
      } else if (marginRight <= 0) {
        this.thumbnailHolder.style.transform = `translateX(${
          width - thumbnailWidth
        }px) scale(${scale})`;
        this.thumbnailHolder.style.transformOrigin = 'bottom right';
      }
    }
    if (this.lastStyle && this.lastStyle === currentStyle) {
      return;
    }

    this.lastStyle = currentStyle;

    for (const style in currentStyle) {
      if (
        Object.prototype.hasOwnProperty.call(currentStyle, style) &&
        this.thumbnailHolder
      ) {
        this.thumbnailHolder.style[style] = currentStyle[style];
      }
    }
  }

  processVtt(data: string): ProcessedVttObject[] {
    const processedVtts: ProcessedVttObject[] = [];
    const vttDefinitions: string[] = data.split(/[\r\n][\r\n]/i);

    vttDefinitions.forEach((vttDef) => {
      if (
        vttDef.match(
          /([0-9]{2}:)?([0-9]{2}:)?[0-9]{2}(.[0-9]{3})?( ?--> ?)([0-9]{2}:)?([0-9]{2}:)?[0-9]{2}(.[0-9]{3})?[\r\n]{1}.*/gi
        )
      ) {
        const vttDefSplit = vttDef.split(/[\r\n]/i);
        const vttTiming = vttDefSplit[0];
        const vttTimingSplit = vttTiming.split(/ ?--> ?/i);
        const vttTimeStart = vttTimingSplit[0];
        const vttTimeEnd = vttTimingSplit[1];
        const vttImageDef = vttDefSplit[1];
        const vttCssDef: ProcessedVttCss = this.getVttCss(vttImageDef);

        processedVtts.push({
          start: this.getSecondsFromTimestamp(vttTimeStart),
          end: this.getSecondsFromTimestamp(vttTimeEnd),
          css: vttCssDef,
        });
      }
    });

    return processedVtts;
  }

  getFullyQualifiedUrl(path: string, base: string | undefined): string {
    if (path.indexOf('//') >= 0) {
      // We have a fully qualified path.
      return path;
    }

    if (base) {
      if (base.indexOf('//') === 0) {
        // We don't have a fully qualified path, but need to
        // be careful with trimming.
        return [base.replace(/\/$/gi, ''), this.trim(path, '/')].join('/');
      }

      if (base.indexOf('//') > 0) {
        // We don't have a fully qualified path, and should
        // trim both sides of base and path.
        return [this.trim(base, '/'), this.trim(path, '/')].join('/');
      }
    }

    // If all else fails.
    return path;
  }

  getPropsFromDef(def: string): VttProps {
    const imageDefSplit: string[] = def.split(/#xywh=/i);

    const imageUrl: string = imageDefSplit[0];
    const imageCoords: string = imageDefSplit[1];
    const splitCoords: RegExpMatchArray | null = imageCoords.match(/[0-9]+/gi);

    return {
      x: (splitCoords && splitCoords[0]) || '',
      y: (splitCoords && splitCoords[1]) || '',
      w: (splitCoords && splitCoords[2]) || '',
      h: (splitCoords && splitCoords[3]) || '',
      image: imageUrl,
    };
  }

  getVttCss(vttImageDef: string): ProcessedVttCss {
    const cssObj: ProcessedVttCss = {};

    // If there isn't a protocol, use the VTT source URL.
    let baseSplit: string | undefined = '';

    if (this.options.src.indexOf('//') >= 0) {
      baseSplit = this.options.src.split(/([^/]*)$/gi).shift();
    } else {
      const baseUrl = this.getBaseUrl();
      if (baseUrl) {
        baseSplit = baseUrl + this.options.src.split(/([^/]*)$/gi).shift();
      }
    }

    vttImageDef = this.getFullyQualifiedUrl(vttImageDef, baseSplit);

    if (!vttImageDef.match(/#xywh=/i)) {
      cssObj.background = 'url("' + vttImageDef + '")';
      return cssObj;
    }

    const imageProps = this.getPropsFromDef(vttImageDef);

    cssObj.background =
      'url("' +
      imageProps.image +
      '") no-repeat -' +
      imageProps.x +
      'px -' +
      imageProps.y +
      'px';
    cssObj.width = imageProps.w + 'px';
    cssObj.height = imageProps.h + 'px';
    cssObj.url = imageProps.image;

    return cssObj;
  }

  /**
   * deconstructTimestamp deconstructs a VTT timestamp
   *
   * @param  {string} timestamp VTT timestamp
   * @return {VttTimestamp}           deconstructed timestamp
   */
  deconstructTimestamp(timestamp: string): VttTimestamp {
    const splitStampMilliseconds: string[] = timestamp.split('.');
    const timeParts: string = splitStampMilliseconds[0];
    const timePartsSplit: string[] = timeParts.split(':');

    const secString = timePartsSplit.pop();
    const seconds: number = (secString && parseInt(secString, 10)) || 0;

    const minString = timePartsSplit.pop();
    const minutes: number = (minString && parseInt(minString, 10)) || 0;

    const hourString = timePartsSplit.pop();
    const hours: number = (hourString && parseInt(hourString, 10)) || 0;

    return {
      milliseconds: parseInt(splitStampMilliseconds[1], 10) || 0,
      seconds: seconds,
      minutes: minutes,
      hours: hours,
    };
  }

  /**
   * getSecondsFromTimestamp
   *
   * @param  {string} timestamp VTT timestamp
   * @return {number}           timestamp in seconds
   */
  getSecondsFromTimestamp(timestamp: string): number {
    const timestampParts: VttTimestamp = this.deconstructTimestamp(timestamp);

    return (
      timestampParts.hours * (60 * 60) +
      timestampParts.minutes * 60 +
      timestampParts.seconds +
      timestampParts.milliseconds / 1000
    );
  }

  // alternate function that uses milliseconds instead of seconds
  getMillisecondsFromTimestamp(timestamp: string): number {
    const timestampParts: VttTimestamp = this.deconstructTimestamp(timestamp);

    return (
      timestampParts.hours * (60 * 60) +
      timestampParts.minutes * 60 +
      timestampParts.seconds +
      timestampParts.milliseconds / 1000
    );
  }

  /**
   * trim
   *
   * @param  {string} str      source string
   * @param  {string} charlist characters to trim from text
   * @return {string}          trimmed string
   */
  trim(str: string, charlist: string): string {
    let whitespace = [
      ' ',
      '\n',
      '\r',
      '\t',
      '\f',
      '\x0b',
      '\xa0',
      '\u2000',
      '\u2001',
      '\u2002',
      '\u2003',
      '\u2004',
      '\u2005',
      '\u2006',
      '\u2007',
      '\u2008',
      '\u2009',
      '\u200a',
      '\u200b',
      '\u2028',
      '\u2029',
      '\u3000',
    ].join('');
    let l = 0;
    let i = 0;

    str += '';
    if (charlist) {
      whitespace = (charlist + '').replace(/([[\]().?/*{}+$^:])/g, '$1');
    }
    l = str.length;
    for (i = 0; i < l; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    l = str.length;
    for (i = l - 1; i >= 0; i--) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
  }
}

// Register the plugin with video.js.
registerPlugin('vttThumbnails', vttThumbnails);

export { vttThumbnails as default };
