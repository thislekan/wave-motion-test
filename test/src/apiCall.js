import streamlineAudioData from "./bucketingAlgorithm";

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 *
 * @param {*} res - the file fetched using the fetch API, to be converted to arrayBuffer
 */
const handleResponse = res => {
  return res.arrayBuffer().then(data => {
    if (res.ok) {
      return data;
    } else {
      let error = Object.assign({}, res, {
        status: res.status,
        statusText: res.statusText,
        message: data
      });
      return Promise.reject(error);
    }
  });
};

/**
 *
 * @param {[]} data - contains the arrayBuffer fetched/converted from the audio file
 */
const convertData = async data => {
  const src = await audioCtx.decodeAudioData(data).then(async buffer => {
    const streamlined = await streamlineAudioData(buffer);
    return streamlined; // audio file converted into Float32Array of the loudest volume at a point in time using a bucket algorithm
  });
  return src;
};

/**
 *
 * @param {String} endpoint - the endpoint to be visited
 */
const apiCall = async endpoint => {
  let data;
  let apiError;

  await fetch(endpoint)
    .then(handleResponse)
    .then(audioData => (data = convertData(audioData)))
    .catch(err => (apiError = err));

  if (apiError) return { ...apiError };
  return data;
};

export default apiCall;
