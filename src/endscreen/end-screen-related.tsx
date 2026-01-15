
import { Context, RelatedVideoBridge, Video } from '../bridge';
import { specifyResolution } from '../lib/images';
import { getRelatedShowUrl, getRelatedVideoUrl } from '../lib/pbs';
import './end-screen-related.scss';

interface RelatedScreenProps {
  video: Video;
  context: Context;
}

const RelatedScreen = (props: RelatedScreenProps): JSX.Element => {
  const { video } = props;
  const relatedVideos = video.relatedVideos || [];

  return (
    <div className="player-related">
      {/* internally we call this "related videos", but publicly we call it
      "more videos": https://projects.pbs.org/jira/browse/PLYR-222 */}
      <h2 className="player-related__title">More Videos</h2>
      <div className="player-related__videos">
        {relatedVideos.map((relatedVideo: RelatedVideoBridge) => (
          <div key={relatedVideo.id} className="player-related__video">
            <a
              className="player-related__image-link"
              target="_blank"
              rel="noopener noreferrer"
              href={getRelatedVideoUrl(relatedVideo)}
            >
              <img
                className="player-related__image"
                src={specifyResolution(relatedVideo.images.mezzanine, {
                  width: 371,
                  height: 211,
                })}
              />
            </a>
            <a
              className="player-related__show-title"
              target="_blank"
              rel="noopener noreferrer"
              href={getRelatedShowUrl(relatedVideo)}
            >
              {relatedVideo.program.title}
            </a>
            <a
              className="player-related__video-title"
              target="_blank"
              rel="noopener noreferrer"
              href={getRelatedVideoUrl(relatedVideo)}
            >
              {relatedVideo.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedScreen;
