const NUMBER_OF_BUCKETS = 100; // number of bars (wave) that I choose to the represent the audio file by

/**
 *
 * @param {[]} buffer - the arrayBuffer from fetch API
 */
const streamlineAudioData = async buffer => {
  const decodedAudioData = await buffer.getChannelData(0);
  let bucketDataSize = Math.floor(decodedAudioData.length / NUMBER_OF_BUCKETS);
  let buckets = [];

  for (var i = 0; i < NUMBER_OF_BUCKETS; i++) {
    let startingPoint = i * bucketDataSize;
    let endingPoint = i * bucketDataSize + bucketDataSize;
    let max = 0;
    for (var j = startingPoint; j < endingPoint; j++) {
      if (decodedAudioData[j] > max) {
        max = decodedAudioData[j];
      }
    }
    let size = Math.abs(max);
    buckets.push(size / 2);
  }
  console.log(buckets);
  return buckets;
};

export default streamlineAudioData;
