interface Resolution {
  width: number;
  height: number;
}

/**
 * Helper function for manipulating ITS image resolution.
 */
export const specifyResolution = (
  fullResolutionImage: string,
  desiredResolution: Resolution
): string => {
  if (!fullResolutionImage?.includes('://image.pbs.org/')) {
    // if image not hosted via ITS, do not modify the image url
    return fullResolutionImage;
  }

  const { width, height } = desiredResolution;
  try {
    const url = new URL(fullResolutionImage);
    url.searchParams.set('crop', `${width}x${height}`);
    url.searchParams.set('format', 'auto');
    return url.toString();
  } catch (e) {
    return fullResolutionImage;
  }
};
