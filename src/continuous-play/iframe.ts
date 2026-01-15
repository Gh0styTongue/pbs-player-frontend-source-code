import * as iframe from '../lib/iframe';
import { featureTrackingEvent } from '../analytics/google-analytics-4';
import { Context } from '../bridge';
import { ContinuousPlayData } from '../lib/api';

export function sendContinuousPlayCommand(
  passive?: boolean,
  command?: string,
  continuousPlayData?: ContinuousPlayData,
  context?: Context,
): void {
  if (!continuousPlayData) {
    return;
  }

  featureTrackingEvent(
    {
      feature_category: 'continuous play',
      feature_name: 'continuous play command',
      object_action: passive ? 'next video - passive' : 'next video - active',
      object_action_behavior: 'sends next video command to parent iframe',
    },
    context,
  );

  const message = JSON.stringify({
    type: 'command',
    command: command,
    payload: {
      slug: continuousPlayData.slug,
    },
  });
  iframe.sendParentPostMessage(message);
}
